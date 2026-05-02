import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
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
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  /** Matches `index.html` preload for `.dynamic-height` when masthead is not measurable yet. */
  private static readonly MASTHEAD_FALLBACK_PX = 80;

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

  homeSchema: any = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://tulsisilks.co.in/#organization",
      "name": "Tulsi Silks",
      "url": "https://tulsisilks.co.in/",
      "logo": "https://yourstore.io/api/uploads/5d30013a5c83a702392c4c8b/logo.png",
      "sameAs": [
        "https://www.instagram.com/tulsisilks/",
        "https://x.com/TulsiSilks",
        "https://www.facebook.com/tulsisilks"
      ],
      "foundingDate": "1993",
      "founders": [
        { "@type": "Person", "name": "Suresh Parekh" },
        { "@type": "Person", "name": "Santosh Parekh" }
      ],
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "telephone": "+91-9791019822",
          "email": "orders@tulsisilks.com",
          "areaServed": "IN",
          "availableLanguage": ["en","ta","hi","te","mwr"]
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Store",
      "@id": "https://tulsisilks.co.in/#store",
      "name": "Tulsi Silks Saree Store",
      "url": "https://tulsisilks.co.in/",
      "image": "https://yourstore.io/api/uploads/5d30013a5c83a702392c4c8b/logo.png",
      "telephone": "+91-9791019822",
      "email": "orders@tulsisilks.com",
      "parentOrganization": { "@id": "https://tulsisilks.co.in/#organization" },
      "additionalType": "https://www.wikidata.org/wiki/Q1153805",
      "priceRange": "₹₹₹",
      "currenciesAccepted": "INR",
      "paymentAccepted": "UPI, Credit Card, Debit Card, NetBanking, Cash",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "68, Luz Church Rd",
        "addressLocality": "Mylapore",
        "addressRegion": "Tamil Nadu",
        "postalCode": "600004",
        "addressCountry": "IN"
      },
      "geo": { "@type": "GeoCoordinates", "latitude": 13.037367, "longitude": 80.262608 },
      "hasMap": "https://maps.google.com/?q=13.037367,80.262608",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
          "opens": "09:30",
          "closes": "19:30"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Sunday",
          "opens": "10:00",
          "closes": "19:00"
        }
      ],
      "sameAs": [
        "https://www.instagram.com/tulsisilks/",
        "https://x.com/TulsiSilks",
        "https://www.facebook.com/tulsisilks"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "MerchantReturnPolicy",
      "@id": "https://tulsisilks.co.in/#return-policy",
      "name": "Tulsi Silks Return Policy",
      "merchantReturnDays": 7,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn",
      "applicableCountry": "IN"
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://tulsisilks.co.in/#website",
      "url": "https://tulsisilks.co.in/",
      "name": "Tulsi Silks",
      "publisher": { "@id": "https://tulsisilks.co.in/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://tulsisilks.co.in/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private storeApi: StoreApiService, public swiperService: SwiperService,
    private sanitizer: DomSanitizer, public commonService: CommonService, private router: Router, public ws: WishlistService,
    public cc: CurrencyConversionService, @Inject(DOCUMENT) private document, private assetLoader: DynamicAssetLoaderService
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
    // JSON-LD
    this.commonService.createJsonLD("home-jsonld", this.homeSchema);
    if(!this.commonService.contact_page_info) {
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
    }
    
  }

  ngAfterContentInit() {
    if(this.commonService.storeLoaded) this.loadHomeContent();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (environment.template_setting.primary_slider !== 'fs_slider') return;
    this.setSliderHeight();
    window.addEventListener('resize', this.boundOnWindowResize);
    const head = this.document.getElementById('headroom-head');
    if (typeof ResizeObserver !== 'undefined' && head) {
      this.headerResizeObserver = new ResizeObserver(() => this.setSliderHeight());
      this.headerResizeObserver.observe(head);
    }
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
    // website schema
    let webSchema = {
      "@context": "https://schema.org/",
      "@type": "WebSite",
      "name": this.commonService.store_details?.name,
      "url": this.commonService.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": this.commonService.origin+"/search?q={query}",
        "query-input": "required name=query"
      }
    };
    this.commonService.createJsonLD("web-jsonld", webSchema);
    // business schema
    let businessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Tulsi Silks",
      "image": "https://yourstore.io/api/uploads/5d30013a5c83a702392c4c8b/logo.png?v=654TRTYR654",
      "@id": "",
      "url": "https://tulsisilks.co.in/",
      "telephone": "04424991086",
      "priceRange": "$$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "68, Luz Church Rd, Kapali Thottam, Mylapore,",
        "addressLocality": "Chennai",
        "postalCode": "600004",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 13.03802082439817,
        "longitude": 80.26062611851863
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ],
        "opens": "09:30",
        "closes": "19:30"
      },
      "sameAs": [
        "https://www.facebook.com/TulsiSilks/",
        "https://www.instagram.com/tulsisilks/",
        "https://twitter.com/tulsisilks",
        "https://www.youtube.com/channel/UCQSUU3UkKL2ZFixxSoJdqoA",
        "https://tulsisilks.co.in/"
      ] 
    };
    this.commonService.createJsonLD("business-jsonld", businessSchema);
    // breadcrumb
    let bcList = [{ name: "Home", position: 1, link: "/" }];
    this.commonService.breadCrumbList(bcList);
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
              if(blogData.section_grid_type=='grid_1') bCount = 2;
              else if(blogData.section_grid_type=='grid_2') bCount = 3;
              else if(blogData.section_grid_type=='grid_3') bCount = 4;
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
    }
    this.commonService.layout_list = layoutList;
    // primary slider
    if(this.template_setting.primary_slider) {
      let sliderIndex = this.commonService.layout_list.findIndex(obj => obj.type=='primary_slider');
      if(sliderIndex!=-1) {
        let primaryImgList = this.commonService.layout_list[sliderIndex].image_list;
        if(primaryImgList.length) {
          primaryImgList[0].desktop_img = this.commonService.primary_main_slider[0].desktop_img;
          primaryImgList[0].mobile_img = this.commonService.primary_main_slider[0].mobile_img;
          this.commonService.primary_main_slider = primaryImgList;
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
          product.temp_selling_price = this.cc.CALC(product.selling_price);
          product.temp_discounted_price = this.cc.CALC(product.discounted_price);
        }
      }
      else if(layout.type=="multiple_featured_product") {
        for(let tab of layout.multitab_list) {
          for(let product of tab.product_list) {
            product.temp_selling_price = this.cc.CALC(product.selling_price);
            product.temp_discounted_price = this.cc.CALC(product.discounted_price);
          }
        }
      }
    }
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
    this.fullBleedHeroHeightCss = `calc(100vh - ${mastHeight}px)`;
    this.document.body.style.marginTop = `${mastHeight}px`;
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
  }

}