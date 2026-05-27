import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, DOCUMENT, ElementRef, QueryList, ViewChildren, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';
import { SwiperService } from '../../services/swiper.service';
import { WishlistService } from '../../services/wishlist.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';
import { DynamicAssetLoaderService } from '../../services/dynamic-asset-loader.service';
declare const Plyr: any;

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})

export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  /** Confirmed homepage SEO copy (fallback when API hasn’t loaded yet). */
  private static readonly HOME_H1_FALLBACK = 'Premium Sarees in Chennai, Crafted for Every Occasion';

  /** Matches `index.html` preload for `.dynamic-height` when masthead is not measurable yet.
   *  Default 74 mirrors the mobile-first fallback (`assets/header/type-5.scss` -> `.cd-main-header { height: 74px }`).
   *  Desktop measurement (`getMastheadHeightPx`) will refine to 78 once `#headroom-head` is in the DOM. */
  private static readonly MASTHEAD_FALLBACK_PX = 74;

  /** Desktop-only cap so hero doesn't consume entire viewport. */
  private static readonly DESKTOP_HERO_MAX_PX = 640;

  /**
   * Bound in template for full-bleed hero (`fs_slider`) so SSR / view-source never emits invalid CSS.
   * Updated on the client after masthead height is known.
   */
  fullBleedHeroHeightCss = `calc(100vh - ${HomeComponent.MASTHEAD_FALLBACK_PX}px)`;

  get fsHeroHeightStyle(): string | null {
    return this.template_setting?.primary_slider === 'fs_slider' ? this.fullBleedHeroHeightCss : null;
  }

  styleIndex: number = 0; maxWidth: number = 720;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting = environment.template_setting;

  /** CMS-relative paths (`uploads/...`) prepend `img_baseurl`; `/...` and `http(s)` stay unchanged. */
  resolveUploadedImg(path: string | undefined): string {
    if (!path) return '';
    const p = path.trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('/')) return p;
    return this.imgBaseUrl + p;
  }

  /** First-slide LCP: use self-hosted asset when configured (CMS cannot replace CDN path). */
  private patchStaticMobileHeroOnPrimaryList(): void {
    const u = environment.staticMobileHeroWebpUrl?.trim();
    const list = this.commonService.primary_main_slider;
    if (!u || !list?.length) return;
    const first = list[0];
    if (first) first.mobile_img = u;
  }
  plyrLoaded: boolean; subscription: Subscription;
  storeSubscription: Subscription; pageLoader: boolean;
  private headerResizeObserver: ResizeObserver | undefined;
  private sliderHeightResizeTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly boundOnWindowResize = (): void => {
    if (this.sliderHeightResizeTimer !== undefined) {
      clearTimeout(this.sliderHeightResizeTimer);
    }
    this.sliderHeightResizeTimer = setTimeout(() => {
      this.sliderHeightResizeTimer = undefined;
      this.setSliderHeight();
    }, 150);
  };
  currType: string; activeIndex = 0;

  /** ARIA tabs state for the "Shop by Occasion" homepage block. */
  occasionActiveIndex = 0;

  @ViewChildren('occasionTab') private occasionTabEls!: QueryList<ElementRef<HTMLElement>>;

  @ViewChildren('mtfpTab') private mtfpTabEls!: QueryList<ElementRef<HTMLElement>>;

  @ViewChildren('flexibleContent') private flexibleContentEls!: QueryList<ElementRef<HTMLElement>>;

  flexibleExpandedByIndex: Record<number, boolean> = {};
  flexibleShowToggleByIndex: Record<number, boolean> = {};
  private flexibleMeasureTimer: ReturnType<typeof setTimeout> | undefined;

  showScrollTop = false;
  private readonly scrollTopThresholdPx = 500;
  private scrollTopRafScheduled = false;
  private readonly boundPassiveScrollTop = (): void => {
    if (!isPlatformBrowser(this.platformId) || this.scrollTopRafScheduled) return;
    this.scrollTopRafScheduled = true;
    requestAnimationFrame(() => {
      this.scrollTopRafScheduled = false;
      const y =
        window.scrollY ||
        this.document.documentElement?.scrollTop ||
        this.document.body?.scrollTop ||
        0;
      const next = y > this.scrollTopThresholdPx;
      if (next === this.showScrollTop) return;
      this.ngZone.run(() => {
        this.showScrollTop = next;
      });
    });
  };

  private slugify(name: unknown): string {
    const raw = typeof name === 'string' ? name : '';
    const slug = raw
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'tab';
  }

  getOccasionTabId(name: unknown): string {
    return `home-occasion-tab-${this.slugify(name)}`;
  }

  getOccasionPanelId(name: unknown): string {
    return `home-occasion-panel-${this.slugify(name)}`;
  }

  setOccasionActiveIndex(next: number): void {
    const tabs = this.occasionTabEls?.toArray() ?? [];
    const max = Math.max(0, tabs.length - 1);
    const clamped = Number.isFinite(next) ? Math.min(Math.max(0, next), max) : 0;
    this.occasionActiveIndex = clamped;
    // Keep focus on the active tab after activation (Enter/Space/click).
    setTimeout(() => this.focusOccasionTab(clamped));
  }

  private focusOccasionTab(index: number): void {
    const el = this.occasionTabEls?.toArray()?.[index]?.nativeElement;
    if (el && typeof (el as any).focus === 'function') {
      el.focus();
    }
  }

  onOccasionTabKeydown(event: KeyboardEvent, index: number, count: number): void {
    const key = event.key;
    if (!count || count < 1) return;

    const last = count - 1;
    const nextIndex = (n: number) => (n + count) % count;

    switch (key) {
      case 'ArrowRight':
      case 'Right': // legacy
        event.preventDefault();
        this.focusOccasionTab(nextIndex(index + 1));
        return;
      case 'ArrowLeft':
      case 'Left': // legacy
        event.preventDefault();
        this.focusOccasionTab(nextIndex(index - 1));
        return;
      case 'Home':
        event.preventDefault();
        this.focusOccasionTab(0);
        return;
      case 'End':
        event.preventDefault();
        this.focusOccasionTab(last);
        return;
      case 'Enter':
      case ' ':
      case 'Spacebar': // legacy
        event.preventDefault();
        this.setOccasionActiveIndex(index);
        return;
      default:
        return;
    }
  }

  /** Tabs data for "Multi-tab Featured Products" section. */
  getMtfpTabs(segment: any): any[] {
    const list = Array.isArray(segment?.multitab_list) ? segment.multitab_list : [];
    const min = this.swiperService?.multi_tab_featured_products?.card_count ?? 0;
    return list.filter((t: any) => (t?.product_list?.length ?? 0) >= min);
  }

  getMtfpTabId(sectionIndex: number, tabName: unknown): string {
    return `home-mtfp-tab-${sectionIndex}-${this.slugify(tabName)}`;
  }

  getMtfpPanelId(sectionIndex: number, tabName: unknown): string {
    return `home-mtfp-panel-${sectionIndex}-${this.slugify(tabName)}`;
  }

  setMtfpActiveIndex(next: number, count: number): void {
    const max = Math.max(0, (count ?? 0) - 1);
    const clamped = Number.isFinite(next) ? Math.min(Math.max(0, next), max) : 0;
    this.activeIndex = clamped;
    setTimeout(() => this.focusMtfpTab(clamped));
  }

  private focusMtfpTab(index: number): void {
    const el = this.mtfpTabEls?.toArray()?.[index]?.nativeElement;
    if (el && typeof (el as any).focus === 'function') {
      el.focus();
    }
  }

  onMtfpTabKeydown(event: KeyboardEvent, index: number, count: number): void {
    const key = event.key;
    if (!count || count < 1) return;

    const last = count - 1;
    const nextIndex = (n: number) => (n + count) % count;

    switch (key) {
      case 'ArrowRight':
      case 'Right':
        event.preventDefault();
        this.focusMtfpTab(nextIndex(index + 1));
        return;
      case 'ArrowLeft':
      case 'Left':
        event.preventDefault();
        this.focusMtfpTab(nextIndex(index - 1));
        return;
      case 'Home':
        event.preventDefault();
        this.focusMtfpTab(0);
        return;
      case 'End':
        event.preventDefault();
        this.focusMtfpTab(last);
        return;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        this.setMtfpActiveIndex(index, count);
        return;
      default:
        return;
    }
  }

  /** Visible H1 copy from store SEO (fallback: store name, then “Home”). */
  get homeMainHeading(): string {
    const raw = this.commonService.seo_details?.h1_tag;
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
    return HomeComponent.HOME_H1_FALLBACK;
  }

  /** Built-in hero block (`primary_main_slider`) — page H1 sits on this slider when shown. */
  get hasPrimaryMainHero(): boolean {
    return !!(
      this.template_setting?.primary_slider &&
      this.commonService?.primary_main_slider?.length
    );
  }

  /**
   * When there is no primary hero block, the first layout slider hosts the sole page H1.
   */
  showHomeH1OnLayoutSegment(segment: { type?: string; image_list?: unknown[] }): boolean {
    if (this.hasPrimaryMainHero) {
      return false;
    }
    if (!segment?.image_list?.length) {
      return false;
    }
    if (segment.type !== 'primary_slider' && segment.type !== 'slider') {
      return false;
    }
    const list = this.commonService.layout_list ?? [];
    const sorted = [...list].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    const firstHero = sorted.find(
      (s) =>
        (s.type === 'primary_slider' || s.type === 'slider') &&
        s.image_list?.length,
    );
    return firstHero === segment;
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private storeApi: StoreApiService, public swiperService: SwiperService,
    private sanitizer: DomSanitizer, public commonService: CommonService, private router: Router, public ws: WishlistService,
    public cc: CurrencyConversionService, @Inject(DOCUMENT) private document, private assetLoader: DynamicAssetLoaderService,
    private ngZone: NgZone
  ) {
    this.subscription = this.commonService.currency_type.subscribe(() => {
      this.findCurrency();
    });
    this.storeSubscription = this.commonService.storeDetailsReceived.subscribe(() => {
      this.loadHomeContent();
    });
    
  }

  ngOnInit(): void {
    this.setSliderHeight();
    // JSON-LD — rebuilt when `applyHomePageJsonLd()` runs (initial + after store/footer APIs).
    this.commonService.applyHomePageJsonLd();
    if(!this.commonService.contact_page_info) {
      // Defer this non-critical API call until the browser is idle so it doesn't
      // compete with hero image loading and first-render work (reduces TBT).
      const fetchContactInfo = () => {
        this.pageLoader = true;
        this.storeApi.CONTACT_PAGE_INFO().subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) {
            this.commonService.contact_page_info = result.data;
            if(this.commonService.contact_page_info.map_url) {
              this.commonService.contact_page_info.map_url = this.sanitizer.bypassSecurityTrustResourceUrl(this.commonService.contact_page_info.map_url);
            }
          }
          else {
            console.log("response", result);
            this.commonService.contact_page_info = {};
          }
        });
      };
      if (isPlatformBrowser(this.platformId) && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(fetchContactInfo, { timeout: 3000 });
      } else {
        fetchContactInfo();
      }
    }
    
  }

  ngAfterContentInit() {
    if(this.commonService.storeLoaded) this.loadHomeContent();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.refreshFlexibleToggles();
    this.updateScrollTopVisibility();
    window.addEventListener('scroll', this.boundPassiveScrollTop, { passive: true });

    if (environment.template_setting.primary_slider === 'fs_slider') {
      this.setSliderHeight();
      window.addEventListener('resize', this.boundOnWindowResize);
      const head = this.document.getElementById('headroom-head');
      if (typeof ResizeObserver !== 'undefined' && head) {
        this.headerResizeObserver = new ResizeObserver(() => this.setSliderHeight());
        this.headerResizeObserver.observe(head);
      }
    }
  }

  private updateScrollTopVisibility(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const y =
      window.scrollY ||
      this.document.documentElement?.scrollTop ||
      this.document.body?.scrollTop ||
      0;
    this.showScrollTop = y > this.scrollTopThresholdPx;
  }

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  toggleFlexibleExpanded(index: number): void {
    this.flexibleExpandedByIndex[index] = !this.flexibleExpandedByIndex[index];
  }

  private refreshFlexibleToggles(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.flexibleMeasureTimer !== undefined) {
      clearTimeout(this.flexibleMeasureTimer);
    }
    this.flexibleMeasureTimer = setTimeout(() => {
      this.flexibleMeasureTimer = undefined;
      const els = this.flexibleContentEls?.toArray() ?? [];
      const isMobile = (this.commonService?.screen_width ?? 0) <= 767;
      const collapsedMax = isMobile ? 360 : 520;
      els.forEach((ref, idx) => {
        const el = ref?.nativeElement;
        if (!el) return;
        const contentHeight = el.scrollHeight || 0;
        this.flexibleShowToggleByIndex[idx] = contentHeight > collapsedMax + 24;
        if (!this.flexibleShowToggleByIndex[idx]) {
          this.flexibleExpandedByIndex[idx] = true;
        } else if (this.flexibleExpandedByIndex[idx] === undefined) {
          this.flexibleExpandedByIndex[idx] = false;
        }
      });
    }, 50);
  }

  /** Pixel height of `#headroom-head` for full-bleed slider offset; safe on missing DOM / SSR. */
  private getMastheadHeightPx(): number {
    const raw = this.document.getElementById('headroom-head')?.offsetHeight;
    return typeof raw === 'number' && !Number.isNaN(raw) ? raw : HomeComponent.MASTHEAD_FALLBACK_PX;
  }

  loadHomeContent() {
    this.setSliderHeight();
    /* LAYOUT DETAILS */
    if(!this.commonService.layout_list.length) {
      this.storeApi.LAYOUT_LIST().subscribe(result => {
        if(result.status) {
          let layoutList = result.list.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
          layoutList.push({
            type: 'instagram',
            image_list: [
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta1.png' },
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta2.png' },
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta3.png' },
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta1.png' },
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta2.png' },
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta3.png' },
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta1.png' },
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta2.png' },
              { permalink: 'https://www.instagram.com/tulsisilks', media_url: 'assets/images/insta3.png' }
            ],
            heading: "Connect With Us",
            sub_heading: "See how our silks shine in real life",
            blogs_type: "slider",
            rank: layoutList.length+1
          });
          let occasionList = layoutList.filter(el => el.heading=='occasion');
          layoutList = layoutList.filter(el => el.heading!='occasion' && el.type!='multiple_featured_product');
          if(occasionList.length) {
            layoutList.push({
              "active_status": true,
              "_id": occasionList[0]._id,
              "rank": occasionList[0].rank,
              "type": "multiple_featured_section",
              "name": "Our Occasion",
              "heading": "Shop by Occasion",
              "sub_heading": "From everyday to celebrations",
              "store_id": occasionList[0].store_id,
              "image_list": [],
              "created_on": occasionList[0].created_on,
              "updated_on": occasionList[0].updated_on,
              "multitab_list": occasionList
            });
          }
          this.updateLayoutList(layoutList);
          this.findCurrency();
          setTimeout(() => { this.initializeSwiper(layoutList); }, 100);
        }
        else console.log("home response", result);
      });
    }
    else {
      this.findCurrency();
      setTimeout(() => { this.initializeSwiper(this.commonService.layout_list); }, 100);
    }
    this.commonService.applyHomePageJsonLd();
    // Homepage JSON-LD — no separate BreadcrumbList (avoids duplicate with single-item crumbs).
  }

  updateLayoutList(layoutList) {
    // Blogs
    let blogIndex = layoutList.findIndex(obj => obj.type=='blogs');
    if(blogIndex!=-1 && this.commonService.ys_features.indexOf('blogs')!=-1) {
      let blogData = layoutList[blogIndex];
      if(!this.commonService?.desktop_device && blogData.blogs_type=='grid') {
        blogData.blogs_type = 'slider';
      }
      this.storeApi.HOME_PAGE_BLOG_LIST(this.template_setting.blog_count).subscribe(result => {
        if(result.status) {
          let blogList = result.list;
          if(blogList.length) {
            let bCount = this.swiperService.blogs.card_count;
            if(blogData.blogs_type=='grid') {
              bCount = 4;
            }
            let pendingBlogCount = bCount - blogList.length;
            for(let i=0; i<pendingBlogCount; i++)
            {
              blogList = blogList.concat(blogList);
              if(blogList.length >= bCount) { break; }
            }
            if(blogData.blogs_type=='grid') blogData.image_list = blogList.slice(0, bCount);
            else blogData.image_list = blogList.slice(0, this.template_setting.blog_count);
          }
        }
        else console.log("blog response", result);
      });
    }
    // Instagram
    let instaIndex = layoutList.findIndex(obj => obj.type=='instagram');
    if(instaIndex!=-1 && layoutList[instaIndex].insta_config?.token) {
      let instaData = layoutList[instaIndex];
      this.storeApi.INSTAGRAM(layoutList[instaIndex].insta_config.token).subscribe((result) => {
        if(result.data) {
          let InstaPosts = result.data.filter(el => el.media_type!="VIDEO");
          if(InstaPosts.length) {
            let iCount = this.swiperService.instagram.card_count;
            if(instaData.blogs_type=='grid') {
              if(instaData.section_grid_type=='grid_1') iCount = 3;
              else if(instaData.section_grid_type=='grid_2') iCount = 6;
              else if(instaData.section_grid_type=='grid_3') iCount = 9;
              else if(instaData.section_grid_type=='grid_4') iCount = 4;
              else if(instaData.section_grid_type=='grid_5') iCount = 8;
            }
            let pendingInstaCount = iCount - InstaPosts.length;
            for(let i=0; i<pendingInstaCount; i++)
            {
              InstaPosts = InstaPosts.concat(InstaPosts);
              if(InstaPosts.length >= iCount) { break; }
            }
            if(instaData.blogs_type=='grid') instaData.image_list = InstaPosts.slice(0, iCount);
            else instaData.image_list = InstaPosts.slice(0, 10);
          }
        }
        else console.log("insta response", result);
      });
    }
    // shopping assistant
    if(layoutList.findIndex(obj => obj.type=='shopping_assistant')!=-1 && this.commonService.ys_features.indexOf('shopping_assistant')!=-1) {
      this.storeApi.AI_STYLES().subscribe(result => {
        if(result.status) this.commonService.ai_styles = JSON.parse(result.list);
      });
    }
    for(let segment of layoutList) {
      if(segment.sub_heading) segment.sub_heading = segment.sub_heading.replace(new RegExp('\n', 'g'), "<br />");
      if(segment.type=="slider" || segment.type=="primary_slider" || segment.type=="multiple_highlighted_section") {
        for(let obj of segment.image_list) {
          if(obj.content_status && obj.content_details) {
            if(obj.content_details.sub_heading) obj.content_details.sub_heading = obj.content_details.sub_heading.replace(new RegExp('\n', 'g'), "<br />");
            if(obj.content_details.description) obj.content_details.description = obj.content_details.description.replace(new RegExp('\n', 'g'), "<br />");
          }
        }
      }
      else if(segment.type=="section") {
        segment.image_list.forEach(el => {
          if(el.link_status && el.link_type=='category') {
            let cInd = this.commonService.catalog_list.findIndex(c => c._id==el.category_id);
            if(cInd!=-1) {
              el.link_type = 'internal';
              el.link = '/category/'+this.commonService.catalog_list[cInd]._id;
              if(this.commonService.catalog_list[cInd].seo_status) el.link = '/category/'+this.commonService.catalog_list[cInd].seo_details?.page_url;
            }
          }
        });
        if(segment.section_grid_type=="grid_8" && this.commonService.screen_width>767) {
          let imgList = segment.image_list;
          segment.image_list = [];
          imgList.forEach((element, index) => {
            if(index===4) segment.image_list.push(imgList[5]);
            else if(index===5) segment.image_list.push(imgList[4]);
            else segment.image_list.push(element);
          });
        }
      }
      else if(segment.type=="featured_product") {
        if(!this.commonService?.desktop_device && segment.blogs_type=='grid') {
          segment.blogs_type = 'slider';
        }
        if(!segment.slider_type && segment.blogs_type=='slider') {
          if(!this.currType) this.currType = 'two';
          segment.slider_type = (this.currType==='one')? 'two': 'one';
          this.currType = segment.slider_type;
        }
        let cardCount = this.swiperService.featured_products.card_count;
        segment.product_list.forEach(obj => {
          obj.created_on = new Date(new Date(new Date(obj.created_on).setHours(23,59,59,59)).setDate(new Date(obj.created_on).getDate() + 30));
          if(obj.badge_list?.length) obj.badge_list = this.commonService.buildTags(obj.badge_list);
          if(obj.hold_till) {
            let balanceStock = obj.stock;
            if(new Date() < new Date(obj.hold_till)) balanceStock = obj.stock - obj.hold_qty;
            obj.stock = balanceStock;
          }
        });
        if(segment.product_list.length && cardCount > segment.product_list.length) {
          let remaining = cardCount - segment.product_list.length;
          for(let i=0; i<remaining; i++)
          {
            segment.product_list = segment.product_list.concat(segment.product_list);
            if(segment.product_list.length >= cardCount) {
              segment.product_list.length = cardCount;
              break;
            }
          }
        }
      }
      else if(segment.type=="featured_section") {
        let cardCount = this.swiperService.featured_section.card_count;
        if(segment.image_list.length && cardCount > segment.image_list.length) {
          let remaining = cardCount - segment.image_list.length;
          for(let i=0; i<remaining; i++)
          {
            segment.image_list = segment.image_list.concat(segment.image_list);
            if(segment.image_list.length >= cardCount) {
              segment.image_list.length = cardCount;
              break;
            }
          }
        }
      }
      else if(segment.type=="testimonial") {
        let cardCount = this.swiperService.testimonial.card_count;
        if(segment.image_list.length && cardCount > segment.image_list.length) {
          let remaining = cardCount - segment.image_list.length;
          for(let i=0; i<remaining; i++)
          {
            segment.image_list = segment.image_list.concat(segment.image_list);
            if(segment.image_list.length >= cardCount) {
              segment.image_list.length = cardCount;
              break;
            }
          }
        }
      }
      else if(segment.type=="multiple_featured_product") {
        let cardCount = this.swiperService.multi_tab_featured_products.card_count;
        for(let tab of segment.multitab_list) {
          tab.blogs_type = 'slider';
          tab.activeIndex = 0;
          if(this.commonService?.desktop_device) tab.blogs_type = 'grid';
          tab.product_list.forEach(obj => {
            obj.created_on = new Date(new Date(new Date(obj.created_on).setHours(23,59,59,59)).setDate(new Date(obj.created_on).getDate() + 30));
            if(obj.badge_list?.length) obj.badge_list = this.commonService.buildTags(obj.badge_list);
            if(obj.hold_till) {
              let balanceStock = obj.stock;
              if(new Date() < new Date(obj.hold_till)) balanceStock = obj.stock - obj.hold_qty;
              obj.stock = balanceStock;
            }
          });
          let remaining = cardCount - tab.product_list.length;
          for(let i=0; i<remaining; i++)
          {
            tab.product_list = tab.product_list.concat(tab.product_list);
            if(tab.product_list.length >= cardCount) {
              tab.product_list.length = cardCount;
              break;
            }
          }
        }
      }
      else if(segment.type=="shopping_assistant") {
        if(segment.shopping_assistant_config.sub_text)
          segment.shopping_assistant_config.sub_text = segment.shopping_assistant_config.sub_text.replace(new RegExp('\n', 'g'), "<br />");
      }
      else if(segment.type=="flexible") {
        segment.content = this.sanitizer.bypassSecurityTrustHtml(segment.content);
      }
      else if(segment.type === 'store_locator') {
        if(segment.store_locator_config?.map_iframe_url) {
          segment.store_locator_config.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(segment.store_locator_config.map_iframe_url);
        }
      }
    }
    this.commonService.layout_list = layoutList;
    // primary slider
    if(this.template_setting.primary_slider) {
      let sliderIndex = this.commonService.layout_list.findIndex(obj => obj.type=='primary_slider');
      if(sliderIndex!=-1) {
        let primaryImgList = this.commonService.layout_list[sliderIndex].image_list;
        if(primaryImgList.length) {
          this.commonService.primary_main_slider = primaryImgList;
          this.patchStaticMobileHeroOnPrimaryList();
          this.commonService.layout_list.splice(sliderIndex, 1);
        }
      }
    }
    // primary highlights
    let phIndex = this.commonService.layout_list.findIndex(obj => obj.type=='highlights');
    if(phIndex!=-1) {
      let cardCount = this.swiperService.highlights.card_count;
      this.commonService.primary_highlights = this.commonService.layout_list[phIndex].image_list;
      this.commonService.layout_list.splice(phIndex, 1);
      if(this.commonService.primary_highlights.length && cardCount > this.commonService.primary_highlights.length) {
        let remaining = cardCount - this.commonService.primary_highlights.length;
        for(let i=0; i<remaining; i++)
        {
          this.commonService.primary_highlights = this.commonService.primary_highlights.concat(this.commonService.primary_highlights);
          if(this.commonService.primary_highlights.length >= cardCount) {
            this.commonService.primary_highlights.length = cardCount;
            break;
          }
        }
      }
    }
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.refreshFlexibleToggles(), 150);
    }
  }

  tabNavigate(x) {
    let catDetails = null;
    if(x.type=='featured') {
      catDetails = { name: 'Featured Products', route: '/featured-products' };
    }
    else if(x.type=='new_arrivals') {
      catDetails = { name: 'New Arrivals', route: '/new-arrivals' };
    }
    else if(x.type=='discounted') {
      catDetails = { name: 'On Sale', route: '/on-sale' };
    }
    else if(x.type=='category') {
      let cInd = this.commonService.catalog_list.findIndex(el => el._id==x.category_id);
      if(cInd!=-1) {
        let catInfo = this.commonService.catalog_list[cInd];
        catDetails = { name: catInfo.name, seo_status: catInfo.seo_status, seo_details: catInfo.seo_details };
      }
    }
    if(catDetails && isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem("category_details", this.commonService.encryptData(catDetails));
    }
  }

  exploreAll(segment) {
    if(segment.type=="featured_product") {
      if(segment.featured_category_id=="all_products") this.router.navigate(['/all-products']);
      else if(segment.featured_category_id=="new_arrivals") this.router.navigate(['/new-arrivals']);
      else if(segment.featured_category_id=="on_sale") this.router.navigate(['/on-sale']);
      else if(segment.featured_category_id=="featured_products") this.router.navigate(['/featured-products']);
      else if(segment.featured_category_id=="best_sellers") this.router.navigate(['/best-sellers']);
      else this.getCatalogInfo(segment.featured_category_id);
    }
    else if(segment.type=="featured") this.router.navigate(['/featured-products']);
    else if(segment.type=="new_arrivals") this.router.navigate(['/new-arrivals']);
    else if(segment.type=="discounted") this.router.navigate(['/on-sale']);
    else if(segment.type=="category") this.getCatalogInfo(segment.category_id);
  }
  getCatalogInfo(catId) {
    let secIndex = this.commonService.catalog_list.findIndex(obj => obj._id==catId);
    if(secIndex != -1) {
      let categoryDetails = this.commonService.catalog_list[secIndex];
      if(categoryDetails.seo_status) this.router.navigate(['/category/'+categoryDetails.seo_details.page_url]);
      else this.router.navigate(['/category/'+categoryDetails._id]);
    }
  }
  
  findCurrency() {
    for(let layout of this.commonService.layout_list) {
      if(layout.type=="featured_product") {
        for(let product of layout.product_list) {
          this.applyHomeProductCardCurrency(product);
        }
      }
      else if(layout.type=="multiple_featured_product") {
        for(let tab of layout.multitab_list) {
          for(let product of tab.product_list) {
            this.applyHomeProductCardCurrency(product);
          }
        }
      }
    }
  }

  /** Normalizes API prices then applies store currency (used by all home product sliders/grids). */
  private applyHomeProductCardCurrency(product: any): void {
    const sell = Number(product?.selling_price);
    const disc = Number(product?.discounted_price);
    product.temp_selling_price = this.cc.CALC(Number.isFinite(sell) ? sell : 0);
    product.temp_discounted_price = this.cc.CALC(Number.isFinite(disc) ? disc : 0);
  }

  initializeSwiper(layoutList) {
    this.setSliderHeight();
    // plyr
    let vidSections = layoutList.filter(obj => obj.type=='video_section' && obj.video_details?.thumbnail && obj.video_details?.src);
    if(vidSections.length && !this.plyrLoaded) {
      setTimeout(() => {
        let plyrConfig = {
          captions: { active: true }, 
          controls:['play-large', 'mute', 'fullscreen'],
          autoplay: false 
        };
        this.assetLoader.load('plyr-js', 'plyr-css').then(() => {
          this.plyrLoaded = true;
          setTimeout(() => {
            vidSections.forEach(vel => {
              new Plyr('#vs-'+vel._id, plyrConfig);
            });
          }, 100);
        });
      }, 500);
    }
  }

  setSliderHeight() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (environment.template_setting.primary_slider !== 'fs_slider') return;
    const raw = this.getMastheadHeightPx();
    const n = Number(raw);
    const mastHeight = Number.isFinite(n) && n >= 0 ? Math.trunc(n) : HomeComponent.MASTHEAD_FALLBACK_PX;
    const vw =
      typeof window !== 'undefined'
        ? window.innerWidth || this.document.documentElement?.clientWidth || 0
        : 0;
    const base = `calc(100vh - ${mastHeight}px)`;
    this.fullBleedHeroHeightCss =
      vw > this.maxWidth
        ? `min(${base}, ${HomeComponent.DESKTOP_HERO_MAX_PX}px)`
        : base;
    // Skip the write when height already matches to avoid a CLS-triggering repaint.
    const computed = parseInt(window.getComputedStyle(this.document.body).marginTop || '0', 10);
    if (mastHeight !== computed) {
      this.document.body.style.marginTop = `${mastHeight}px`;
    }
  }

  /* AI Styling */
  openAiStyleModal(modalName) {
    this.styleIndex = 0;
    modalName.show();
    this.commonService.scrollModalTop(500);
    this.commonService.ai_styles[this.styleIndex].filtered_option_list = this.commonService.ai_styles[this.styleIndex].option_list;
    if(this.commonService.ai_styles[this.styleIndex].type=='either_or') {
      this.commonService.ai_styles[this.styleIndex].selected_option = this.commonService.ai_styles[this.styleIndex].filtered_option_list[0]._id;
      this.getRadioNextList(this.commonService.ai_styles[this.styleIndex].selected_option)
    }
    else {
      this.commonService.ai_styles[this.styleIndex].filtered_option_list.forEach(obj => {
        delete obj.aistyle_option_checked;
      });
    }
  }

  getRadioNextList(optionId) {
    let currentStyleDetails = this.commonService.ai_styles[this.styleIndex];
    // if next option list exist
    if(this.commonService.ai_styles[this.styleIndex+1])
    {
      let optionIndex = currentStyleDetails.option_list.findIndex(obj => obj._id==optionId);
      if(optionIndex!=-1) {
        let currentSelectedOption = currentStyleDetails.option_list[optionIndex];
        let filterList = this.commonService.ai_styles[this.styleIndex+1].option_list;
        this.commonService.ai_styles[this.styleIndex+1].filtered_option_list = filterList.filter(obj => obj.link_to=='all' || obj.link_to==currentSelectedOption.heading);
      }
    }
  }
  getCheckboxNextList() {
    // if next option list exist
    if(this.commonService.ai_styles[this.styleIndex+1])
    {
      let selectedItems = [];
      this.commonService.ai_styles[this.styleIndex].filtered_option_list.forEach(obj => {
        if(obj.aistyle_option_checked) selectedItems.push(obj.heading);
      });
      let filterList = this.commonService.ai_styles[this.styleIndex+1].option_list;
      this.commonService.ai_styles[this.styleIndex+1].filtered_option_list = filterList.filter(obj => obj.link_to=='all' || selectedItems.indexOf(obj.link_to)!=-1);
    }
  }
  onStyleNext() {
    this.styleIndex = this.styleIndex+1;
    this.commonService.scrollModalTop(0);
    if(this.commonService.ai_styles[this.styleIndex].type=='either_or') {
      if(this.commonService.ai_styles[this.styleIndex].selected_option) {
        if(this.commonService.ai_styles[this.styleIndex].filtered_option_list.findIndex(obj => obj._id==this.commonService.ai_styles[this.styleIndex].selected_option) == -1) {
          this.commonService.ai_styles[this.styleIndex].selected_option = this.commonService.ai_styles[this.styleIndex].filtered_option_list[0]._id;
        }
      }
      else {
        this.commonService.ai_styles[this.styleIndex].selected_option = this.commonService.ai_styles[this.styleIndex].filtered_option_list[0]._id;
      }
      this.getRadioNextList(this.commonService.ai_styles[this.styleIndex].selected_option);
    }
  }

  onStylingFilter() {
    this.processAiStyles(this.commonService.ai_styles).then((selectedData) => {
      if(Object.entries(selectedData).length) {
        if(isPlatformBrowser(this.platformId)) sessionStorage.setItem("ai_styles", this.commonService.encryptData(selectedData));
        this.router.navigate(["/recommended-products"]);
      }
    });
  }
  processAiStyles(list) {
    return new Promise((resolve, reject) => {
      let sendData = {};
      for(let section of list) {
        let styleList = [];
        if(section.type=='either_or') styleList.push(section.selected_option);
        else if(section.filtered_option_list) {
          section.filtered_option_list.forEach(option => {
            if(option.aistyle_option_checked) styleList.push(option._id);
          });
        }
        if(styleList.length) sendData[section._id] = styleList;
      }
      resolve(sendData);
    });
  }
  /* ### AI Styling ### */

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.boundPassiveScrollTop);
      window.removeEventListener('resize', this.boundOnWindowResize);
      if (this.sliderHeightResizeTimer !== undefined) {
        clearTimeout(this.sliderHeightResizeTimer);
      }
      this.headerResizeObserver?.disconnect();
    }
    this.subscription.unsubscribe();
    this.storeSubscription.unsubscribe();
    this.commonService.removeElement('home-jsonld');
    this.commonService.removeElement('business-jsonld');
    this.commonService.removeElement('web-jsonld');
  }

}