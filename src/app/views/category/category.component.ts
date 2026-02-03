import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser, DOCUMENT, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { environment } from './../../../environments/environment';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';
import { Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})

export class CategoryComponent implements OnInit {

  tag_list: any = []; params: any = {};
  category_details: any = {};
  parent_list: any = []; list: any = [];
  pageLoader: boolean; tagSelected: boolean;
  imgBaseUrl: string = environment.img_baseurl;
  sort_value: string; current_url: string;
  template_setting: any = environment.template_setting;
  collapseIndex: number; showMore: boolean;
  sort_list: any = [
    { name: "Latest", value: "latest" },
    // { name: "Discounted", value: "discounted" },
    { name: "Price: Low to High", value: "price_asc" },
    { name: "Price: High to Low", value: "price_desc" }
  ];
  subscription: Subscription;
  store_tags: any = []; gridType: string = "four";
  rangeMin: number; rangeMax: number;
  range_disp: Options = { floor: 0, ceil: 0 };
  randomProducts: any = []; page: number = 1;
  pageSize: number = this.template_setting.products_per_page;
  bcList: any = []; pageUrl: string;
  IsBrowser: boolean;
  navigationImageList = [];
  showNavigationButtons: boolean = false;
  isKanjivaram: boolean; isBanarasi: boolean; isOrganza: boolean;
  selectedOptions: any = {}; qParams: any = {};

