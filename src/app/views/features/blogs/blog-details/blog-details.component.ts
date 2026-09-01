import {
  Component,
  OnInit,
  Renderer2,
  HostListener,
  ElementRef,
  Inject,
  PLATFORM_ID,
  DOCUMENT,
  AfterViewInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { StoreApiService } from '../../../../services/store-api.service';
import { CartlistService } from '../../../../services/cartlist.service';
import { CommonService } from '../../../../services/common.service';
import { SwiperService } from '../../../../services/swiper.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';
import { Subscription } from 'rxjs';

declare const $: any;

@Component({
    selector: 'app-blog-details',
    templateUrl: './blog-details.component.html',
    styleUrls: ['./blog-details.component.scss'],
    standalone: false
})

export class BlogDetailsComponent implements OnInit, AfterViewInit, OnDestroy {

  blog_details: any = {};
  descriptionHtml: SafeHtml = '';
  pageLoader = false;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  storeSubscription: Subscription;
  subscription: Subscription;
  bcList: any = [];
  /** Prevents double-submit while blog product CTA fetch/add runs */
  private ejProductCtaBusy = false;
  /** Document capture listener cleanup — intercept CTA before `<a href>` default navigation */
  private ejProductCtaCaptureCleanup?: () => void;
  /** Smooth-scroll hash links inside Editor.js rendered HTML (TOC, inline anchors). */
  private ejHashLinkCaptureCleanup?: () => void;
  showScrollTools = false;
  private readonly scrollToolsThresholdPx = 520;
  private scrollToolsRafScheduled = false;
  private readonly boundPassiveBlogScrollTools = (): void => {
    if (!isPlatformBrowser(this.platformId) || this.scrollToolsRafScheduled) return;
    this.scrollToolsRafScheduled = true;
    requestAnimationFrame(() => {
      this.scrollToolsRafScheduled = false;
      const next = (window.scrollY || 0) > this.scrollToolsThresholdPx;
      if (next === this.showScrollTools) return;
      this.ngZone.run(() => {
        this.showScrollTools = next;
      });
    });
  };
  private readonly tocAnchorId = 'ej-toc';
  relatedBlogs: any[] = [];
  relatedBlogsLoading = false;

  constructor(
    private router: Router, private storeApi: StoreApiService, private activeRoute: ActivatedRoute, public swiperService: SwiperService,
    public commonService: CommonService, private sanitizer: DomSanitizer, private datePipe: DatePipe, private renderer: Renderer2,
    public cc: CurrencyConversionService,
    private readonly hostRef: ElementRef<HTMLElement>,
    private readonly cartService: CartlistService,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly ngZone: NgZone
  ) {
    this.subscription = this.commonService.currency_type.subscribe(() => {
      this.findCurrency();
    });
    this.storeSubscription = this.commonService.storeDataListener.subscribe(() => {
      this.getData();
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const handler = (event: Event) => {
        const raw = event.target as Node | null;
        const el =
          raw instanceof Element ? (raw as HTMLElement) : raw?.parentElement ?? null;
        if (!el) return;
        const btn = el.closest('a.ej-product-cta-btn');
        if (!btn || !this.hostRef.nativeElement.contains(btn)) return;
        event.preventDefault();
        event.stopPropagation();
        this.onEjProductCtaClick(btn as HTMLAnchorElement);
      };
      document.addEventListener('click', handler, true);
      this.ejProductCtaCaptureCleanup = () =>
        document.removeEventListener('click', handler, true);

      const hashHandler = (event: Event) => {
        const raw = event.target as Node | null;
        const el =
          raw instanceof Element ? (raw as HTMLElement) : raw?.parentElement ?? null;
        if (!el) return;
        const a = el.closest('a[href^="#"]') as HTMLAnchorElement | null;
        if (!a || !this.hostRef.nativeElement.contains(a)) return;
        const href = a.getAttribute('href') ?? '';
        const id = href.replace(/^#/, '').trim();
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();
        try {
          // Keep URL in sync without triggering native jump.
          const path =
            (window.location?.pathname ?? '') + (window.location?.search ?? '');
          window.history.replaceState(null, '', `${path}#${id}`);
        } catch {
          /* ignore */
        }
        this.scrollToArticleFragment(id, target, 'smooth');
      };
      document.addEventListener('click', hashHandler, true);
      this.ejHashLinkCaptureCleanup = () =>
        document.removeEventListener('click', hashHandler, true);
    }
    if (this.commonService.storeDataLoaded) this.getData();
    else this.pageLoader = true;
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.addEventListener('scroll', this.boundPassiveBlogScrollTools, { passive: true });
    // Initial sync (same threshold as former @HostListener).
    if ((window.scrollY || 0) > this.scrollToolsThresholdPx) {
      this.showScrollTools = true;
    }
  }

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const y = window.scrollY || 0;
    // Single button UX: if user is below TOC, jump to TOC; else jump to TOP.
    const tocEl = document.getElementById(this.tocAnchorId);
    if (tocEl) {
      const tocY = tocEl.getBoundingClientRect().top + window.scrollY;
      if (y > tocY + 120) {
        this.scrollToToc();
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToToc(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById(this.tocAnchorId);
    if (!el) return;
    this.scrollToArticleFragment(this.tocAnchorId, el, 'smooth');
  }

  getData(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.pageLoader = true;
      this.storeApi.BLOG_DETAILS(params['blog_id']).subscribe(result => {
        if(result.status) {
          this.blog_details = result.data;
          this.normalizeBlogApiFields();
          this.normalizeBlogContentField();
          if(!this.blog_details.segments) this.blog_details.segments = [];
          for(let segment of this.blog_details.segments) {
            if(segment.type=="featured_product") {
              if(!segment.product_list) segment.product_list = [];
              let cardCount = this.swiperService.featured_products.card_count;
              segment.product_list.forEach((obj: any) => {
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
          }
          this.findCurrency();
          this.updateMetaData();
          if (isPlatformBrowser(this.platformId)) this.loadRelatedBlogs();
        }
        else {
          console.log("response", result);
          this.router.navigate(["/"]);
        }
        // Article + TOC anchors exist only when `!pageLoader`; double rAF gives Angular
        // one render cycle after the spinner clears before trying to resolve #section-* ids.
        this.pageLoader = false;
        if (isPlatformBrowser(this.platformId)) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => this.scheduleScrollToUrlFragment());
          });
        }
      });
    });
  }

  private loadRelatedBlogs(): void {
    const current = this.blog_details;
    if (!current) return;
    this.relatedBlogsLoading = true;
    this.storeApi.BLOG_LIST(0, 24).subscribe({
      next: (res) => {
        const list = Array.isArray(res?.list) ? res.list : [];
        const currentId = current?._id != null ? String(current._id) : '';
        const currentSlug = current?.seo_details?.page_url != null ? String(current.seo_details.page_url) : '';
        const currentTags = new Set<string>(
          Array.isArray(current?.tags) ? current.tags.map((t: any) => String(t).toLowerCase()) : []
        );
        const currentCat = current?.category != null ? String(current.category).toLowerCase() : '';

        const base = list.filter((x: any) => {
          if (!x) return false;
          const id = x._id != null ? String(x._id) : '';
          const slug = x?.seo_details?.page_url != null ? String(x.seo_details.page_url) : '';
          if (currentId && id && id === currentId) return false;
          if (currentSlug && slug && slug === currentSlug) return false;
          return true;
        });

        const scored = base
          .map((x: any) => {
            const tags = Array.isArray(x.tags) ? x.tags.map((t: any) => String(t).toLowerCase()) : [];
            let score = 0;
            const cat = x?.category != null ? String(x.category).toLowerCase() : '';
            if (currentCat && cat && cat === currentCat) score += 3;
            if (currentTags.size && tags.length) {
              for (const t of tags) {
                if (currentTags.has(t)) score += 1;
              }
            }
            const ts = x?.created_on ? new Date(x.created_on).getTime() : 0;
            return { x, score, ts };
          })
          .sort((a: any, b: any) => (b.score - a.score) || (b.ts - a.ts))
          .slice(0, 4)
          .map((row: any) => row.x);

        // If scoring yields nothing, fall back to “recent posts” (still excluding current).
        this.relatedBlogs = scored.length ? scored : base.slice(0, 4);
        this.relatedBlogsLoading = false;
      },
      error: () => {
        this.relatedBlogs = [];
        this.relatedBlogsLoading = false;
      },
    });
  }

  onSelectRelatedBlog(_blog: any): void {
    // no-op (blog card navigation handled via routerLink)
  }

  relatedBlogLinkArray(x: any): string[] {
    if (!x) return ['/blogs'];
    if (x.seo_status && x.seo_details?.page_url) return ['/blogs/' + x.seo_details.page_url];
    return ['/blogs/' + x._id];
  }

  exploreAll(segment: any) {
    if(segment.type=="featured_product") {
      if(segment.featured_category_id=="all_products") this.router.navigate(['/all-products']);
      else if(segment.featured_category_id=="new_arrivals") this.router.navigate(['/new-arrivals']);
      else if(segment.featured_category_id=="on_sale") this.router.navigate(['/on-sale']);
      else if(segment.featured_category_id=="featured_products") this.router.navigate(['/featured-products']);
      else this.getCatalogInfo(segment.featured_category_id);
    }
    else if(segment.type=="featured") this.router.navigate(['/featured-products']);
    else if(segment.type=="new_arrivals") this.router.navigate(['/new-arrivals']);
    else if(segment.type=="discounted") this.router.navigate(['/on-sale']);
    else if(segment.type=="category") this.getCatalogInfo(segment.category_id);
  }
  getCatalogInfo(catId: any) {
    let secIndex = this.commonService.catalog_list.findIndex((obj: any) => obj._id==catId);
    if(secIndex != -1) {
      let categoryDetails = this.commonService.catalog_list[secIndex];
      if(categoryDetails.seo_status) this.router.navigate(['/category/'+categoryDetails.seo_details.page_url]);
      else this.router.navigate(['/category/'+categoryDetails._id]);
    }
  }

  updateMetaData() {
    // Keep blog_details.description as a plain string — never mutate it to SafeHtml.
    // SSR TransferState returns the same object reference on the client; mutating it
    // caused our normalization to overwrite the SafeHtml with '' on the second call.
    const raw = this.blog_details.description;
    this.descriptionHtml = this.sanitizer.bypassSecurityTrustHtml(
      typeof raw === 'string' ? raw : ''
    );
    if(this.blog_details.seo_status) {
      let seoImage = this.imgBaseUrl + (this.blog_details.image || this.blog_details.coverImage || '');
      this.commonService.setSiteMetaData(this.blog_details.seo_details, seoImage);
    }
    else this.commonService.getStoreSeoDetails();
    // schema
    if(!this.blog_details.updatedAt) this.blog_details.updatedAt = new Date();
    const blogAuthor = (this.blog_details.author && String(this.blog_details.author).trim())
      ? { "@type": "Person", "name": String(this.blog_details.author).trim() }
      : { "@type": "Organization", "name": this.commonService.store_details?.name, "url": this.commonService.origin };
    let blogSchema: any = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": this.commonService.origin+this.router.url.split('?')[0]
      },
      "headline": this.blog_details.seo_details?.page_title || this.blog_details.name,
      "image": this.imgBaseUrl + (this.blog_details.image || this.blog_details.coverImage || ''),
      "author": blogAuthor,
      "publisher": {
        "@type": "Organization",
        "name": this.commonService.store_details?.name,
        "logo": {
          "@type": "ImageObject",
          "url": environment.img_baseurl+'uploads/'+this.commonService.store_id+'/logo.png?v='+localStorage.getItem('random_num')
        }
      },
      "datePublished": this.datePipe.transform(new Date(this.blog_details.created_on), 'yyyy-MM-ddTHH:mmZ'),
      "dateModified": this.datePipe.transform(new Date(this.blog_details.updatedAt), 'yyyy-MM-ddTHH:mmZ')
    };
    if(this.blog_details.seo_details?.meta_desc) blogSchema['description'] = this.blog_details.seo_details.meta_desc;
    if(Array.isArray(this.blog_details.tags) && this.blog_details.tags.length) blogSchema['keywords'] = this.blog_details.tags.join(', ');
    this.commonService.removeElement('blog-jsonld');
    this.commonService.createJsonLD('blog-jsonld', blogSchema);
    // breadcrumb
    this.bcList = [
      { name: 'Home', position: 1, link: '/' },
      { name: 'Blogs', position: 2, link: '/blogs' },
      {
        name: this.blog_details.name,
        position: 3,
        link: this.router.url.split('?')[0],
      },
    ];
    this.commonService.breadCrumbList(this.bcList);
    // faq
    if(this.blog_details?.faqs?.length) {
      let faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [] as any[]
      };
      this.blog_details.faqs.forEach((el: any) => {
        faqSchema.mainEntity.push({
          "@type": "Question",
          "name": el.ques,
          "acceptedAnswer": { "@type": "Answer", "text": el.answer }
        });
      });
      this.commonService.removeElement('blog-faq-jsonld');
      this.commonService.createJsonLD("blog-faq-jsonld", faqSchema);
    }
  }

  /** First non-empty hero/thumbnail URL fragment from common CMS keys (relative uploads path or absolute). */
  private blogCoverMediaRaw(): string {
    const b = this.blog_details as Record<string, unknown>;
    if (!b || typeof b !== 'object') return '';
    const keys = [
      'image',
      'coverImage',
      'featuredImage',
      'featured_image',
      'banner_image',
      'bannerImage',
      'thumbnail',
      'hero_image',
      'heroImage',
    ];
    for (const k of keys) {
      const v = b[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  }

  /** Map newer/alternate CMS field names onto fields the template already uses. */
  private normalizeBlogApiFields(): void {
    const b = this.blog_details as Record<string, unknown>;
    if (!b || typeof b !== 'object') return;

    const img = b['image'];
    if (!img || String(img).trim() === '') {
      const path = this.blogCoverMediaRaw();
      if (path) b['image'] = path;
    }

    if (!b['img_alt'] && b['imageAlt'] != null && String(b['imageAlt']).trim() !== '') {
      b['img_alt'] = String(b['imageAlt']);
    }

    // Ensure description is a plain string so [innerHTML] never receives a raw object
    // and renders "[object Object]". The updateMetaData sanitizer handles string → SafeHtml.
    if (b['description'] != null && typeof b['description'] !== 'string') {
      const d = b['description'] as any;
      b['description'] = typeof d?.html === 'string' ? d.html : '';
    }
  }

  /** API may send `content` as JSON string; Editor.js expects `{ blocks }`. */
  private normalizeBlogContentField(): void {
    const raw = this.blog_details?.content;
    if (raw == null) return;
    if (typeof raw === 'string') {
      try {
        this.blog_details.content = JSON.parse(raw);
      } catch {
        this.blog_details.content = {};
      }
    }
  }

  /**
   * CMS `editor_type`: `basic` = legacy rich HTML in `description` (Quill shell);
   * `advanced` (legacy alias `editorjs`) = Editor.js `content.blocks` + premium renderer.
   */
  get useEditorJsRenderer(): boolean {
    const et = String(this.blog_details?.editor_type ?? '').toLowerCase();
    if (et !== 'advanced' && et !== 'editorjs') {
      return false;
    }
    const blocks = this.blog_details?.content?.blocks;
    return Array.isArray(blocks) && blocks.length > 0;
  }

  /** Prefix uploads paths from CMS (`/uploads/...`) with API host for img[src]. */
  blogAssetUrl(path: string | undefined): string {
    if (!path) return '';
    const p = String(path);
    if (/^https?:\/\//i.test(p)) return p;
    return this.imgBaseUrl + p.replace(/^\/+/, '');
  }

  /** Hero URL for `<img [src]>` — same field resolution as SEO/schema (`blogCoverMediaRaw`). */
  get heroImageSrc(): string {
    const raw = this.blogCoverMediaRaw();
    return raw ? this.blogAssetUrl(raw) : '';
  }

  get heroImageAlt(): string {
    const b = this.blog_details;
    if (!b) return 'blog-image';
    const a = b.img_alt ?? b.imageAlt;
    return a != null && String(a).trim() !== '' ? String(a) : 'blog-image';
  }

  /**
   * TOC / Editor.js body links live inside innerHTML; listen on `document`.
   * Editor.js `productCta` Add to cart is handled by a document **capture** listener in `ngOnInit`
   * so `preventDefault` runs before the browser follows `<a href="/product/...">`.
   */
  @HostListener('document:click', ['$event'])
  onInPageAnchorClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const root = this.hostRef.nativeElement;
    const raw = event.target as Node | null;
    const t =
      raw instanceof Element ? (raw as HTMLElement) : raw?.parentElement ?? null;
    if (!t || !root.contains(t)) return;

    const anchorEl = t.closest('a');
    if (!anchorEl || !root.contains(anchorEl)) return;
    if (anchorEl.closest('a.ej-product-cta-btn')) return;

    const href = anchorEl.getAttribute('href');
    if (!href || href === '#') return;

    // In-article section anchors (#heading-id)
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1)).trim();
      if (!id) return;
      if (!document.getElementById(id)) return;
      event.preventDefault();
      event.stopPropagation();
      void this.router
        .navigate([], {
          relativeTo: this.activeRoute,
          fragment: id,
          replaceUrl: true,
        })
        .finally(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => this.scrollToArticleFragment(id, undefined, 'auto'));
          });
        });
      return;
    }

    // Same-origin relative paths from Editor.js body (product / category / blog links)
    if (href.startsWith('/') && !href.startsWith('//')) {
      const target = (anchorEl.getAttribute('target') || '').toLowerCase();
      if (target === '_blank') return;
      event.preventDefault();
      event.stopPropagation();
      void this.router.navigateByUrl(href);
    }
  }

  /** Offset for fixed site header so headings aren’t hidden under the bar. */
  private scrollToArticleFragment(
    id: string,
    el?: HTMLElement | null,
    behavior: ScrollBehavior = 'smooth'
  ): void {
    const dest = el ?? document.getElementById(id);
    if (!dest) return;
    const headerReservePx = 96;
    const rect = dest.getBoundingClientRect();
    const y = rect.top + window.scrollY - headerReservePx;
    window.scrollTo({ top: Math.max(0, y), behavior });
  }

  /** Opened as /blogs/slug#section-2 — scroll after Editor.js body is in the DOM. */
  private scheduleScrollToUrlFragment(): void {
    const id =
      (this.activeRoute.snapshot.fragment || '').trim() ||
      (this.router.parseUrl(this.router.url).fragment || '').trim();
    if (!id) return;
    const tryScroll = (attempt: number) => {
      const el = document.getElementById(id);
      if (el) {
        this.scrollToArticleFragment(id, el, 'auto');
        return;
      }
      if (attempt < 60) {
        setTimeout(() => tryScroll(attempt + 1), 100);
      }
    };
    setTimeout(() => tryScroll(0), 80);
  }

  /**
   * Editor.js `productCta`: fetch full product (`PRODUCT_DETAILS`) then `cartService.addToCart`
   * — mirrors `ProductComponent` init + quick-add path when addons aren’t mandatory.
   */
  private onEjProductCtaClick(anchor: HTMLAnchorElement): void {
    if (this.ejProductCtaBusy) return;

    const dataPid = anchor.getAttribute('data-product-id')?.trim();
    const hrefRaw = anchor.getAttribute('href')?.trim() ?? '';
    let product_id = dataPid || '';

    if (!product_id && hrefRaw) {
      try {
        const base =
          typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
        const path = new URL(hrefRaw, base).pathname;
        const m = path.match(/\/product\/([^/?#]+)/i);
        if (m?.[1]) product_id = decodeURIComponent(m[1]);
      } catch {
        const m = hrefRaw.match(/\/product\/([^/?#]+)/i);
        if (m?.[1]) product_id = decodeURIComponent(m[1]);
      }
    }

    if (!product_id) {
      const fallback =
        hrefRaw.startsWith('/') || hrefRaw.startsWith('http')
          ? hrefRaw
          : '/' + hrefRaw.replace(/^\/+/, '');
      if (fallback && fallback !== '#') void this.router.navigateByUrl(fallback);
      return;
    }

    this.ejProductCtaBusy = true;
    anchor.classList.add('ej-product-cta-btn--loading');

    this.storeApi.PRODUCT_DETAILS({ product_id }).subscribe({
      next: (result) => {
        anchor.classList.remove('ej-product-cta-btn--loading');
        this.ejProductCtaBusy = false;

        if (!result?.status || !result.data) {
          void this.router.navigate(['/product', product_id]);
          return;
        }

        const pd = result.data;
        if (!this.blogProductAllowsQuickAdd(pd)) {
          void this.router.navigate(['/product', product_id]);
          return;
        }

        const payload = this.buildBlogQuickAddCartPayload(pd);
        if (!payload) {
          void this.router.navigate(['/product', product_id]);
          return;
        }
        try {
          this.cartService.addToCart(payload);
          this.openMiniCartAfterBlogAdd();
        } catch (e) {
          console.warn('Blog product CTA addToCart failed', e);
        }
      },
      error: () => {
        anchor.classList.remove('ej-product-cta-btn--loading');
        this.ejProductCtaBusy = false;
        void this.router.navigate(['/product', product_id]);
      },
    });
  }

  /** Same minicart behavior as `ProductComponent.addToCartTrigger` after `cartService.addToCart`. */
  private openMiniCartAfterBlogAdd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (environment.header_root.indexOf('sc') !== -1) {
      const el = this.document.getElementById('side-minicart-trigger');
      if (el) setTimeout(() => el.click(), 100);
    } else {
      const el = this.document.getElementById('minicart-trigger');
      if (el) el.click();
      setTimeout(() => {
        if (typeof $ !== 'undefined' && $('.cart-box:visible').length) {
          $('.cart-box').slideUp('400');
        }
      }, 5000);
    }
  }

  /** Same gate as product page “quick add” — mandatory addons need full product UI */
  private blogProductAllowsQuickAdd(pd: any): boolean {
    const app = this.commonService.application_setting;
    if (
      app?.product_addon &&
      pd.addon_must &&
      pd.addon_status &&
      Array.isArray(pd.addon_list) &&
      pd.addon_list.length
    ) {
      return false;
    }
    return true;
  }

  /**
   * Pick first variant row matching selected option values (same rules as `ProductComponent.setVariantPrice`).
   */
  private resolveBlogQuickAddVariantRow(details: any): any | null {
    const variantTypes = details.variant_types;
    const variantList = details.variant_list;
    if (!Array.isArray(variantTypes) || !variantTypes.length || !Array.isArray(variantList)) {
      return null;
    }
    let variantInfo: any[] = [];
    if (variantTypes.length === 1) {
      variantInfo = variantList.filter(
        (el: any) => el[variantTypes[0].name] == variantTypes[0].value
      );
    } else if (variantTypes.length === 2) {
      variantInfo = variantList.filter(
        (el: any) =>
          el[variantTypes[0].name] == variantTypes[0].value &&
          el[variantTypes[1].name] == variantTypes[1].value
      );
    } else if (variantTypes.length === 3) {
      variantInfo = variantList.filter(
        (el: any) =>
          el[variantTypes[0].name] == variantTypes[0].value &&
          el[variantTypes[1].name] == variantTypes[1].value &&
          el[variantTypes[2].name] == variantTypes[2].value
      );
    } else {
      return null;
    }
    return variantInfo.length && variantInfo[0] ? variantInfo[0] : null;
  }

  /**
   * Align with `ProductComponent` post-fetch shape before `CartlistService.addToCart`.
   * Variant products: default each dimension to `options[0].value` and apply matching `variant_list` row (price/stock/sku).
   */
  private buildBlogQuickAddCartPayload(pd: any): any | null {
    const details = { ...pd };
    details.additional_qty = 0;
    details.addon_price = 0;
    details.product_id = details._id;

    if (details.variant_status) {
      if (!Array.isArray(details.variant_types) || !details.variant_types.length) {
        return null;
      }
      details.variant_types = details.variant_types.map((el: any) => ({
        ...el,
        value:
          el?.value != null && el.value !== ''
            ? el.value
            : el?.options?.length
              ? el.options[0].value
              : undefined,
      }));
      const row = this.resolveBlogQuickAddVariantRow(details);
      if (!row) return null;
      if (row.sku) details.sku = row.sku;
      if (row.taxrate_id) details.taxrate_id = row.taxrate_id;
      details.selling_price = row.selling_price;
      details.discounted_price = row.discounted_price;
      details.stock = row.stock;
      if (row.hold_till) {
        let balanceStock = details.stock;
        if (new Date() < new Date(row.hold_till)) balanceStock = details.stock - row.hold_qty;
        details.stock = balanceStock;
      }
    } else {
      if (!Array.isArray(details.variant_types)) details.variant_types = [];
    }

    details.quantity = this.commonService.min_qty?.[details.unit] ?? 1;
    if (details.quantity > details.stock) details.quantity = details.stock;
    const minQ = this.commonService.min_qty?.[details.unit] ?? 1;
    if (details.stock < minQ || details.quantity < minQ) return null;

    if (details.image_list?.length && !details.image) {
      details.image = details.image_list[0].image;
    }
    details.external_addon_status = false;
    details.external_addon_list = details.addon_list;
    details.selected_addon = undefined;
    details.final_price = parseFloat(String(details.discounted_price ?? 0));
    if (details.unit === 'Pcs') {
      details.final_price =
        parseFloat(String(details.discounted_price ?? 0)) +
        parseFloat(String(details.addon_price ?? 0));
    }
    return details;
  }

  /** Read time / duration shown after author on the hero meta line (API: readTime, optional reading_minutes). */
  get readingLineTail(): string {
    const b = this.blog_details;
    if (!b) return '';
    const raw = b.readTime ?? b.reading_minutes;
    if (raw == null || raw === '') return '';
    return String(raw);
  }

  get authorProfile(): Record<string, unknown> | null {
    const p = this.blog_details?.author_profile;
    return p && typeof p === 'object' ? (p as Record<string, unknown>) : null;
  }

  get showAuthorProfile(): boolean {
    const b = this.blog_details;
    if (!b) return false;
    const p = this.authorProfile;
    if (p && (p['name'] || p['role'] || p['bio'] || p['avatar'])) return true;
    return !!(b.authorAvatar || b.authorRole || b.authorBio);
  }

  get authorDisplayName(): string {
    const p = this.authorProfile;
    const nested = p?.['name'];
    if (nested != null && String(nested).trim() !== '') return String(nested);
    return this.blog_details?.author != null ? String(this.blog_details.author) : '';
  }

  get authorRoleLine(): string {
    const p = this.authorProfile;
    const nested = p?.['role'];
    const flat = this.blog_details?.authorRole;
    const v = nested != null && String(nested).trim() !== '' ? nested : flat;
    return v != null ? String(v) : '';
  }

  get authorBioLine(): string {
    const p = this.authorProfile;
    const nested = p?.['bio'];
    const flat = this.blog_details?.authorBio;
    const v = nested != null && String(nested).trim() !== '' ? nested : flat;
    return v != null ? String(v) : '';
  }

  get authorAvatarUrl(): string {
    const p = this.authorProfile;
    const raw = p?.['avatar'] ?? this.blog_details?.authorAvatar;
    return raw ? this.blogAssetUrl(String(raw)) : '';
  }

  get authorInitial(): string {
    const n = this.authorDisplayName.trim();
    return n ? n.charAt(0).toUpperCase() : '?';
  }

  /** Absolute URL for “Browse all stories” (nested profile link or flat `authorLink`). */
  get authorBrowseExternalHref(): string | null {
    const candidates = [this.authorProfile?.['link'], this.blog_details?.authorLink];
    for (const raw of candidates) {
      if (raw == null || String(raw).trim() === '') continue;
      const s = String(raw).trim();
      if (/^https?:\/\//i.test(s)) return s;
    }
    return null;
  }

  /** App path for `routerLink` when profile link or `authorLink` is internal (e.g. `/blogs?author=x`). */
  get authorBrowseRouterLink(): string | null {
    if (this.authorBrowseExternalHref) return null;
    const raw = this.authorProfile?.['link'] ?? this.blog_details?.authorLink;
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim();
    if (/^https?:\/\//i.test(s) || !s.startsWith('/')) return null;
    const qIdx = s.indexOf('?');
    const pathOnly = qIdx >= 0 ? s.slice(0, qIdx) : s;
    return pathOnly || '/blogs';
  }

  /** Query string from internal profile link or `authorLink`. */
  get authorBrowseQueryParams(): Record<string, string> | null {
    if (this.authorBrowseExternalHref) return null;
    const raw = this.authorProfile?.['link'] ?? this.blog_details?.authorLink;
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim();
    if (/^https?:\/\//i.test(s)) return null;
    const qIdx = s.indexOf('?');
    if (qIdx < 0) return null;
    const out: Record<string, string> = {};
    new URLSearchParams(s.slice(qIdx + 1)).forEach((v, k) => {
      out[k] = v;
    });
    return Object.keys(out).length ? out : null;
  }

  /** Optional hero CTA below title (API: `hero_cta_label` + `hero_cta_url`). */
  get heroCtaLabel(): string | null {
    const b = this.blog_details as Record<string, unknown> | undefined;
    if (!b) return null;
    const raw = b['hero_cta_label'] ?? b['heroCtaLabel'];
    if (raw == null || String(raw).trim() === '') return null;
    return String(raw).trim();
  }

  get heroCtaExternalHref(): string | null {
    if (!this.heroCtaLabel) return null;
    const b = this.blog_details as Record<string, unknown>;
    const raw = b['hero_cta_url'] ?? b['heroCtaUrl'];
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim();
    return /^https?:\/\//i.test(s) ? s : null;
  }

  /** Internal app path for hero pill (e.g. `/collection/cotton-sarees`). */
  get heroCtaRouterLink(): string | null {
    if (!this.heroCtaLabel || this.heroCtaExternalHref) return null;
    const b = this.blog_details as Record<string, unknown>;
    const raw = b['hero_cta_url'] ?? b['heroCtaUrl'];
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim();
    if (/^https?:\/\//i.test(s) || !s.startsWith('/')) return null;
    return s.split('?')[0] || '/';
  }

  stripHtml(html: any) {
    if (html) {
      let tmp = this.renderer.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent.slice(0, 320) || tmp.innerText.slice(0, 320) || '';
    } else return '';
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.boundPassiveBlogScrollTools);
    }
    this.ejProductCtaCaptureCleanup?.();
    this.ejHashLinkCaptureCleanup?.();
    this.storeSubscription.unsubscribe();
    this.commonService.removeElement('blog-jsonld');
    this.commonService.removeElement('blog-faq-jsonld');
  }

  findCurrency() {
    if(this.blog_details?.segments?.length) {
      for(let segment of this.blog_details.segments) {
        if(segment.type=="featured_product") {
          for(let product of segment.product_list || []) {
            product.temp_selling_price = this.cc.CALC(product.selling_price);
            product.temp_discounted_price = this.cc.CALC(product.discounted_price);
          }
        }
        else if(segment.type=="highlighted_product" && segment.product_details) {
          let product = segment.product_details;
          product.temp_selling_price = this.cc.CALC(product.selling_price);
          product.temp_discounted_price = this.cc.CALC(product.discounted_price);
        }
      }
    }
  }

}