  categorySchema: any = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://tulsisilks.co.in/#organization",
        "name": "Tulsi Silks",
        "url": "https://tulsisilks.co.in/",
        "logo": "https://tulsisilks.co.in/assets/images/logo.png",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "telephone": "+91-9791019822",
            "availableLanguage": [
              "en",
              "ta",
              "hi",
              "te",
              "mwr"
            ]
          }
        ],
        "sameAs": [
          "https://www.instagram.com/tulsisilks/",
          "https://www.facebook.com/TulsiSilks/"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://tulsisilks.co.in/#website",
        "url": "https://tulsisilks.co.in/",
        "name": "Tulsi Silks",
        "inLanguage": "en-IN",
        "publisher": {
          "@id": "https://tulsisilks.co.in/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://tulsisilks.co.in/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "BreadcrumbList"
      },
      {
        "@type": "CollectionPage",
        "inLanguage": "en-IN",
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": []
        }
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://tulsisilks.co.in/#localbusiness",
        "name": "Tulsi Silks",
        "url": "https://tulsisilks.co.in/",
        "logo": "https://tulsisilks.co.in/assets/images/logo.png",
        "telephone": "+91-9791019822",
        "email": "orders@tulsisilks.com",
        "sameAs": [
          "https://www.instagram.com/tulsisilks/",
          "https://www.facebook.com/TulsiSilks/",
          "https://www.google.com/maps?cid=5155564344403189918",
          "https://www.google.com/m/storepages?q=tulsisilks.co.in&c=IN&hl=en-IN"
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "68, Luz Church Rd, Kapali Thottam, Mylapore",
          "addressLocality": "Chennai",
          "addressRegion": "Tamil Nadu",
          "postalCode": "600004",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 13.0377511,
          "longitude": 80.260277
        },
        "openingHoursSpecification": [
          {
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
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Sunday",
            "opens": "10:00",
            "closes": "19:00"
          }
        ],
        "hasMap": "https://www.google.com/maps/search/?api=1&query=13.0377511,80.260277",
        "areaServed": [
          {
            "@type": "Country",
            "name": "India"
          },
          {
            "@type": "Country",
            "name": "United States"
          },
          {
            "@type": "Country",
            "name": "United Kingdom"
          },
          {
            "@type": "Country",
            "name": "United Arab Emirates"
          }
        ],
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "internationalShipping",
            "value": true
          }
        ],
        "description": "Free delivery within India. Estimated delivery: 4 business days — Free Delivery by Friday. International shipping available (charges apply)."
      }
    ]
  };

  categoryFAQSchema: any = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": []
  };

  @ViewChild('navigationScroller') navigationScroller!: ElementRef;
  @ViewChild('imageScroller') imageScroller!: ElementRef;
  isAtStart: boolean = true;
  isAtEnd: boolean = false;
  isImageAtStart: boolean = true;
  isImageAtEnd: boolean = false;
  activeSlideIndex: number = 0;
  expiryData: string = new Date().getFullYear()+1+"-06-30";

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private router: Router, private activeRoute: ActivatedRoute,
    private storeApi: StoreApiService, public cc: CurrencyConversionService, public commonService: CommonService,
    @Inject(DOCUMENT) private document, private decimalPipe: DecimalPipe
  ) {
    this.subscription = this.commonService.currency_type.subscribe(currency => {
      this.findCurrency();
    });
    if (isPlatformBrowser(this.platformId)) this.IsBrowser = true;
  }

  // Update your ngAfterViewInit method
  ngAfterViewInit() {
    // Initialize button visibility
    setTimeout(() => {
      this.checkNavigationOverflow();
      this.updateNavigationButtonVisibility();
      this.updateImageButtonVisibility();

      // Listen to scroll events
      if (this.navigationScroller) {
        this.navigationScroller.nativeElement.addEventListener('scroll', () => {
          this.updateNavigationButtonVisibility();
        });
      }

      if (this.imageScroller) {
        this.imageScroller.nativeElement.addEventListener('scroll', () => {
          this.updateImageButtonVisibility();
        });
      }

      // Listen to window resize events
      if(isPlatformBrowser(this.platformId)) {
        window.addEventListener('resize', () => {
          this.checkNavigationOverflow();
          this.updateNavigationButtonVisibility();
        });
      }
    }, 100);
  }

  checkNavigationOverflow() {
    if (this.navigationScroller) {
      const scrollWrapper = this.navigationScroller.nativeElement;
      this.showNavigationButtons = scrollWrapper.scrollWidth > scrollWrapper.clientWidth;
    }
  }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((qParams: Params) => {
      this.qParams = Object.assign({}, qParams);
      this.selectedOptions = {};
      for(let key in this.qParams) {
        this.selectedOptions[key] = this.qParams[key].split("-");
      }
      for(let tagData of this.tag_list)
      {
        let paramName = tagData.name.trim().toLowerCase().replace(/ /g, "_");
        if(this.selectedOptions[paramName]) {
          this.selectedOptions[paramName].forEach(element => {
            let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
            let optData = tagData.option_list.find(el => el.name.trim().toLowerCase().replace(/ /g, "_")==paramElem);
            optData.checked = false;
            if(optData) optData.checked = true;
          });
        }
        else {
          tagData.option_list.forEach(element => {
            element.checked = false;
          });
        }
      }
    });
    this.activeRoute.params.subscribe((params: Params) => {
      this.pageUrl = this.router.url.split('?')[0];
      this.isKanjivaram = false; this.isBanarasi = false; this.isOrganza = false;
      const kanjivaramList: any = [
        "Kanjivaram Silk Sarees",
        "Kanjivaram Tissue Silk Sarees",
        "Kanjivaram Pure Silk Sarees"
      ];
      const banarasiList: any = [
        "Banarasi Silk Sarees"
      ];
      const organzaList: any = [
        "Organza Sarees"
      ];
      this.showMore = false; this.params = params; this.tag_list = []; this.randomProducts = [];
      if (this.pageUrl == '/recommended-products' || this.pageUrl == '/all-products' || this.pageUrl == '/new-arrivals' || this.pageUrl == '/on-sale' || this.pageUrl == '/featured-products' || this.pageUrl == '/best-sellers') {
        this.params = { category_id: this.pageUrl };
        if (this.commonService.category_page_attr.category_id == this.pageUrl) {
          this.page = this.commonService.category_page_attr.page;
          this.gridType = this.commonService.category_page_attr.grid_type;
          this.sort_value = this.commonService.category_page_attr.sort_value;
          this.collapseIndex = this.commonService.category_page_attr.collapse_index;
          this.category_details = this.commonService.category_page_attr.category_details;
          this.rangeMin = this.commonService.category_page_attr.range_min;
          this.rangeMax = this.commonService.category_page_attr.range_max;
          this.range_disp = this.commonService.category_page_attr.range_disp;
          // seo
          this.updateMetaData();
          this.parent_list = this.commonService.category_page_attr.parent_list;
          this.list = this.parent_list;
          this.findCurrency();
          // tag filter
          this.tag_list = this.commonService.category_page_attr.tag_list;
          this.onTagFilter(false);
          let scrollPos = this.commonService.category_page_attr.scroll_y_pos;
          if(isPlatformBrowser(this.platformId)) {
            setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
          }
          this.commonService.category_page_attr = {};
        }
        else {
          this.page = 1; this.sort_value = "latest";
          this.pageLoader = true; this.collapseIndex = 0;
          if (this.pageUrl == '/recommended-products') {
            this.category_details = { name: "Specially curated for you", route: this.pageUrl };
            if (isPlatformBrowser(this.platformId) && sessionStorage.getItem("ai_styles")) {
              let filterList = this.commonService.decryptData(sessionStorage.getItem("ai_styles"));
              this.storeApi.AI_STYLES_FILTER({ styles: filterList }).subscribe(result => {
                setTimeout(() => { this.pageLoader = false; }, 500);
                if (result.status) this.filterProducts(result.list);
                else console.log("c1-response", result, this.pageUrl);
              });
            }
            else this.pageLoader = false;
          }
          else {
            let categoryName = ""; let filterType = "";
            if (this.pageUrl == "/all-products") {
              categoryName = "All Products"; filterType = "all";
            }
            else if (this.pageUrl == "/new-arrivals") {
              categoryName = "New Arrivals"; filterType = "new_arrivals";
            }
            else if (this.pageUrl == "/on-sale") {
              categoryName = "On Sale"; filterType = "discount";
            }
            else if (this.pageUrl == "/featured-products") {
              categoryName = "Featured Products"; filterType = "featured";
            }
            else if (this.pageUrl == "/best-sellers") {
              categoryName = "Best Sellers"; filterType = "best_sellers";
            }
            this.category_details = { name: categoryName, route: this.pageUrl };
            // seo details
            let metaInfo = {
              "all": {
                h1_tag: "All Products - " + this.commonService.store_details?.name,
                page_title: "All Products - Extensive Collection for Every Need | " + this.commonService.store_details?.name,
                meta_desc: "Browse our extensive collection of products at " + this.commonService.store_details?.name + ", catering to a wide range of needs. You can find everything you're looking for here. Start exploring now.",
                meta_keywords: []
              },
              "new_arrivals": {
                h1_tag: "New Arrivals from Tulsi Silks",
                page_title: "Shop the Latest New Arrivals Collections from Tulsi Silks",
                meta_desc: "Explore the latest arrivals at Tulsi Silks and stay ahead of the trends with our newest saree collections. From exquisite sarees to timeless weaves, find the perfect blend of tradition and style. Elevate your wardrobe with premium silk craftsmanship and unmatched elegance. Shop now and experience luxury!",
                meta_keywords: []
              },
              "discount": {
                h1_tag: "On Sale - " + this.commonService.store_details?.name,
                page_title: "On Sale - Great Deals and Discounts | " + this.commonService.store_details?.name,
                meta_desc: "Explore the on-sale items at " + this.commonService.store_details?.name + " and enjoy great deals and discounts. Find high-quality products at affordable prices and make the most of your shopping experience.",
                meta_keywords: []
              },
              "featured": {
                h1_tag: "Featured Products - " + this.commonService.store_details?.name,
                page_title: "Featured Products - Handpicked Selection of Must-Haves | " + this.commonService.store_details?.name,
                meta_desc: "Check out our handpicked selection of featured products at " + this.commonService.store_details?.name + ". Discover the trending and highly recommended must-haves from " + this.commonService.store_details?.name + ".",
                meta_keywords: []
              },
              "best_sellers": {
                h1_tag: "Featured Products - " + this.commonService.store_details?.name,
                page_title: "Featured Products - Handpicked Selection of Must-Haves | " + this.commonService.store_details?.name,
                meta_desc: "Check out our handpicked selection of featured products at " + this.commonService.store_details?.name + ". Discover the trending and highly recommended must-haves from " + this.commonService.store_details?.name + ".",
                meta_keywords: []
              }
            };
            if (metaInfo[filterType]) {
              this.category_details.seo_status = true;
              this.category_details.seo_details = metaInfo[filterType];
            }
            // seo
            this.updateMetaData();
            this.storeApi.FILTERED_PRODUCT_LIST({ type: filterType }).subscribe(result => {
              setTimeout(() => { this.pageLoader = false; }, 500);
              if (result.status) this.filterProducts(result.list);
              else console.log("c2-response", result, this.pageUrl);
            });
          }
          // seo
          this.updateMetaData();
        }
      }
      else if (this.params.category_id) {
        // product list
        if (this.commonService.category_page_attr.category_id == this.params.category_id) {
          this.page = this.commonService.category_page_attr.page;
          this.gridType = this.commonService.category_page_attr.grid_type;
          this.sort_value = this.commonService.category_page_attr.sort_value;
          this.collapseIndex = this.commonService.category_page_attr.collapse_index;

          this.category_details = this.commonService.category_page_attr.category_details;
          this.isKanjivaram = kanjivaramList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
          if(this.isKanjivaram && this.category_details.name=='Kanjivaram Silk Sarees') this.isKanjivaram = false;
          this.isBanarasi = banarasiList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
          if(this.isBanarasi && this.category_details.name=='Banarasi Silk Sarees') this.isBanarasi = false;
          this.isOrganza = organzaList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
          if(this.isOrganza && this.category_details.name=='Organza Sarees') this.isOrganza = false;

          this.rangeMin = this.commonService.category_page_attr.range_min;
          this.rangeMax = this.commonService.category_page_attr.range_max;
          this.range_disp = this.commonService.category_page_attr.range_disp;
          this.randomProducts = this.commonService.category_page_attr.random_products;
          if (this.category_details?.faqs?.length) this.buildFAQSchema();
          // seo
          this.updateMetaData();
          this.parent_list = this.commonService.category_page_attr.parent_list;
          this.list = this.parent_list;
          this.findCurrency();
          // tag filter
          this.tag_list = this.commonService.category_page_attr.tag_list;
          this.onTagFilter(false);
          let scrollPos = this.commonService.category_page_attr.scroll_y_pos;
          if(isPlatformBrowser(this.platformId)) {
            setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
          }
          this.commonService.category_page_attr = {};
        }
        else {
          this.page = 1; this.sort_value = "latest";
          this.pageLoader = true; this.collapseIndex = 0;
          this.storeApi.PRODUCT_LIST({ category_id: this.params.category_id }).subscribe(result => {
            setTimeout(() => { this.pageLoader = false; }, 500);
            if (result.status) {

              this.category_details = result.category_details;
              this.isKanjivaram = kanjivaramList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
              if(this.isKanjivaram && this.category_details.name=='Kanjivaram Silk Sarees') this.isKanjivaram = false;
              this.isBanarasi = banarasiList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
              if(this.isBanarasi && this.category_details.name=='Banarasi Silk Sarees') this.isBanarasi = false;
              this.isOrganza = organzaList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
              if(this.isOrganza && this.category_details.name=='Organza Sarees') this.isOrganza = false;

              if (this.category_details.navigationList?.length) {
                this.category_details.navigationList = this.category_details.navigationList.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1))
                this.onSelectNav(0);
              }
              if (this.category_details?.faqs?.length) this.buildFAQSchema();
              // seo
              this.updateMetaData();
              // filter products
              this.parent_list = [];
              result.list.forEach(object => {
                object.created_on = new Date(new Date(new Date(object.created_on).setHours(23, 59, 59, 59)).setDate(new Date(object.created_on).getDate() + 30));
                if (object.badge_list?.length) object.badge_list = this.commonService.buildTags(object.badge_list);
                if (object.hold_till) {
                  let balanceStock = object.stock;
                  if (new Date() < new Date(object.hold_till)) balanceStock = object.stock - object.hold_qty;
                  object.stock = balanceStock;
                }
                if (this.commonService.store_details?.additional_features?.disp_all_products) {
                  if (object.stock < this.commonService.min_qty[object.unit]) object.stock = 0;
                  this.parent_list.push(object);
                }
                else {
                  if (object.stock >= this.commonService.min_qty[object.unit] || object.allow_preorder) this.parent_list.push(object);
                }
              });
              this.list = this.parent_list;
              if (this.list.length > this.pageSize && this.category_details.prod_list_status) {
                this.randomProducts = this.getRandomProds(this.list, 15);
              }
              this.setCategorySchema();
              this.findCurrency();
              this.getProductTags();
            }
            else {
              console.log("c3-response", result, this.pageUrl);
              this.router.navigate(["/"]);
            }
          });
        }
      }
    });
    if (this.category_details.navigationList?.length) this.onSelectNav(0);
  }

  onSelectNav(index: number) {
    this.activeSlideIndex = index;
    let el = this.document.getElementById('navigationHighlights');
    if (el) el.style.visibility = "hidden";
    this.navigationImageList = [];

    // Check overflow immediately
    setTimeout(() => {
      this.checkNavigationOverflow();
    }, 0);

    setTimeout(() => {
      this.navigationImageList = this.category_details.navigationList[index].image_list.filter(el => el.isActive);
      // Show the image section after content is loaded
      if (el) el.style.visibility = "visible";
      // Scroll selected navigation item into view
      this.scrollToSelectedNav(index);
      // Check navigation overflow and update button visibility
      this.checkNavigationOverflow();
      this.updateNavigationButtonVisibility();
    }, 50);

    // Additional check after a longer delay
    setTimeout(() => {
      this.checkNavigationOverflow();
      this.updateNavigationButtonVisibility();
    }, 200);
  }

  // Add these new methods
  scrollNav(direction: string) {
    const scrollWrapper = this.navigationScroller.nativeElement;
    const scrollAmount = 200;

    if (direction === 'left') {
      scrollWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      scrollWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    setTimeout(() => this.updateNavigationButtonVisibility(), 300);
  }

  scrollImages(direction: string) {
    const scrollWrapper = this.imageScroller.nativeElement;
    const scrollAmount = 270; // Slightly more than image width

    if (direction === 'left') {
      scrollWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      scrollWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    setTimeout(() => this.updateImageButtonVisibility(), 300);
  }

  scrollToSelectedNav(index: number) {
    if (this.navigationScroller?.nativeElement) {
      const scrollWrapper = this.navigationScroller.nativeElement as HTMLElement;
      const selectedItem = scrollWrapper.children.item(index);

      if (selectedItem instanceof HTMLElement) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }

  updateNavigationButtonVisibility() {
    if (this.navigationScroller && this.showNavigationButtons) {
      const scrollWrapper = this.navigationScroller.nativeElement;
      this.isAtStart = scrollWrapper.scrollLeft <= 5;
      this.isAtEnd = scrollWrapper.scrollLeft >= (scrollWrapper.scrollWidth - scrollWrapper.clientWidth - 5);
    }
  }


  updateImageButtonVisibility() {
    if (this.imageScroller) {
      const scrollWrapper = this.imageScroller.nativeElement;
      this.isImageAtStart = scrollWrapper.scrollLeft <= 5;
      this.isImageAtEnd = scrollWrapper.scrollLeft >= (scrollWrapper.scrollWidth - scrollWrapper.clientWidth - 5);
    }
  }

  buildFAQSchema() {
    this.category_details.faqs.forEach(el => {
      this.categoryFAQSchema.mainEntity.push({
        "@type": "Question",
        "name": el.ques,
        "acceptedAnswer": { "@type": "Answer", "text": el.answer }
      });
    });
    this.commonService.createJsonLD("category-faq-jsonld", this.categoryFAQSchema);
  }

  getProductTags() {
    if (isPlatformBrowser(this.platformId)) {
      if (sessionStorage.getItem('pt')) {
        this.store_tags = this.commonService.decryptData(sessionStorage.getItem('pt'));
        this.onCreateTagList(this.list, false);
      }
      else {
        this.storeApi.PRODUCT_TAGS().subscribe(result => {
          if (result.status) {
            this.store_tags = JSON.parse(result.list);
            sessionStorage.setItem('pt', this.commonService.encryptData(this.store_tags));
            this.onCreateTagList(this.list, false);
          }
          else console.log("c4-response", result, this.pageUrl);
        });
      }
    }
    this.findMinMax();
  }

  filterProducts(productList) {
    this.parent_list = [];
    productList.forEach(object => {
      object.created_on = new Date(new Date(new Date(object.created_on).setHours(23, 59, 59, 59)).setDate(new Date(object.created_on).getDate() + 30));
      if (object.badge_list?.length) object.badge_list = this.commonService.buildTags(object.badge_list);
      if (object.hold_till) {
        let balanceStock = object.stock;
        if (new Date() < new Date(object.hold_till)) balanceStock = object.stock - object.hold_qty;
        object.stock = balanceStock;
      }
      if (this.commonService.store_details?.additional_features?.disp_all_products) {
        if (object.stock < this.commonService.min_qty[object.unit]) object.stock = 0;
        this.parent_list.push(object);
      }
      else {
        if (object.stock >= this.commonService.min_qty[object.unit] || object.allow_preorder) this.parent_list.push(object);
      }
    });
    this.list = this.parent_list;
    this.findCurrency();
    this.getProductTags();
  }

  findCurrency() {
    for (let product of this.parent_list) {
      product.temp_selling_price = this.cc.CALC(product.selling_price);
      product.temp_discounted_price = this.cc.CALC(product.discounted_price);
    }
    this.findMinMax();
  }

  onSelectProduct(x) {
    this.commonService.selected_product = x;
    // set page attributes
    this.commonService.category_page_attr = {
      category_id: this.params.category_id, page: this.page, sort_value: this.sort_value, tag_list: this.tag_list,
      collapse_index: this.collapseIndex, scroll_y_pos: this.commonService.scroll_y_pos, category_details: this.category_details,
      parent_list: this.parent_list, page_url: this.pageUrl, grid_type: this.gridType, random_products: this.randomProducts,
      range_min: this.rangeMin, range_max: this.rangeMax, range_disp: this.range_disp
    }
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem("category_details", this.commonService.encryptData(this.category_details));
      if (this.template_setting.product_swiper) {
        let swipeProList: any = [];
        this.list.forEach(obj => {
          if (obj.seo_status) swipeProList.push(obj.seo_details.page_url);
          else swipeProList.push(obj._id);
        });
        sessionStorage.setItem("swipe_product_list", this.commonService.encryptData(swipeProList));
      }
    }
  }

  onCreateTagList(list, click) {
    let duplicateTagList: any = this.tag_list;
    this.tag_list = []; const counts = {};
    list.forEach(prod => {
      if (prod.tag_status) {
        prod.tag_list.forEach(tagObj => {
          let tagId = Object.keys(tagObj)[0];
          let existingTagIndex = duplicateTagList.findIndex(x => x._id == tagId && x.option_list.findIndex(obj => obj.checked) != -1);
          if (existingTagIndex != -1) {
            let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
            if (tagIndex == -1) this.tag_list.push(duplicateTagList[existingTagIndex]);
          }
          else {
            let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
            if (tagIndex == -1) {
              let tIndex = this.store_tags.findIndex(element => element._id == tagId);
              if (tIndex != -1) {
                let optionArray = [];
                tagObj[tagId].forEach(element => {
                  if (counts[element]) { counts[element]++; } 
                  else { counts[element] = 1; }
                  let pushData: any = { name: element, count: counts[element] };
                  let paramName = this.store_tags[tIndex].name.trim().toLowerCase().replace(/ /g, "_");
                  let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
                  if(this.qParams[paramName]?.indexOf(paramElem)>=0) pushData.checked = true;
                  optionArray.push(pushData);
                });
                if (optionArray.length) this.tag_list.push({ _id: tagId, name: this.store_tags[tIndex].name, rank: this.store_tags[tIndex].rank, option_list: optionArray });
              }
            }
            else {
              tagObj[tagId].forEach(element => {
                let optionIndex = this.tag_list[tagIndex].option_list.findIndex(x => x.name == element);
                if (counts[element]) { counts[element]++; } 
                else { counts[element] = 1; }
                if (optionIndex == -1) {
                  let pushData: any = { name: element, count: counts[element] };
                  let paramName = this.tag_list[tagIndex].name.trim().toLowerCase().replace(/ /g, "_");
                  let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
                  if(this.qParams[paramName]?.indexOf(paramElem)>=0) pushData.checked = true;
                  this.tag_list[tagIndex].option_list.push(pushData);
                }
                else{ this.tag_list[tagIndex].option_list[optionIndex].count = counts[element]; }
              });
            }
          }
        });
      }
    });
    if (this.tag_list.length && !click) this.gridType = "three";
    this.onTagFilter(false);
  }
  onTagFilter(changeEvent) {
    let parentProducts: any = this.parent_list;
    this.tagSelected = false;
    let dummyList = [];
    this.tag_list.forEach(tag => {
      let tagId = tag._id;
      if (dummyList.length) { parentProducts = dummyList; dummyList = []; }
      tag.option_list.forEach(tagOption => {
        if (tagOption.checked) {
          this.tagSelected = true;
          let optionName = tagOption.name;
          parentProducts.forEach(prod => {
            prod.tag_list.forEach(prodTag => {
              if (Object.keys(prodTag)[0] == tagId) {
                let tagIndex = prodTag[tagId].findIndex(x => x == optionName);
                if (tagIndex != -1) {
                  // push product
                  let index = dummyList.findIndex(x => x._id == prod._id);
                  if (index == -1) dummyList.push(prod);
                }
              }
            });
          });
        }
      });
    });
    if (this.tagSelected) {
      if (dummyList.length) parentProducts = dummyList;
      this.list = parentProducts;
    }
    else this.list = this.parent_list;
    if (changeEvent) this.page = 1;
    this.findMinMax();
    // recreate tag list
    let duplicateTagList: any = this.tag_list;
    this.tag_list = []; const counts = {};
    this.list.forEach(prod => {
      if (prod.tag_status) {
        prod.tag_list.forEach(tagObj => {
          let tagId = Object.keys(tagObj)[0];
          let existingTagIndex = duplicateTagList.findIndex(x => x._id.toString() == tagId.toString());
          if (existingTagIndex != -1) {
            let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
            if (tagIndex == -1) this.tag_list.push(duplicateTagList[existingTagIndex]);
          }
          else {
            let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
            if (tagIndex == -1) {
              let tIndex = this.store_tags.findIndex(element => element._id == tagId);
              if (tIndex != -1) {
                let optionArray = [];
                tagObj[tagId].forEach(element => {
                  if (counts[element]) { counts[element]++; } 
                  else { counts[element] = 1; }
                  let pushData: any = { name: element, count: counts[element] };
                  let paramName = this.store_tags[tIndex].name.trim().toLowerCase().replace(/ /g, "_");
                  let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
                  if(this.qParams[paramName]?.indexOf(paramElem)>=0) pushData.checked = true;
                  optionArray.push(pushData);
                });
                if (optionArray.length) this.tag_list.push({ _id: tagId, name: this.store_tags[tIndex].name, rank: this.store_tags[tIndex].rank, option_list: optionArray });
              }
            }
            else {
              tagObj[tagId].forEach(element => {
                let optionIndex = this.tag_list[tagIndex].option_list.findIndex(x => x.name == element);
                if (counts[element]) { counts[element]++; } 
                else { counts[element] = 1; }
                if (optionIndex == -1) {
                  let pushData: any = { name: element, count: counts[element] };
                  let paramName = this.tag_list[tagIndex].name.trim().toLowerCase().replace(/ /g, "_");
                  let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
                  if(this.qParams[paramName]?.indexOf(paramElem)>=0) pushData.checked = true;
                  this.tag_list[tagIndex].option_list.push(pushData);
                }
                else{ this.tag_list[tagIndex].option_list[optionIndex].count = counts[element]; }
              });
            }
          }
        });
      }
    });
  }
  clearTagFilter() {
    this.qParams = {};
    this.router.navigate([this.router.url.split('?')[0]], { queryParams: this.qParams });
    this.list = this.parent_list;
    this.tag_list.forEach(tag => {
      tag.option_list.forEach(tagOption => { delete tagOption.checked; });
    });
    this.tagSelected = false;
    this.onCreateTagList(this.list, false);
    this.findMinMax();
  }

  onTagNewFilter(x, y) {
    this.page = 1;
    let heading = x.name.trim().toLowerCase().replace(/ /g, "_");
    let option = y.name.trim().toLowerCase().replace(/ /g, "_");
    if(y.checked) {
      if(this.selectedOptions[heading]) {
        if(this.selectedOptions[heading].indexOf(option)==-1) this.selectedOptions[heading].push(option);
      }
      else this.selectedOptions[heading] = [option];
    }
    else {
      if(this.selectedOptions[heading]) {
        let oInd = this.selectedOptions[heading].indexOf(option);
        if(oInd!=-1) {
          this.selectedOptions[heading].splice(oInd, 1);
          if(!this.selectedOptions[heading].length) delete this.selectedOptions[heading];
        }
      }
    }
    let tempParams = {};
    for(let key in this.selectedOptions) {
      if(this.selectedOptions.hasOwnProperty(key)) tempParams[key] = this.selectedOptions[key].join("-");
    }
    if(this.parent_list.length) {
      this.onTagFilter(true); this.page = 1;
    }
    this.router.navigate([this.router.url.split('?')[0]], { queryParams: tempParams });
  }

  findMinMax() {
    if (this.commonService.category_page_attr.category_id == this.pageUrl) {

    }
    else if (this.params.category_id && this.commonService.category_page_attr.category_id == this.params.category_id) {

    }
    else {
      let minPrice = this.list.reduce((min, p) => parseFloat(p?.temp_discounted_price) < min ? parseFloat(p?.temp_discounted_price) : min, parseFloat(this.list[0]?.temp_discounted_price));
      let maxPrice = this.list.reduce((max, p) => parseFloat(p?.temp_discounted_price) > max ? parseFloat(p?.temp_discounted_price) : max, parseFloat(this.list[0]?.temp_discounted_price));
      this.rangeMin = minPrice; this.rangeMax = maxPrice;
      if (!isNaN(minPrice) && !isNaN(maxPrice)) this.range_disp = { floor: minPrice, ceil: maxPrice };
    }
  }

  updateMetaData() {
    if (this.category_details.seo_status) this.commonService.setSiteMetaData(this.category_details.seo_details, null);
    else this.commonService.getStoreSeoDetails();
    // schema
    // if (this.category_details?.name) {
    //   this.bcList = [
    //     { name: 'Home', position: 1, link: '/' },
    //     {
    //       name: this.category_details.name,
    //       position: 2,
    //       link: this.pageUrl,
    //     }
    //   ];
    // }
    // else this.bcList = [{ name: 'Home', position: 1, link: '/' }];
    // this.commonService.breadCrumbList(this.bcList);
  }

  setCategorySchema() {
    // breadcrumb
    this.categorySchema['@graph'][2]['@id'] = "https://tulsisilks.co.in"+this.pageUrl+"#breadcrumbs";
    this.categorySchema['@graph'][2]['itemListElement'] = [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://tulsisilks.co.in/"
    }];
    if(this.isKanjivaram) {
      this.categorySchema['@graph'][2]['itemListElement'].push({
        "@type": "ListItem",
        "position": 2,
        "name": "Kanjivaram Silk Sarees",
        "item": "https://tulsisilks.co.in/category/kanjivaram-silk-sarees"
      });
    }
    else if(this.isBanarasi) {
      this.categorySchema['@graph'][2]['itemListElement'].push({
        "@type": "ListItem",
        "position": 2,
        "name": "Banarasi Silk Sarees",
        "item": "https://tulsisilks.co.in/category/banarasi-silk-sarees"
      });
    }
     else if(this.isOrganza) {
      this.categorySchema['@graph'][2]['itemListElement'].push({
        "@type": "ListItem",
        "position": 2,
        "name": "Organza Sarees",
        "item": "https://tulsisilks.co.in/category/organza-sarees"
      });
    }
    this.categorySchema['@graph'][2]['itemListElement'].push({
      "@type": "ListItem",
      "position": this.categorySchema['@graph'][2]['itemListElement'].length+1,
      "name": this.category_details.name,
      "item": "https://tulsisilks.co.in"+this.pageUrl
    });
    // item list
    this.categorySchema['@graph'][3]['@id'] = "https://tulsisilks.co.in"+this.pageUrl+"#collection";
    this.categorySchema['@graph'][3]['url'] = "https://tulsisilks.co.in"+this.pageUrl;
    this.categorySchema['@graph'][3]['name'] = this.category_details.name;
    this.categorySchema['@graph'][3]['description'] = this.category_details.seo_details?.meta_desc || '';
    this.categorySchema['@graph'][3]['mainEntity']['itemListElement'] = [];

    let pageItemList = this.parent_list.sort((a, b) => 0 - (a.rank > b.rank ? 1 : -1)).slice(0, this.pageSize);
    let ind = 0;
    for(let itemData of pageItemList)
    {
      ind++;
      this.categorySchema['@graph'][3]['mainEntity']['itemListElement'].push(
        {
          "@type": "ListItem",
          "position": ind,
          "url": "https://tulsisilks.co.in/product/"+itemData.seo_details.page_url,
          "item": {
            "@type": "Product",
            "@id": "https://tulsisilks.co.in/product/"+itemData.seo_details.page_url+"#product",
            "name": itemData.name,
            "image": [environment.img_baseurl+itemData.image_list[0].image],
            "description": itemData.seo_details.meta_desc,
            "sku": itemData.sku,
            // "aggregateRating": {
            //   "@type": "AggregateRating",
            //   "ratingValue": 4.8,
            //   "reviewCount": 255
            // },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": itemData.discounted_price,
              "availability": "https://schema.org/InStock",
              "url": "https://tulsisilks.co.in/product/"+itemData.seo_details.page_url,
              "priceValidUntil": this.expiryData,
              "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": 0,
                  "currency": "INR"
                },
                "deliveryTime": {
                  "@type": "ShippingDeliveryTime",
                  "transitTime": {
                    "@type": "QuantitativeValue",
                    "minValue": 4,
                    "maxValue": 7,
                    "unitCode": "d"
                  }
                },
                "shippingDestination": [
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "IN"
                  },
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "US"
                  },
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "GB"
                  },
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "AE"
                  }
                ]
              },
              "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "returnPolicyCategory": "MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 1,
                "applicableCountry": "IN",
                "returnShippingFeesAmount": {
                  "@type": "MonetaryAmount",
                  "currency": "INR",
                  "value": 0
                },
                "refundType": "FullRefund",
                "description": "Free returns within 1 day of delivery. Initiate return via orders@tulsisilks.com or customer service."
              },
              "seller": {
                "@type": "Organization",
                "name": "Tulsi Silks",
                "@id": "https://tulsisilks.co.in/#organization"
              }
            }
          }
        }
      );
    }

    let tempList = this.parent_list.sort((a, b) => 0 - (a.discounted_price > b.discounted_price ? -1 : 1));
    if(tempList.length > 1) {
      let minPrice = this.decimalPipe.transform(tempList[0].discounted_price, '1.0-0');
      let maxPrice = this.decimalPipe.transform(tempList[tempList.length-1].discounted_price, '1.0-0');
      this.categorySchema['@graph'][4]['priceRange'] = "INR "+minPrice+" - INR "+maxPrice;
    }

    // JSON-LD
    this.commonService.createJsonLD("category-jsonld", this.categorySchema);
  }

  getRandomProds(arr, num) {
    let shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.commonService.removeElement('category-jsonld');
    this.commonService.removeElement('category-faq-jsonld');

    // Remove event listeners
    if(isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', () => {
        this.checkNavigationOverflow();
        this.updateNavigationButtonVisibility();
      });
    }
  }

}