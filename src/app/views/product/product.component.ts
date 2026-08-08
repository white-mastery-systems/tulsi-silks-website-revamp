import { Component, OnInit, Inject, PLATFORM_ID, Renderer2, DOCUMENT, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Meta, DomSanitizer } from '@angular/platform-browser';
import { fromEvent, Subscription } from 'rxjs';
import { AccordionConfig } from 'ngx-bootstrap/accordion';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { StoreApiService } from '../../services/store-api.service';
import { WishlistService } from '../../services/wishlist.service';
import { CartlistService } from '../../services/cartlist.service';
import { CommonService } from '../../services/common.service';
import { SwiperService } from '../../services/swiper.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';
import { FitCreateProfileComponent } from '../../shared/modules/fit-profile/fit-create-profile.component';
import { DynamicAssetLoaderService } from '../../services/dynamic-asset-loader.service';
import * as PhotoSwipe from 'photoswipe';
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default';
declare const fbq: Function;
declare const $: any;

export function getAccordionConfig(): AccordionConfig {
  return Object.assign(new AccordionConfig(), { closeOthers: true });
}

@Component({
    selector: 'app-product',
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss', '../../shared/modules/fit-profile/fit-profile-modal.scss'],
    providers: [{ provide: AccordionConfig, useFactory: getAccordionConfig }],
    standalone: false
})

export class ProductComponent implements OnInit {

  @ViewChild('fitCreateProfile') fitCreateProfile: FitCreateProfileComponent;
  private pendingFitCreateConfig: any = null;

  imgBaseUrl: string = environment.img_baseurl;
  pageLoader: boolean; params: any;
  productDetails: any = {}; parentProductImages: any = [];
  activeImgIndex: number; tempMinCheckoutValue: any = 0;
  swipe_product_list: any; swipeProductIndex: number;
  category_details: any; psCssLoaded: boolean;
  bcList: any = []; enqForm: any = {};
  rpLoaded: boolean; psInitiated: boolean;
  blogList: any = []; recentlyViewedList: any = [];
  
  existing_model_list: any = [];
  addonForm: any = {}; customized_model: any;
  selected_unit: any = {};
  customIndex: number;  mmIndex: number;
  customSection: boolean; mmSection: boolean; noteSection: boolean;
  custom_list: any = []; measurement_sets: any = []; notes_list: any = [];
  fitProfileNameSuggestions: string[] = ['Standard Blouse Fit', 'Summer Cotton Fit', 'Wedding Silk Fit'];
  returnToReviewAfterEdit = false;
  reviewHalfCards: Array<{ label: string; value: string; type: string; index: number; image?: string; fullWidth?: boolean }> = [];
  reviewFullCards: Array<{ label: string; value: string; type: string; index: number; image?: string; fullWidth?: boolean }> = [];
  expandedModelMm: { [key: string]: boolean } = {};
  
  template_setting: any = environment.template_setting;
  exist_in_wishlist: boolean; cartCloseTimer: any;
  subscription: Subscription; wl_subscription: Subscription;
  related_products: any = []; reviews: any = []; avg_review: any;
  page: number; pageSize: number = 10; review_sort: string;
  prodFeatures: any = {}; pageUrl: string = "";
  shippingDuration: any = {
    ship_start: new Date(new Date().setDate(new Date().getDate() + 1)),
    ship_end: new Date(new Date().setDate(new Date().getDate() + 4)),
    delivery_start: new Date(new Date().setDate(new Date().getDate() + 5)),
    delivery_end: new Date(new Date().setDate(new Date().getDate() + 6))
  };
  shippingExists: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private renderer: Renderer2, @Inject(DOCUMENT) private document, private assetLoader: DynamicAssetLoaderService,
    private router: Router, private activeRoute: ActivatedRoute, public commonService: CommonService, private storeApi: StoreApiService, private meta: Meta, private sanitizer: DomSanitizer,
    private api: ApiService, public ws: WishlistService, private cartService: CartlistService, public cc: CurrencyConversionService, public swiperService: SwiperService
  ) {
    this.subscription = this.commonService.currency_type.subscribe(currency => {
      this.findCurrency();
    });
    this.wl_subscription = this.ws.observe_wishlist.subscribe(wishlist => {
      this.exist_in_wishlist = wishlist.some(x => x.product_id == this.productDetails._id);
    });
    if(isPlatformBrowser(this.platformId)) {
      // interaction
      fromEvent(document, 'mousemove').subscribe(() => this.relatedProducts());
      fromEvent(document, 'touchmove').subscribe(() => this.relatedProducts());
      fromEvent(document, 'scroll').subscribe(() => this.relatedProducts());
      fromEvent(document, 'click').subscribe(() => this.relatedProducts());
    }
  }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.pageUrl = this.router.url.split('?')[0];
      this.shippingExists = false;
      this.commonService.removeElement('product-jsonld');
      this.removeMetaProperties(); this.psInitiated = false;
      this.params = params; this.swipeProductIndex = 0; this.swipe_product_list = []; this.activeImgIndex = 0;
      this.category_details = {}; this.related_products = []; this.reviews = [];this.page = 1; this.review_sort = 'rating';
      if(this.commonService.product_page_attr) {
        this.rpLoaded = true;
        // for login redirection
        this.productDetails = this.commonService.product_page_attr.product;
        if(this.productDetails.footnote_list?.find(el => el.name=='Shipping Time')) this.shippingExists = true;
        this.parentProductImages = this.productDetails.image_list;
        this.activeImgIndex = this.commonService.product_page_attr.active_img_index;
        this.related_products = this.commonService.product_page_attr.related_products;
        delete this.commonService.product_page_attr;
        this.exist_in_wishlist = this.ws.checkProductExist(this.productDetails._id);
        this.createJsonLd();
        this.findCurrency();
        this.loadBlogAndProducts();
        this.addMeta();
        // bc schema
        this.bcSchema();
        // custom model
        if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("sizing_modal")) {
          this.customized_model = this.commonService.decryptData(sessionStorage.getItem("sizing_modal"));
          sessionStorage.removeItem("sizing_modal");
        }
        // video
        if(this.productDetails.video_details && Object.entries(this.productDetails.video_details).length) {
          const tag = this.document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          this.document.body.appendChild(tag);
        }
        // seo
        if(this.productDetails.seo_status) {
          let seoImage = this.imgBaseUrl+this.productDetails.image;
          this.commonService.setSiteMetaData(this.productDetails.seo_details, seoImage);
        }
        else this.commonService.getStoreSeoDetails();
      }
      else {
        this.rpLoaded = false;
        if(this.commonService.selected_product) {
          this.productDetails = this.commonService.selected_product;
          if(this.productDetails.footnote_list?.find(el => el.name=='Shipping Time')) this.shippingExists = true;
          this.productDetails.image = this.productDetails.image_list[0].image;
          delete this.commonService.selected_product;
        }
        else this.pageLoader = true;
        // swipe product list
        if(isPlatformBrowser(this.platformId)) {
          if(sessionStorage.getItem("swipe_product_list")) {
            this.swipe_product_list = this.commonService.decryptData(sessionStorage.getItem("swipe_product_list"));
            let proIndex = this.swipe_product_list.findIndex(obj => obj==this.params.product_id);
            if(proIndex!=-1) this.swipeProductIndex = proIndex;
          }
          if(sessionStorage.getItem("category_details")) this.category_details = this.commonService.decryptData(sessionStorage.getItem("category_details"));
        }
        // product details
        this.storeApi.PRODUCT_DETAILS({ product_id: this.params.product_id }).subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) {
            this.productDetails = result.data;
            if(this.productDetails.footnote_list?.find(el => el.name=='Shipping Time')) this.shippingExists = true;
            this.productDetails.original_desc = result.data.description;
            this.productDetails.description = this.sanitizer.bypassSecurityTrustHtml(this.productDetails.description);
            this.productDetails.quantity = this.commonService.min_qty[this.productDetails.unit];
            this.productDetails.additional_qty = 0;
            this.productDetails.addon_price = 0;
            this.productDetails.product_id = this.productDetails._id;
            this.parentProductImages = this.productDetails.image_list;
            this.productDetails.image = this.productDetails.image_list[0].image;
            this.productDetails.external_addon_status = this.productDetails.addon_status;
            this.productDetails.external_addon_list = this.productDetails.addon_list;
            this.exist_in_wishlist = this.ws.checkProductExist(this.productDetails._id);
            this.createJsonLd();
            this.findCurrency();
            this.loadBlogAndProducts();
            // schema
            this.bcSchema();
            // fb tracking
            if(isPlatformBrowser(this.platformId) && environment.facebook_pixel) {
              fbq('track', 'ViewContent', {
                value: this.productDetails.temp_discounted_price, currency: this.commonService.selected_currency.country_code,
                content_ids: this.productDetails.sku, content_type: 'Product'
              });
            }
            // video
            if(this.productDetails.video_details && Object.entries(this.productDetails.video_details).length) {
              const tag = this.document.createElement('script');
              tag.src = 'https://www.youtube.com/iframe_api';
              this.document.body.appendChild(tag);
            }
            // seo
            if(this.productDetails.seo_status) {
              let seoImage = this.imgBaseUrl+this.productDetails.image;
              this.commonService.setSiteMetaData(this.productDetails.seo_details, seoImage);
            }
            else this.commonService.getStoreSeoDetails();
            // add recently viewed prod localstorage
            let viewedProds = [];
            if(localStorage.getItem('vps')) viewedProds = JSON.parse(localStorage.getItem('vps'));
            let cpData: any = {
              _id: this.productDetails._id,
              name: this.productDetails.name,
              image_list: [this.productDetails.image_list[0]],
              seo_status: this.productDetails.seo_status,
              seo_details: this.productDetails.seo_details,
              disc_status: this.productDetails.disc_status,
              selling_price: this.productDetails.selling_price,
              discounted_price: this.productDetails.discounted_price,
              stock: this.productDetails.stock,
              created_on: this.productDetails.created_on,
              badge_list: []
            };
            if(this.productDetails.brand) cpData.brand = this.productDetails.brand;
            if(viewedProds.findIndex(el => el._id==cpData._id) == -1) {
              viewedProds.unshift(cpData);
              viewedProds = viewedProds.slice(0, 20);
            }
            localStorage.setItem('vps', JSON.stringify(viewedProds));
            // update stock
            if(this.productDetails.hold_till) {
              let balanceStock = this.productDetails.stock;
              if(new Date() < new Date(this.productDetails.hold_till)) balanceStock = this.productDetails.stock - this.productDetails.hold_qty;
              this.productDetails.stock = balanceStock;
            }
            if(this.productDetails.quantity > this.productDetails.stock) this.productDetails.quantity = this.productDetails.stock;
            // variants
            if(this.productDetails.variant_status && Array.isArray(this.productDetails.variant_types)) {
              // for first option checked
              this.productDetails.variant_types.forEach(element => {
                if (element?.options?.length) element.value = element.options[0].value;
              });
              this.setVariantPrice();
            }
            // PRODUCT FEATURES
            if(isPlatformBrowser(this.platformId)) {
              this.getProductFeatures().then((prodFeatures: any) => {
                this.prodFeatures = prodFeatures;
                if(this.commonService.ys_features.indexOf("vendors")!=-1 && this.productDetails.vendor_id) {
                  this.getVendorFeatures().then((vendorFeatures: any) => {
                    this.prodFeatures.addon_list = vendorFeatures.addon_list;
                    this.prodFeatures.measurement_set = vendorFeatures.measurement_set;
                    this.prodFeatures.faq_list = vendorFeatures.faq_list;
                    this.prodFeatures.size_chart = vendorFeatures.size_chart;
                    this.setProductFeatures();
                  });
                }
                else this.setProductFeatures();
              });
            }
            // product reviews
            if(this.commonService.ys_features.indexOf('product_reviews')!=-1) {
              this.storeApi.REVIEWS(this.productDetails._id).subscribe(result => {
                if(result.status) {
                  this.reviews = result.list;
                  this.reviews.forEach(obj => {
                    obj.description = obj.description.replace(new RegExp('\n', 'g'), "<br />");
                  });
                  let totalRating = this.reviews.reduce((accumulator, currentValue) => {
                    return accumulator + currentValue['rating'];
                  }, 0);
                  this.avg_review = totalRating/this.reviews.length;
                  if(this.avg_review % 1) this.avg_review = this.avg_review.toFixed(1);
                  this.sorting(this.review_sort);
                  // Rebuild product schema now that rating data is available
                  this.commonService.removeElement('product-jsonld');
                  this.createJsonLd();
                }
              });
            }
          }
          else {
            console.log("p1-response", result, this.router.url);
            this.router.navigate(["/"]);
          }
        }, () => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          this.router.navigate(["/"]);
        });
      }
    });
  }

  loadBlogAndProducts() {
    // random blogs
    this.blogList = [];
    this.storeApi.RANDOM_BLOG_LIST({ limit: 4 }).subscribe(result => {
      if(result.status) this.blogList = result.list;
      else console.log("p2-response", result, this.router.url);
    });
    // recently viewed
    this.recentlyViewedList = [];
    if(localStorage.getItem('vps')) {
      let rvList = JSON.parse(localStorage.getItem('vps'));
      // let pInd = rvList.findIndex(el => el._id==this.productDetails._id);
      // if(pInd!=-1) rvList.splice(pInd, 1);
      if(rvList.length) {
        let rmProds = [];
        this.findCurrency();
        let getIds = rvList.map((el) => el._id);
        this.storeApi.PRODUCT_LIST({ ids: getIds }).subscribe((result) => {
          if(result.status) {
            for(let element of rvList)
            {
              let pData = result.list.find(el => el._id==element._id && el.stock && el._id!=this.productDetails._id);
              if(pData) this.recentlyViewedList.push(pData);
              else rmProds.push(element._id);
            }
            if(rmProds.length) {
              let validProds = rvList.filter(el => rmProds.indexOf(el._id)==-1);
              localStorage.setItem('vps', JSON.stringify(validProds));
            }
            this.findCurrency();
          }
          else console.log("p3-response", result, this.router.url);
        });
      }
    }
  }

  bcSchema() {
    this.bcList = [{ name: 'Home', position: 1, link: '/' }];
      if (this.category_details?.name) {
        this.bcList.push({ name: this.category_details.name, position: 2 });
        if (this.category_details.route)
          this.bcList[1].link = this.category_details.route;
        else
          this.bcList[1].link = this.category_details.seo_status
            ? '/category/' + this.category_details.seo_details.page_url
            : '/category/' + this.category_details._id;
    }
    this.bcList.push({
      name: this.productDetails.name,
      position: this.bcList.length + 1,
      link: this.router.url.split('?')[0],
    });
    this.commonService.breadCrumbList(this.bcList);
  }

  relatedProducts() {
    this.initializePhotoSwipe();
    // related products
    if(this.commonService.ys_features?.indexOf('related_products')!=-1 && !this.rpLoaded) {
      let catId = null;
      if(this.category_details?._id) catId = this.category_details._id;
      else if(this.productDetails?.category_id?.length) catId = this.productDetails.category_id[0];
      if(catId) {
        this.rpLoaded = true;
        this.storeApi.RANDOM_PRODUCT_LIST({ category_id: catId, limit: environment.template_setting.related_products_limit }).subscribe(result => {
          if(result.status) {
            this.related_products = result.list;
            for(let product of this.related_products) {
              product.created_on = new Date(new Date(new Date(product.created_on).setHours(23,59,59,59)).setDate(new Date(product.created_on).getDate() + 30));
              if(product.badge_list?.length) product.badge_list = this.commonService.buildTags(product.badge_list);
              if(product.hold_till) {
                let balanceStock = product.stock;
                if(new Date() < new Date(product.hold_till)) balanceStock = product.stock - product.hold_qty;
                product.stock = balanceStock;
              }
              product.temp_selling_price = this.cc.CALC(product.selling_price);
              product.temp_discounted_price = this.cc.CALC(product.discounted_price);
            }
          }
        });
      }
    }
  }

  // JSON LD
  createJsonLd() {
    let productSchema: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": this.commonService.origin+this.pageUrl+"#product",
      "name": this.productDetails.name,
      "image": [],
      "description": this.productDetails.seo_details?.meta_desc || '',
      "sku": this.productDetails.sku,
      "productID": this.productDetails.sku,
      "brand": {
        "@type": "Brand",
        "name": "Tulsi Silks"
      },
      "additionalProperty": [],
      "offers": {
        "@type": "Offer",
        "url": this.commonService.origin+this.pageUrl,
        "priceCurrency": "INR",
        "price": this.productDetails.discounted_price.toFixed(2),
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": { "@type": "Organization", "name": "Tulsi Silks" }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": this.commonService.origin+this.pageUrl
      }
    };
    if(!this.productDetails.stock) productSchema['offers']['availability'] = "https://schema.org/OutOfStock";
    if(this.productDetails.tag_status && this.productDetails.tag_list.length) {
      let tagData = this.productDetails.tag_list.find(el => el["5d3057b12d12374382fc07a0"].length);
      if(tagData) productSchema["color"] = this.formatColors(tagData["5d3057b12d12374382fc07a0"]);
    }
    if(this.productDetails.image_list?.length) {
      for(let iData of this.productDetails.image_list) {
        productSchema.image.push(environment.img_baseurl+iData.image);
      }
    }
    if(this.productDetails.footnote_list?.length) {
      for(let fData of this.productDetails.footnote_list) {
        let fHeading = fData.name;
        if(fHeading=="Measurements Saree") fHeading = "Saree Measurements";
        else if(fHeading=="Measurements Dupatta") fHeading = "Dupatta Measurements";
        else if(fHeading=="Measurement Blouse") fHeading = "Blouse Measurements";
        else if(fHeading=="Measurements Dhoti") fHeading = "Dhoti Measurements";
        else if(fHeading=="Measurement Pavadai") fHeading = "Pavadai Measurements";
        productSchema['additionalProperty'].push({ "@type": "PropertyValue", "name": fHeading, "value": fData.value });
      }
    }
    // AggregateRating + Review — available after the REVIEWS API resolves
    if(this.avg_review != null && this.reviews?.length) {
      productSchema['aggregateRating'] = {
        "@type": "AggregateRating",
        "ratingValue": String(this.avg_review),
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": String(this.reviews.length)
      };
      productSchema['review'] = this.reviews.slice(0, 5).map(r => {
        const body = (r.description || '').replace(/<br \/>/gi, ' ').replace(/<[^>]*>/g, '').trim();
        const entry: any = {
          "@type": "Review",
          "author": { "@type": "Person", "name": r.customer_name || 'Customer' },
          "reviewRating": { "@type": "Rating", "ratingValue": String(r.rating), "bestRating": "5", "worstRating": "1" }
        };
        if(body) entry['reviewBody'] = body;
        if(r.created_on) entry['datePublished'] = new Date(r.created_on).toISOString().split('T')[0];
        return entry;
      });
    }
    this.commonService.createJsonLD("product-jsonld", productSchema);
  }

  formatColors(colors) {
    if(!colors || colors.length === 0) return '';
    if(colors.length === 1) return colors[0];
    if(colors.length === 2) return colors.join(' and ');
    return colors.slice(0, -1).join(', ') + ' and ' + colors.at(-1);
  }

  openEnqModal(modalName) {
    this.enqForm = {};
    this.commonService.getCountryList();
    if (this.commonService.customer_token)
      this.enqForm = Object.assign({}, this.commonService.user_details);
    if (!this.enqForm.dial_code)
      this.enqForm.dial_code =
        this.commonService.store_details.company_details?.dial_code;
    modalName.show();
  }
  onEnquire() {
    this.enqForm.submit = true;
    let sendData = {
      store_id: this.commonService.store_id,
      product_id: this.productDetails._id,
      product_name: this.productDetails.name,
      product_sku: this.productDetails.sku,
      name: this.enqForm.name,
      email: this.enqForm.email,
      mobile: this.enqForm.dial_code + ' ' + this.enqForm.mobile,
    };
    this.storeApi.PRODUCT_ENQUIRY(sendData).subscribe(() => {
      this.enqForm.submit = false;
      this.enqForm.alert_msg = 'We will contact you shortly';
      setTimeout(() => {
        this.document.getElementById('closeEnqModal')?.click();
      }, 3000);
    });
  }

  getProductFeatures() {
    return new Promise((resolve, reject) => {
      if(this.commonService.product_features) {
        resolve(this.commonService.product_features);
      }
      else {
        this.storeApi.PRODUCT_FEATURES().subscribe(result => {
          let pdFeatures = JSON.parse(result.data);
          pdFeatures.addon_list = pdFeatures.addon_list.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
          pdFeatures.measurement_set = pdFeatures.measurement_set.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
          this.commonService.product_features = pdFeatures;
          resolve(pdFeatures);
        });
      }
    });
  }
  getVendorFeatures() {
    return new Promise((resolve, reject) => {
      let storageName = this.productDetails.vendor_id+"_f";
      if(sessionStorage.getItem(storageName)) {
        let vdFeatures = this.commonService.decryptData(sessionStorage.getItem(storageName));
        resolve(vdFeatures);
      }
      else {
        this.storeApi.VENDOR_FEATURES(this.productDetails.vendor_id).subscribe(result => {
          let vdFeatures = JSON.parse(result.data);
          vdFeatures.addon_list = vdFeatures.addon_list.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1)),
          vdFeatures.measurement_set = vdFeatures.measurement_set.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1)),
          sessionStorage.setItem(storageName, this.commonService.encryptData(vdFeatures));
          resolve(vdFeatures);
        });
      }
    });
  }

  // photoswipe
  initializePhotoSwipe() {
    if(isPlatformBrowser(this.platformId) && !this.psInitiated && this.productDetails?.image_list?.length && this.productDetails?.image_list[0]?.image) {
      this.psInitiated = true;
      this.assetLoader.load('jquery', 'photoswipe', 'default-skin').then(data => {
        this.psCssLoaded = true;
        let swipeItems: any = [];
        this.productDetails.image_list.forEach(element => {
          let imgPath = this.imgBaseUrl+element.image;
          swipeItems.push({ src: imgPath, w: '900', h: '1060' });
        });
        setTimeout(function () {
          $('#photogallery a').click(function (event) {
            event.preventDefault();
            let index = $("#photogallery a").index(this);
            let $pswp = $('.pswp')[0],
            options = {
              index: index,
              bgOpacity: 0.8,
              captionEl: false,
              tapToClose: true,
              closeOnScroll: false,
              closeOnVerticalDrag: false,
              shareEl: false,
              fullscreenEl: false,
              getDoubleTapZoom: function(isMouseClick, item) {
                if(isMouseClick) {
                  return 2;
                } else {
                  return item.initialZoomLevel < 0.7 ? 2 : 1.33;
                }
              },
              maxSpreadZoom: 2
            };
            let gallery = new PhotoSwipe($pswp, PhotoSwipeUI_Default, swipeItems, options);
            gallery.init();
          });
        }, 500);
      }).catch(error => console.log("err", error));
    }
  }

  blouseStitchingCalloutOpen = false;
  editingExistingAddon = false;
  addonEditBackup: { selected_addon: any; customized_model: any } | null = null;

  isBlouseStitchingAddon(addon: any): boolean {
    if(!addon?.name) return false;
    const name = addon.name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\s*&\s*/g, ' and ');
    return name.includes('blouse stitching');
  }

  toggleBlouseStitchingCallout(event?: Event) {
    event?.stopPropagation();
    this.blouseStitchingCalloutOpen = !this.blouseStitchingCalloutOpen;
  }

  closeBlouseStitchingCallout() {
    this.blouseStitchingCalloutOpen = false;
  }

  applyAddonSelection(x, existingListModal, mmOptionsModal) {
    this.productDetails.selected_addon = x;
    this.productDetails.external_addon_status = true;
    if(!this.editingExistingAddon) {
      this.blouseStitchingCalloutOpen = false;
    }
    if(this.productDetails?.selected_addon?.custom_list?.length || this.productDetails?.selected_addon?.updated_mm_list?.length || this.productDetails?.selected_addon?.notes_list?.length) {
      if(!this.customized_model) {
        this.onSelectAddon(x, existingListModal, mmOptionsModal, 0);
      }
    }
    if(!this.editingExistingAddon) {
      this.onChangeAddon();
    }
  }

  editAddon(existingListModal, mmOptionsModal) {
    if(!this.productDetails?.selected_addon) return;
    this.addonEditBackup = {
      selected_addon: this.productDetails.selected_addon,
      customized_model: this.customized_model
    };
    this.editingExistingAddon = true;
    this.customized_model = null;
    this.chooseAddonNew(this.productDetails.selected_addon, existingListModal, mmOptionsModal);
  }

  cancelAddonModal(modal?: { hide?: () => void }) {
    if (modal?.hide) modal.hide();
    else this.fitCreateProfile?.hide();
    if(this.editingExistingAddon && this.addonEditBackup) {
      this.productDetails.selected_addon = this.addonEditBackup.selected_addon;
      this.customized_model = this.addonEditBackup.customized_model;
      this.clearAddonEditState();
      this.calcAddonPrice();
    }
    else {
      this.clearAddon();
    }
  }

  clearAddonEditState() {
    this.editingExistingAddon = false;
    this.addonEditBackup = null;
  }

  commitAddonEdit() {
    this.clearAddonEditState();
  }

  chooseAddonNew(x, existingListModal, mmOptionsModal) {
    this.applyAddonSelection(x, existingListModal, mmOptionsModal);
  }

  chooseAddon(mmOptionsModal, addonTypesModal, addonListModal, existingListModal) {
    this.productDetails.temp_addon_list = this.productDetails.addon_list;
    this.productDetails.external_addon_status = this.productDetails.addon_status;
    this.productDetails.quantity = this.commonService.min_qty[this.productDetails.unit];
    if(this.productDetails.addon_list.length==1) {
      const addon = this.productDetails.addon_list[0];
      if(!addon.custom_list.length && addon.updated_mm_list.length && addon.sizing_assistant_id) {
        this.productDetails.temp_selected_addon = addon;
        mmOptionsModal.show();
      }
      else {
        this.productDetails.selected_addon = addon;
        this.onChangeAddon();
        this.onCreateCustomization(existingListModal);
      }
    }
    else {
      this.productDetails.filteredNoneList = this.productDetails.addon_list.filter(obj => !obj.custom_list.length && !obj.updated_mm_list.length);
      this.productDetails.filteredCombinedList = this.productDetails.addon_list.filter(obj => obj.custom_list.length && obj.updated_mm_list.length);
      this.productDetails.filteredCustomList = this.productDetails.addon_list.filter(obj => obj.custom_list.length && !obj.updated_mm_list.length);
      this.productDetails.filteredMmList = this.productDetails.addon_list.filter(obj => !obj.custom_list.length && obj.updated_mm_list.length);
      if(!this.productDetails.filteredNoneList.length && !this.productDetails.filteredCombinedList.length && this.productDetails.filteredCustomList.length && this.productDetails.filteredMmList.length) {
        this.productDetails.sizingCard = "notExists";
        if(this.productDetails.filteredMmList.length==1 && this.productDetails.filteredMmList[0].sizing_assistant_id) this.productDetails.sizingCard = "exists";
        addonTypesModal.show();
      }
      else addonListModal.show();
    }
  }
  selectAddonType(filteredAddonList, addonListModal, existingListModal) {
    this.productDetails.external_addon_status = this.productDetails.addon_status;
    this.productDetails.quantity = this.commonService.min_qty[this.productDetails.unit];
    if(filteredAddonList.length==1) {
      this.productDetails.selected_addon = filteredAddonList[0];
      this.onChangeAddon();
      this.onCreateCustomization(existingListModal);
    }
    else {
      this.productDetails.temp_addon_list = filteredAddonList;
      addonListModal.show();
    }
  }
  redirectSizingAssistPage(addonDetails) {
    let prodAttr = { product: this.productDetails, selected_addon: addonDetails, active_img_index: this.activeImgIndex, related_products: this.related_products };
    if(isPlatformBrowser(this.platformId) && this.commonService.customer_token) {
      sessionStorage.setItem("product_attr", this.commonService.encryptData(prodAttr));
      this.router.navigate(["/sizing-assistant/"+addonDetails.sizing_assistant_id]);
    }
    else {
      delete this.productDetails.selected_addon;
      delete this.productDetails.external_addon_status;
      this.commonService.after_login_event = {
        type: 'custom_model', redirect: this.router.url,
        product_attr: { product: this.productDetails, active_img_index: this.activeImgIndex, related_products: this.related_products }
      };
      this.router.navigate(["/account"]);
    }
  }

  onSelectAddon(addonDetails, existingListModal, mmOptionsModal, delay) {
    setTimeout(() => {
      if(addonDetails.sizing_assistant_id) {
        this.productDetails.temp_selected_addon = addonDetails;
        mmOptionsModal.show();
      }
      else {
        this.productDetails.selected_addon = addonDetails;
        this.onChangeAddon();
        this.onCreateCustomization(existingListModal);
      }
    }, delay);
  }

  findCurrency() {
    this.productDetails.temp_selling_price = this.cc.CALC(this.productDetails.selling_price);
    this.productDetails.temp_discounted_price = this.cc.CALC(this.productDetails.discounted_price);
    this.productDetails.temp_addon_price = this.cc.CALC(this.productDetails.addon_price);
    this.tempMinCheckoutValue = this.cc.CALC_WO_AC(this.commonService.application_setting.min_checkout_value);
    for(let product of this.related_products) {
      product.temp_selling_price = this.cc.CALC(product.selling_price);
      product.temp_discounted_price = this.cc.CALC(product.discounted_price);
    }
    if(this.recentlyViewedList.length) {
      for (let product of this.recentlyViewedList) {
        product.temp_selling_price = this.cc.CALC(product.selling_price);
        product.temp_discounted_price = this.cc.CALC(product.discounted_price);
        if(product.selling_price > product.discounted_price) {
          let discAmount = product.selling_price - product.discounted_price;
          product.disc_percentage = Math.round((discAmount/product.selling_price)*100);
        }
      }
    }
    if(this.productDetails.addon_list?.length) {
      for(let addon of this.productDetails.addon_list) {
        addon.temp_price = this.cc.CALC(addon.price);
      }
    }
  }

  onChangeAddon() {
    if(this.productDetails.quantity > this.productDetails.stock) this.productDetails.quantity = this.productDetails.stock;
    if(this.productDetails.quantity < this.commonService.min_qty[this.productDetails.unit]) this.productDetails.quantity = this.commonService.min_qty[this.productDetails.unit];
    this.customized_model = null;
    this.productDetails.addon_alert = false;
    this.productDetails.customization_alert = false;
    this.productDetails.cart_alert = false;
    this.productDetails.buynow_alert = "";
    this.productDetails.added_to_cart = false;
    this.calcAddonPrice();
  }

  setVariantPrice() {
    this.productDetails.added_to_cart = false;
    this.productDetails.cart_alert = false;
    this.productDetails.buynow_alert = "";
    let variantInfo = []; let filterImgList = [];
    let variantImages = [];
    let productImgList = this.parentProductImages;
    let variantTypes = this.productDetails.variant_types;
    if (!Array.isArray(variantTypes) || !Array.isArray(this.productDetails.variant_list)) return;
    if(variantTypes.length===1) {
      variantInfo = this.productDetails.variant_list.filter(element => 
        element[variantTypes[0].name]==variantTypes[0].value
      );
      if(this.productDetails.image_tag_status) filterImgList = productImgList.filter(obj => obj.tag==variantTypes[0].value);
    }
    else if(variantTypes.length===2) {
      variantInfo = this.productDetails.variant_list.filter(element => 
        element[variantTypes[0].name]==variantTypes[0].value && element[variantTypes[1].name]==variantTypes[1].value
      );
      if(this.productDetails.image_tag_status) filterImgList = productImgList.filter(obj =>
        obj.tag==variantTypes[0].value || obj.tag==variantTypes[1].value
      );
    }
    else if(variantTypes.length===3) {
      variantInfo = this.productDetails.variant_list.filter(element => 
        element[variantTypes[0].name]==variantTypes[0].value && element[variantTypes[1].name]==variantTypes[1].value && element[variantTypes[2].name]==variantTypes[2].value
      );
      if(this.productDetails.image_tag_status) filterImgList = productImgList.filter(obj =>
        obj.tag==variantTypes[0].value || obj.tag==variantTypes[1].value || obj.tag==variantTypes[2].value
      );
    }
    if (!variantInfo.length || !variantInfo[0]) return;
    // update price
    if(variantInfo[0].sku) this.productDetails.sku = variantInfo[0].sku;
    if(variantInfo[0].taxrate_id) this.productDetails.taxrate_id = variantInfo[0].taxrate_id;
    if(variantInfo[0].image_list && variantInfo[0].image_list.length) {
      variantInfo[0].image_list.forEach(elem => {
        let imgData = {};
        for(let key in elem) {
          if(elem.hasOwnProperty(key)) imgData[key] = elem[key];
        }
        variantImages.push(imgData);
      });
    }
    this.productDetails.selling_price = variantInfo[0].selling_price;
    this.productDetails.discounted_price = variantInfo[0].discounted_price;
    this.productDetails.stock = variantInfo[0].stock;
    this.findCurrency();
    // update stock
    if(variantInfo[0].hold_till) {
      let balanceStock = this.productDetails.stock;
      if(new Date() < new Date(variantInfo[0].hold_till)) balanceStock = this.productDetails.stock - variantInfo[0].hold_qty;
      this.productDetails.stock = balanceStock;
    }
    this.productDetails.quantity = this.commonService.min_qty[this.productDetails.unit];
    if(this.productDetails.quantity > this.productDetails.stock) this.productDetails.quantity = this.productDetails.stock;
    if(this.productDetails.quantity < this.commonService.min_qty[this.productDetails.unit]) this.productDetails.quantity = this.commonService.min_qty[this.productDetails.unit];
    // update image list
    this.productDetails.image_list = productImgList;
    if(filterImgList.length) {
      productImgList.filter(obj => !obj.tag && !obj.hide_on_variants).forEach(element => { filterImgList.push(element); });
      this.productDetails.image_list = filterImgList;
    }
    if(variantImages.length) {
      filterImgList.forEach(element => { variantImages.push(element); });
      if(!filterImgList.length) productImgList.filter(obj => !obj.tag && !obj.hide_on_variants).forEach(element => { variantImages.push(element); });
      this.productDetails.image_list = variantImages;
    }
    this.initializePhotoSwipe();
    this.activeImgIndex = 0;
    this.productDetails.image = this.productDetails.image_list[0].image;
    delete this.productDetails.selected_addon;
    this.onChangeAddon();
    // addons
    this.filterProductAddons();
  }

  calcAddonPrice() {
    let customizedPrice = 0; this.productDetails.additional_qty = 0;
    if(this.productDetails.selected_addon && this.customized_model && this.customized_model.addon_id==this.productDetails.selected_addon._id) {
      if(this.customized_model.custom_list?.length) {
        this.customized_model.custom_list.forEach(obj => {
          obj.value.forEach(element => {
            customizedPrice += element.price;
            this.productDetails.additional_qty += element.additional_qty;
          });
        });
      }
      if(this.customized_model.mm_sets?.length) {
        this.customized_model.mm_sets.forEach(obj => {
          obj.list.forEach(element => {
            this.productDetails.additional_qty += element.additional_qty;
          });
        });
      }
    }
    this.productDetails.addon_price = 0;
    if(this.productDetails.selected_addon) this.productDetails.addon_price = this.productDetails.selected_addon.price+customizedPrice;
    if((this.productDetails.additional_qty % 1) != 0) this.productDetails.additional_qty = parseFloat(this.productDetails.additional_qty.toFixed(1));
    this.findCurrency();
  }

  prepareAddonForCheckout() {
    this.productDetails.customized_model = this.customized_model;
    this.productDetails.customization_status = false;
    if(this.productDetails.customized_model) {
      this.productDetails.customization_status = true;
      this.productDetails.customized_model.model_id = this.productDetails.customized_model._id;
    }
    if(this.productDetails.selected_addon) {
      this.productDetails.external_addon_status = true;
      this.calcAddonPrice();
    }
    this.productDetails.final_price = parseFloat(this.productDetails.discounted_price);
    if(this.productDetails.unit=="Pcs") {
      this.productDetails.final_price = parseFloat(this.productDetails.discounted_price)+parseFloat(this.productDetails.addon_price || 0);
    }
  }

  getRadioNextList(optionName) {
    const nextStep = this.custom_list[this.customIndex + 1];
    if(!nextStep?.option_list?.length) return;
    nextStep.filtered_option_list = nextStep.option_list.filter(obj => obj.link_to=='all' || obj.link_to==optionName);
  }
  getCheckboxNextList() {
    const currentStep = this.custom_list[this.customIndex];
    const nextStep = this.custom_list[this.customIndex + 1];
    if(!currentStep?.filtered_option_list || !nextStep?.option_list?.length) return;

    let selectedItems = [];
    currentStep.filtered_option_list.forEach(obj => {
      if(obj.custom_option_checked) selectedItems.push(obj.name);
    });
    nextStep.filtered_option_list = nextStep.option_list.filter(obj => obj.link_to=='all' || selectedItems.indexOf(obj.link_to)!=-1);
  }
  disableOption() {
    const step = this.custom_list[this.customIndex];
    if(!step?.filtered_option_list?.length || !(step.limit > 0)) return;

    let checkedLen = step.filtered_option_list.filter(obj => obj.custom_option_checked).length;
    if(step.limit==checkedLen) {
      step.filtered_option_list.forEach(obj => {
        obj.disabled = true;
        if(obj.custom_option_checked) obj.disabled = false;
      });
    }
    else step.filtered_option_list.forEach(obj => { obj.disabled = false; });
  }

  addtoCart(openPopup) {
    this.prepareAddonForCheckout();
    // addon section
    if(this.productDetails.selected_addon && this.productDetails.selected_addon!=undefined) {
      if(this.productDetails.selected_addon.custom_list.length || this.productDetails.selected_addon.updated_mm_list.length) {
        if(this.productDetails.customized_model && this.productDetails.customized_model!=undefined) this.addToCartTrigger(openPopup);
        else this.productDetails.customization_alert = true;
      }
      else this.addToCartTrigger(openPopup);
    }
    else {
      if(this.commonService.application_setting.product_addon && this.productDetails.addon_status && this.productDetails.addon_list.length && this.productDetails.addon_must)
      {
        if(this.productDetails.selected_addon && this.productDetails.selected_addon!=undefined) {
          if(this.productDetails.selected_addon.custom_list.length || this.productDetails.selected_addon.updated_mm_list.length) {
            if(this.productDetails.customized_model && this.productDetails.customized_model!=undefined) this.addToCartTrigger(openPopup);
            else this.productDetails.customization_alert = true;
          }
          else this.addToCartTrigger(openPopup);
        }
        else this.productDetails.addon_alert = true;
      }
      else {
        this.productDetails.external_addon_status = false;
        this.addToCartTrigger(openPopup);
      }
    }
  }
  addToCartTrigger(openPopup) {
    this.productDetails.cart_alert = true;
    this.productDetails.added_to_cart = true;
    if(isPlatformBrowser(this.platformId)) {
      if(environment.header_root.indexOf('sc') != -1) {
        if(openPopup && this.document.getElementById('side-minicart-trigger')) {
          setTimeout(() => { this.document.getElementById('side-minicart-trigger').click(); }, 100);
        }
        this.cartCloseTimer = setTimeout(() => { this.productDetails.cart_alert = false; }, 5000);
      }
      else {
        if(openPopup && this.document.getElementById('minicart-trigger')) this.document.getElementById('minicart-trigger').click();
        this.cartCloseTimer = setTimeout(() => {
          this.productDetails.cart_alert = false;
          if($('.cart-box:visible').length) $('.cart-box').slideUp('400');
        }, 5000);
        this.showHeader();
      }
    }
    this.cartService.addToCart(this.productDetails);
    if(this.params.wishstatus) this.ws.removeFromWishList(this.productDetails._id);
  }
  gotoCart() {
    if(environment.header_root.indexOf('sc') != -1) {
      if(this.document.getElementById('side-minicart-trigger')) this.document.getElementById('side-minicart-trigger').click();
    }
    else this.router.navigate(['/cart']);
  }

  buyNow() {
    if(isPlatformBrowser(this.platformId)) sessionStorage.removeItem("qo-cd");
    this.prepareAddonForCheckout();
    // addon section
    if(this.productDetails.selected_addon && this.productDetails.selected_addon!=undefined) {
      if(this.productDetails.selected_addon.custom_list.length || this.productDetails.selected_addon.updated_mm_list.length) {
        if(this.productDetails.customized_model && this.productDetails.customized_model!=undefined) this.continueBuyNow(this.productDetails);
        else this.productDetails.customization_alert = true;
      }
      else this.continueBuyNow(this.productDetails);
    }
    else {
      if(this.commonService.application_setting.product_addon && this.productDetails.addon_status && this.productDetails.addon_list.length && this.productDetails.addon_must)
      {
        if(this.productDetails.selected_addon && this.productDetails.selected_addon!=undefined) {
          if(this.productDetails.selected_addon.custom_list.length || this.productDetails.selected_addon.updated_mm_list.length) {
            if(this.productDetails.customized_model && this.productDetails.customized_model!=undefined) this.continueBuyNow(this.productDetails);
            else this.productDetails.customization_alert = true;
          }
          else this.continueBuyNow(this.productDetails);
        }
        else this.productDetails.addon_alert = true;
      }
      else {
        this.productDetails.external_addon_status = false;
        this.continueBuyNow(this.productDetails);
      }
    }
  }
  continueBuyNow(x) {
    let cartQty = this.productDetails.quantity + this.productDetails.additional_qty;
    let cartWeight = cartQty*this.productDetails.weight;
    let cartTotal = this.cc.CALC_INR_WITH_AC(this.productDetails.final_price * cartQty);
    if(this.productDetails.unit!="Pcs") {
      cartTotal += this.cc.CALC_INR_WITH_AC(this.productDetails.addon_price);
    }
    if(this.commonService.application_setting.max_shipping_weight > 0 && cartWeight > this.commonService.application_setting.max_shipping_weight) {
      this.productDetails.buynow_alert = "max_shipping";
    }
    else if(this.commonService.application_setting.min_checkout_value > cartTotal) {
      this.tempMinCheckoutValue = this.cc.CALC_WO_AC(this.commonService.application_setting.min_checkout_value);
      this.productDetails.buynow_alert = "min_checkout";
    }
    else {
      this.productDetails.buynow_loader = true;
      x.quantity = x.quantity+x.additional_qty;
      x.addon_status = x.external_addon_status;
      let checkoutDetails: any = { buy_now: true, item_list: [x], order_type: 'delivery' };
      if(this.commonService.customer_token) {
        this.api.USER_DETAILS().subscribe(result => {
          if(result.status) {
            this.ws.removeFromWishList(x._id);
            let addressList = result.data.address_list;
            let shippingIndex = addressList.findIndex(obj => obj.shipping_address);
            if(shippingIndex != -1) {
              checkoutDetails.shipping_address = addressList[shippingIndex];
              // pincode verification
              if(this.commonService.ys_features.indexOf('pincode_service')!=-1 && this.commonService.store_properties.pincodes.length && this.commonService.store_properties.pincodes.indexOf(checkoutDetails.shipping_address.pincode)==-1) {
                // redirect to address list
                this.buynowNavigation(checkoutDetails, '/checkout/address-list/product');
              }
              else {
                // shipping
                if(this.commonService.ys_features.indexOf('time_based_delivery')!=-1) {
                  // redirect to delivery methods
                  this.buynowNavigation(checkoutDetails, '/checkout/delivery-methods');
                }
                else {
                  let sendData: any = {
                    sid: this.commonService.session_id, store_id: this.commonService.store_id, shipping_address: checkoutDetails.shipping_address._id,
                    order_type: checkoutDetails.order_type, currency_type: this.commonService.selected_currency.country_code, buy_now: true
                  };
                  sendData.item_list = this.commonService.getItemList(checkoutDetails.item_list);
                  this.api.SHIPPING_DETAILS(sendData).subscribe(result => {
                    if(result.status) {
                      checkoutDetails.shipping_method = result.data.shipping_method;
                      this.buynowNavigation(checkoutDetails, '/checkout/product-order-details');
                    }
                    else {
                      // redirect to shipping page
                      this.buynowNavigation(checkoutDetails, '/checkout/shipping-methods');
                    }
                  });
                }
              }
            }
            else {
              // redirect to address list
              this.buynowNavigation(checkoutDetails, '/checkout/address-list/product');
            }
          }
          else {
            this.productDetails.buynow_loader = false;
            console.log("p4-response", result, this.router.url);
          }
        });
      }
      else if(isPlatformBrowser(this.platformId) && this.commonService.application_setting.guest_checkout) {
        if(sessionStorage.getItem("guest_email")) {
          this.cartService.updateCartList([x]);
          if(sessionStorage.getItem("checkout_address")) {
            let guestAddress = this.commonService.decryptData(sessionStorage.getItem("checkout_address"));
            checkoutDetails.shipping_address = guestAddress.shipping;
            sessionStorage.setItem("checkout_details", this.commonService.encryptData(checkoutDetails));
            // pincode verification
            if(this.commonService.ys_features.indexOf('pincode_service')!=-1 && this.commonService.store_properties.pincodes.length && this.commonService.store_properties.pincodes.indexOf(checkoutDetails.shipping_address.pincode)==-1) {
              // redirect to address list
              this.router.navigate(["/checkout/address-list/product"]);
            }
            else {
              // shipping
              if(this.commonService.ys_features.indexOf('time_based_delivery')!=-1) {
                // redirect to delivery methods
                this.router.navigate(['/checkout/delivery-methods']);
              }
              else {
                let sendData: any = {
                  sid: this.commonService.session_id, store_id: this.commonService.store_id, shipping_address: checkoutDetails.shipping_address._id,
                  order_type: checkoutDetails.order_type, currency_type: this.commonService.selected_currency.country_code, buy_now: true
                };
                sendData.item_list = this.commonService.getItemList(checkoutDetails.item_list);
                this.api.SHIPPING_DETAILS(sendData).subscribe(result => {
                  if(result.status) {
                    checkoutDetails.shipping_method = result.data.shipping_method;
                    sessionStorage.setItem("checkout_details", this.commonService.encryptData(checkoutDetails));
                    this.router.navigate(['/checkout/product-order-details']);
                  }
                  else {
                    // redirect to shipping page
                    this.router.navigate(['/checkout/shipping-methods']);
                  }
                });
              }
            }
          }
          else {
            sessionStorage.setItem("checkout_details", this.commonService.encryptData(checkoutDetails));
            this.router.navigate(["/checkout/address-list/product"]);
          }
        }
        else {
          sessionStorage.setItem("checkout_details", this.commonService.encryptData(checkoutDetails));
          this.commonService.after_login_event = { type: 'buynow_product', product: x }; // for go main login page from guest login
          this.router.navigate(["/guest-login"]);
        }
      }
      else {
        this.commonService.after_login_event = { type: 'buynow_product', product: x };
        this.router.navigate(["/account"]);
      }
    }
  }
  buynowNavigation(checkoutDetails, redirect) {
    this.api.USER_UPDATE({ checkout_details: checkoutDetails }).subscribe(result => {
      this.productDetails.buynow_loader = false;
      if(result.status) this.router.navigate([redirect]);
      else {
        console.log("p5-response", result, this.router.url);
        this.router.navigate(["/"]);
      }
    });
  }

  private buildFitCreateConfig() {
    return {
      addon_id: this.productDetails.selected_addon._id,
      custom_list: this.custom_list,
      measurement_sets: this.measurement_sets,
      notes_list: this.notes_list,
      notesTitle: this.productDetails.selected_addon?.notes_title || '',
      showPrices: true,
      modalTitle: 'Create Measurement Profile',
      saveLabel: 'Save Fit Profile'
    };
  }

  private openPreparedFitCreate() {
    const config = this.pendingFitCreateConfig || this.buildFitCreateConfig();
    this.pendingFitCreateConfig = config;
    this.fitCreateProfile?.open(config);
  }

  /** Show all saved models for selection on the product page (newest first). */
  private getExistingModelsForAddon(modelList: any, _addonId?: any): any[] {
    // API returns oldest → newest; reverse so a newly added model appears first in Model Details.
    return Array.isArray(modelList) ? [...modelList].reverse() : [];
  }

  onFitProfileSaved(payload: any) {
    if (!this.fitCreateProfile) return;
    this.fitCreateProfile.setSubmitting(true);
    payload.addon_id = this.productDetails.selected_addon?._id || payload.addon_id;
    this.api.ADD_MODEL(payload).subscribe(result => {
      this.fitCreateProfile.setSubmitting(false);
      if (result.status) {
        this.customized_model = result.data.model_list[result.data.model_list.length - 1];
        this.commitAddonEdit();
        this.productDetails.added_to_cart = false;
        this.productDetails.buynow_alert = '';
        this.productDetails.customization_alert = false;
        this.calcAddonPrice();
        this.fitCreateProfile.hide();
        this.pendingFitCreateConfig = null;
      } else {
        this.fitCreateProfile.setAlert(result.message);
        console.log('p7-response', result, this.router.url);
      }
    });
  }

  onFitProfileCancelled() {
    this.pendingFitCreateConfig = null;
    this.cancelAddonModal(null);
  }

  // CUSTOMIZATION SECTION
  onCreateCustomization(existingListModal) {
    if(this.productDetails.selected_addon) {
      if(this.productDetails.selected_addon.custom_list.length || this.productDetails.selected_addon.updated_mm_list.length ||  this.productDetails.selected_addon.notes_list.length) {
        if(this.productDetails.quantity > this.productDetails.stock) this.productDetails.quantity = this.productDetails.stock;
        if(this.productDetails.quantity < this.commonService.min_qty[this.productDetails.unit]) this.productDetails.quantity = this.commonService.min_qty[this.productDetails.unit];
        this.customIndex = 0; this.mmIndex = 0; this.addonForm = {};
        this.returnToReviewAfterEdit = false;
        this.custom_list = this.productDetails.selected_addon.custom_list;
        this.measurement_sets = this.productDetails.selected_addon.updated_mm_list;
        this.measurement_sets.forEach(mm => {
          mm.list.forEach(li => { delete li.value });
        });
        this.notes_list = [];
        this.productDetails.selected_addon.notes_list.forEach(obj => {
          this.notes_list.push({ name: obj.name, required: obj.required });
        });
        this.customSection = false; this.mmSection = false; this.noteSection = false;
        // customization
        if(this.custom_list.length) {
          this.customSection = true;
          this.custom_list.forEach(obj => {
            delete obj.selected_option;
            obj.option_list.forEach(opt => { delete opt.custom_option_checked; delete opt.disabled; });
          });
          this.custom_list[this.customIndex].filtered_option_list = this.custom_list[this.customIndex].option_list;
          if(this.custom_list[this.customIndex].type=='either_or') {
            this.custom_list[this.customIndex].selected_option = this.custom_list[this.customIndex].filtered_option_list[0].name;
            this.getRadioNextList(this.custom_list[this.customIndex].selected_option);
          }
        }
        // measurement
        else if(this.measurement_sets.length) {
          this.mmSection = true;
          this.selected_unit = this.measurement_sets[this.mmIndex].units[0];
          this.addonForm.mm_unit = this.selected_unit.name;
        }
        // notes / review only
        else {
          this.noteSection = true;
          this.rebuildReviewCards();
        }
        this.pendingFitCreateConfig = this.buildFitCreateConfig();
        if(this.commonService.store_details.additional_features && this.commonService.store_details.additional_features.custom_model) {
          if(this.commonService.customer_token) {
            this.productDetails.custom_loader = true;
            this.api.USER_DETAILS().subscribe(result => {
              this.productDetails.custom_loader = false;
              if(result.status) {
                this.existing_model_list = this.getExistingModelsForAddon(
                  result.data?.model_list,
                  this.productDetails.selected_addon?._id
                );
                if(this.existing_model_list.length) {
                  existingListModal.show();
                } else {
                  this.openPreparedFitCreate();
                }
                this.commonService.scrollModalTop(500);
              }
              else console.log("p6-response", result, this.router.url);
            });
          }
          else {
            delete this.productDetails.selected_addon;
            delete this.productDetails.external_addon_status;
            this.commonService.after_login_event = {
              type: 'custom_model', redirect: this.router.url,
              product_attr: { product: this.productDetails, active_img_index: this.activeImgIndex, related_products: this.related_products }
            };
            this.router.navigate(["/account"]);
          }
        }
        else {
          this.openPreparedFitCreate();
        }
      }
    }
  }

  buildFAQList(productFaqList, storeFaqList) {
    return new Promise((resolve, reject) => {
      let updatedFaqList: any = [];
      productFaqList.forEach(faqObj => {
        let faqId = Object.keys(faqObj)[0];
        let quesIndex = storeFaqList.findIndex(obj => obj._id==faqId);
        if(quesIndex!=-1) {
          let answerIndex = storeFaqList[quesIndex].answer_list.findIndex(obj => obj._id==faqObj[faqId]);
          if(answerIndex!=-1) updatedFaqList.push({ ques: storeFaqList[quesIndex].name, ans: storeFaqList[quesIndex].answer_list[answerIndex].answer });
        }
      });
      resolve(updatedFaqList);
    });
  }

  // CUSTOMIZATION
  buildAddonList(addonList, overallmmList) {
    return new Promise((resolve, reject) => {
      addonList.forEach(addonObj => {
        // mm list
        addonObj.updated_mm_list = [];
        if(addonObj.mm_list.length) {
          addonObj.mm_list.forEach(obj => {
            let mmIndex = overallmmList.findIndex(elem => elem._id==obj.mmset_id);
            if(mmIndex!=-1) addonObj.updated_mm_list.push(overallmmList[mmIndex]);
          });
        }
      });
      resolve(addonList);
    });
  }

  customPrev() {
    if(this.returnToReviewAfterEdit && (this.customSection || this.mmSection)) {
      this.goToReviewStep();
      return;
    }
    if(this.customSection) {
      this.customIndex -= 1;
    }
    else if(this.mmSection) {
      if(this.custom_list.length) {
        this.mmSection = false;
        this.customSection = true;
      }
    }
    else if(this.noteSection) {
      this.noteSection = false;
      if(this.measurement_sets.length) {
        this.mmSection = true;
        this.mmIndex = 0;
      }
      else this.customSection = true;
    }
    this.addonForm.alert_msg = null;
    this.commonService.scrollModalTop(0);
  }

  getCustomizationStepMeta() {
    const customSteps = this.custom_list?.length || 0;
    // All measurement sets are shown as one wizard step
    const mmSteps = this.measurement_sets?.length ? 1 : 0;
    const reviewSteps = 1;
    const total = Math.max(1, customSteps + mmSteps + reviewSteps);
    let current = 1;
    let label = 'Customization';
    if(this.customSection) {
      current = (this.customIndex || 0) + 1;
      label = this.custom_list[this.customIndex]?.name || 'Customization';
    }
    else if(this.mmSection) {
      current = customSteps + 1;
      label = 'Body Measurements';
    }
    else if(this.noteSection) {
      current = customSteps + mmSteps + 1;
      label = 'Review & Save';
    }
    return {
      current,
      total,
      label,
      percent: Math.min(100, Math.round((current / total) * 100))
    };
  }

  isCustomizationNameStep(): boolean {
    return false;
  }

  isCustomListStyle(): boolean {
    const opts = this.custom_list?.[this.customIndex]?.filtered_option_list || [];
    if(!opts.length) return false;
    const withImage = opts.filter(o => !!o.image).length;
    return withImage < Math.ceil(opts.length / 2);
  }

  isCustomOptionSelected(option: any): boolean {
    const step = this.custom_list?.[this.customIndex];
    if(!step || !option) return false;
    if(step.type === 'either_or') return step.selected_option === option.name;
    return !!option.custom_option_checked;
  }

  selectCustomOption(option: any) {
    if(!option || option.disabled) return;
    const step = this.custom_list?.[this.customIndex];
    if(!step) return;
    this.addonForm.alert_msg = null;
    if(step.type === 'either_or') {
      step.selected_option = option.name;
      this.getRadioNextList(option.name);
      return;
    }
    option.custom_option_checked = !option.custom_option_checked;
    this.getCheckboxNextList();
    this.disableOption();
  }

  getCustomizationSummary(): Array<{ label: string; value: string; type: string; index: number; image?: string; fullWidth?: boolean; lines?: Array<{ label: string; value: string }> }> {
    const summary = [];
    (this.custom_list || []).forEach((step, index) => {
      if(step.type === 'either_or' && step.selected_option) {
        const selectedOpt = (step.filtered_option_list || step.option_list || [])
          .find(opt => opt.name === step.selected_option);
        summary.push({
          label: step.name,
          value: step.selected_option,
          type: 'custom',
          index,
          image: selectedOpt?.image || null,
          fullWidth: false
        });
      }
      else if(step.filtered_option_list || step.option_list) {
        const selected = (step.filtered_option_list || step.option_list || [])
          .filter(opt => opt.custom_option_checked);
        if(selected.length) {
          summary.push({
            label: step.name,
            value: selected.map(opt => opt.name).join(', '),
            type: 'custom',
            index,
            image: selected.length === 1 ? (selected[0].image || null) : null,
            fullWidth: selected.length > 1 || !selected[0]?.image,
            lines: selected.length > 1 ? selected.map(opt => ({ label: 'Selected', value: opt.name })) : null
          });
        }
      }
    });
    const mmCount = (this.measurement_sets || []).reduce((count, set) => {
      return count + (set.list || []).filter(item => item.value !== undefined && item.value !== null && item.value !== '').length;
    }, 0);
    if(mmCount) {
      summary.push({
        label: 'Measurements Summary',
        value: mmCount + ' Measurements Added' + (this.addonForm?.mm_unit ? ' • Unit: ' + this.addonForm.mm_unit : ''),
        type: 'mm',
        index: 0,
        fullWidth: true
      });
    }
    return summary;
  }

  rebuildReviewCards() {
    const summary = this.getCustomizationSummary();
    this.reviewHalfCards = summary.filter(item => !item.fullWidth);
    this.reviewFullCards = summary.filter(item => item.fullWidth);
  }

  trackReviewCard(_index: number, item: { type: string; index: number }) {
    return (item?.type || 'x') + '-' + (item?.index ?? _index);
  }

  /** Jump from Review & Save back to a specific wizard step. */
  onReviewEditClick(type: string, stepIndex: number) {
    if(!type) return;

    this.addonForm.alert_msg = null;
    this.returnToReviewAfterEdit = true;
    this.customSection = false;
    this.mmSection = false;
    this.noteSection = false;

    if(type === 'mm') {
      if(!this.measurement_sets?.length) {
        this.goToReviewStep();
        return;
      }
      this.mmSection = true;
      this.mmIndex = Math.min(Math.max(Number(stepIndex) || 0, 0), this.measurement_sets.length - 1);
      if(!this.addonForm.mm_unit && this.measurement_sets[0]?.units?.length) {
        this.selected_unit = this.measurement_sets[0].units[0];
        this.addonForm.mm_unit = this.selected_unit.name;
      }
      this.scrollFitModalBody();
      setTimeout(() => {
        const target = this.document.getElementById('fit-mm-set-' + this.mmIndex);
        if(target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    if(type === 'custom') {
      if(!this.custom_list?.length) {
        this.goToReviewStep();
        return;
      }
      try {
        this.prepareCustomStepsForEdit(Number(stepIndex) || 0);
      }
      catch(err) {
        console.error('prepareCustomStepsForEdit failed', err);
        const safeIndex = Math.min(Math.max(Number(stepIndex) || 0, 0), this.custom_list.length - 1);
        this.customIndex = safeIndex;
        const step = this.custom_list[safeIndex];
        if(step && !step.filtered_option_list?.length) {
          step.filtered_option_list = step.option_list || [];
        }
      }
      this.customSection = true;
      this.scrollFitModalBody();
    }
  }

  private prepareCustomStepsForEdit(targetIndex: number) {
    const maxIndex = this.custom_list.length - 1;
    const safeIndex = Math.min(Math.max(targetIndex, 0), maxIndex);

    if(this.custom_list[0]) {
      this.custom_list[0].filtered_option_list = this.custom_list[0].option_list || [];
    }

    for(let i = 0; i < safeIndex; i++) {
      this.customIndex = i;
      const step = this.custom_list[i];
      if(!step) continue;

      if(!step.filtered_option_list?.length) {
        step.filtered_option_list = step.option_list || [];
      }

      if(step.type === 'either_or') {
        if(!step.selected_option && step.filtered_option_list?.length) {
          step.selected_option = step.filtered_option_list[0].name;
        }
        if(step.selected_option) this.getRadioNextList(step.selected_option);
      }
      else {
        this.getCheckboxNextList();
      }
    }

    this.customIndex = safeIndex;
    const targetStep = this.custom_list[safeIndex];
    if(!targetStep) return;

    if(!targetStep.filtered_option_list?.length) {
      targetStep.filtered_option_list = targetStep.option_list || [];
    }
    if(targetStep.type === 'either_or') {
      if(!targetStep.selected_option && targetStep.filtered_option_list?.length) {
        targetStep.selected_option = targetStep.filtered_option_list[0].name;
      }
    }
    else {
      this.disableOption();
    }
  }

  private scrollFitModalBody() {
    this.commonService.scrollModalTop(0);
    setTimeout(() => {
      const body = this.document.querySelector('.fit-profile-modal .fit-profile-modal__body') as HTMLElement;
      if(body) body.scrollTop = 0;
    }, 0);
  }

  private goToReviewStep() {
    this.customSection = false;
    this.mmSection = false;
    this.noteSection = true;
    this.returnToReviewAfterEdit = false;
    this.addonForm.alert_msg = null;
    this.rebuildReviewCards();
    this.scrollFitModalBody();
  }

  onCustomNext(gotoNext) {
    let reqInput = this.validateForm();
    if(reqInput===undefined) {
      let customAlert = this.checkCustomSelection();
      if(!customAlert) {
        if(this.returnToReviewAfterEdit) {
          this.goToReviewStep();
          return;
        }
        // customization next level
        if(!gotoNext) {
          this.mmSection = false; this.noteSection = false;
          this.customIndex = this.customIndex+1;
          if(this.custom_list[this.customIndex].type=='either_or') {
            if(this.custom_list[this.customIndex].selected_option) {
              if(this.custom_list[this.customIndex].filtered_option_list.findIndex(obj => obj.name==this.custom_list[this.customIndex].selected_option) == -1) {
                this.custom_list[this.customIndex].selected_option = this.custom_list[this.customIndex].filtered_option_list[0].name;
              }
            }
            else {
              this.custom_list[this.customIndex].selected_option = this.custom_list[this.customIndex].filtered_option_list[0].name;
            }
            this.getRadioNextList(this.custom_list[this.customIndex].selected_option);
          }
          else this.disableOption();
        }
        // measurement or review
        else {
          this.customSection = false; this.mmSection = false; this.noteSection = false;
          // measurement
          if(this.measurement_sets.length) {
            this.mmIndex = 0; this.mmSection = true;
            this.selected_unit = this.measurement_sets[this.mmIndex].units[0];
            this.addonForm.mm_unit = this.selected_unit.name;
          }
          // dedicated review & save step
          else this.goToReviewStep();
        }
        this.commonService.scrollModalTop(0);
      }
      else this.addonForm.alert_msg = customAlert;
    }
    else {
      this.addonForm.alert_msg = "Please fill out the mandatory fields";
      this.document.getElementById(reqInput).focus();
    }
  }
  onMmNext() {
    // Ensure every measurement set has values before moving to review
    for(let s = 0; s < (this.measurement_sets?.length || 0); s++) {
      const set = this.measurement_sets[s];
      const missing = (set?.list || []).findIndex(item => item?.value === undefined || item?.value === null || String(item.value).trim() === '');
      if(missing !== -1) {
        this.addonForm.alert_msg = 'Please complete ' + (set?.name || 'all') + ' measurements';
        const el = this.document.getElementById('value' + s + missing);
        if(el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }
    let reqInput = this.validateForm();
    if(reqInput===undefined) {
      (this.measurement_sets || []).forEach(set => {
        (set.list || []).forEach(elem => {
          elem.additional_qty = 0;
          if(elem.conditions?.length) {
            for(let cond of elem.conditions) {
              let filteredList = cond.list.filter(obj => obj.unit==this.addonForm.mm_unit);
              if(filteredList.length) {
                elem.additional_qty = filteredList[0].additional_qty;
                if(parseFloat(elem.value)>filteredList[0].mm_from && filteredList[0].mm_to>=parseFloat(elem.value)) {
                  elem.additional_qty = filteredList[0].additional_qty;
                  break;
                }
              }
            }
          }
        });
      });
      this.goToReviewStep();
    }
    else {
      this.addonForm.alert_msg = "Please fill out the mandatory fields";
      this.document.getElementById(reqInput).focus();
    }
  }
  
  onChangeUnit() {
    const unitSource = this.measurement_sets[this.mmIndex] || this.measurement_sets[0];
    let unitIndex = unitSource?.units?.findIndex(obj => obj.name==this.addonForm.mm_unit);
    if(unitIndex!=-1) this.selected_unit = unitSource.units[unitIndex];
    if(this.addonForm.mm_unit=='cms') {
      // convert inch -> cm
      this.measurement_sets.forEach(set => {
        set.list.forEach(element => {
          if(element.value) {
            element.value = element.value*2.54;
            if((element.value % 1) != 0) element.value = parseFloat(element.value.toFixed(1));
          }
        });
      });
    }
    else {
      // convert cm -> inch
      this.measurement_sets.forEach(set => {
        set.list.forEach(element => {
          if(element.value) {
            element.value = element.value*0.393701;
            if((element.value % 1) != 0) element.value = parseFloat(element.value.toFixed(1));
          }
        });
      });
    }
  }

  onSaveNewModal(modalName, customDetailsModal) {
    if(!this.addonForm?.name || !String(this.addonForm.name).trim()) {
      this.addonForm.alert_msg = "Please enter a model profile name";
      const nameEl = this.document.getElementById('model_name') || this.document.getElementById('model_name_final');
      if(nameEl) nameEl.focus();
      return;
    }
    let reqInput = this.validateForm();
    if(reqInput===undefined) {
      let customAlert = this.checkCustomSelection();
      if(!customAlert) {
        this.addonForm.addon_id = this.productDetails.selected_addon._id;
        this.addonForm.custom_list = [];
        this.custom_list.forEach(obj => {
          if(obj.filtered_option_list) {
            if(obj.type=="either_or") {
              let selIndex = obj.filtered_option_list.findIndex(opt => opt.name==obj.selected_option);
              if(selIndex!=-1) this.addonForm.custom_list.push({ name: obj.name, value: [obj.filtered_option_list[selIndex]] });
            }
            else {
              let selectedList = obj.filtered_option_list.filter(opt => opt.custom_option_checked);
              if(selectedList.length) this.addonForm.custom_list.push({ name: obj.name, value: selectedList })
            }
          }
        });
        // measurement section (for find additional qty)
        if(this.measurement_sets.length) {
          this.measurement_sets.forEach(set => {
            (set.list || []).forEach(elem => {
              elem.additional_qty = 0;
              if(elem.conditions?.length) {
                for(let cond of elem.conditions) {
                  let filteredList = cond.list.filter(obj => obj.unit==this.addonForm.mm_unit);
                  if(filteredList.length) {
                    elem.additional_qty = filteredList[0].additional_qty;
                    if(parseFloat(elem.value)>filteredList[0].mm_from && filteredList[0].mm_to>=parseFloat(elem.value)) {
                      elem.additional_qty = filteredList[0].additional_qty;
                      break;
                    }
                  }
                }
              }
            });
          });
        }
        this.productDetails.customization_alert = false;
        this.addonForm.mm_sets = this.measurement_sets;
        let noteIndex = this.notes_list.findIndex(obj => obj.value && obj.value!="");
        if(noteIndex!=-1) this.addonForm.notes_list = this.notes_list;
        this.addonForm.sid = this.commonService.session_id;
        this.addonForm.submit = true;
        this.api.ADD_MODEL(this.addonForm).subscribe(result => {
          this.addonForm.submit = false;
          if(result.status) {
            this.customized_model = result.data.model_list[result.data.model_list.length-1];
            this.commitAddonEdit();
            this.productDetails.added_to_cart=false;
            this.productDetails.buynow_alert = "";
            this.calcAddonPrice();
            modalName.hide();
            // if(customDetailsModal) this.openCustomDetailsModal(customDetailsModal);
          }
          else {
            this.addonForm.alert_msg = result.message;
            console.log("p7-response", result, this.router.url);
          }
        });
      }
      else this.addonForm.alert_msg = customAlert;
    }
    else {
      this.addonForm.alert_msg = "Please fill out the mandatory fields";
      this.document.getElementById(reqInput).focus();
    }
  }

  clearAddon() {
    this.productDetails.selected_addon = null;
    this.blouseStitchingCalloutOpen = false;
    this.clearAddonEditState();
    this.onChangeAddon();
  }

  openCustomDetailsModal(customDetailsModal) {
    this.commonService.customView = false;
    this.commonService.measurementView = false;
    this.commonService.notesView = false;
    if(this.customized_model) {
      if(this.customized_model.custom_list.length) this.commonService.customView = true;
      else if(this.customized_model.mm_sets.length) this.commonService.measurementView = true;
      else if(this.customized_model.notes_list.length) this.commonService.notesView = true;
    }
    customDetailsModal.show();
    this.commonService.scrollModalTop(500);
  }

  onSelectModal(x, modalName) {
    this.customized_model = x;
    this.commitAddonEdit();
    this.calcAddonPrice();
    this.productDetails.added_to_cart = false;
    this.productDetails.customization_alert = false;
    // if(modalName) setTimeout(() => { this.openCustomDetailsModal(modalName); }, 500);
  }

  getModelPreviewSlots(model: any): Array<{ label: string; value: string; image?: string }> {
    return [
      this.getModelCustomSlot(model, ['front'], 0, 'Front Neck'),
      this.getModelCustomSlot(model, ['rear', 'back'], 1, 'Back Neck'),
      this.getModelCustomSlot(model, ['lining', 'clos', 'extra'], 2, 'Lining')
    ].filter(Boolean) as Array<{ label: string; value: string; image?: string }>;
  }

  editExistingModel(model: any, existingModal?: any) {
    if(existingModal?.hide) existingModal.hide();
    this.clearAddon();
    this.router.navigate(['/account/models']);
  }

  getModelMeasurements(model: any): {
    unit: string | null;
    unitSymbol: string;
    count: number;
    summary: string;
    items: Array<{ name: string; value: string }>;
    groups: Array<{ name: string; items: Array<{ name: string; value: string }> }>;
  } {
    const sets = model?.mm_sets || [];
    const groups = [];
    const allItems = [];
    let count = 0;
    const highlightKeys = ['shoulder', 'chest', 'waist', 'length'];
    const highlightOrder = { shoulder: 0, chest: 1, waist: 2, length: 3 };

    sets.forEach((set: any, index: number) => {
      const groupItems = [];
      (set?.list || []).forEach((entry: any) => {
        if(!entry?.name) return;
        const raw = entry.value;
        if(raw === undefined || raw === null || String(raw).trim() === '') return;
        const row = { name: entry.name, value: String(raw) };
        groupItems.push(row);
        allItems.push(row);
      });
      if(!groupItems.length) return;

      const setName = String(set?.name || '').trim();
      const lower = setName.toLowerCase();
      let groupName = setName || ('Set ' + (index + 1));
      if(lower.includes('front')) groupName = 'Front';
      else if(lower.includes('rear') || lower.includes('back')) groupName = 'Rear';

      groups.push({ name: groupName, items: groupItems });
      count += groupItems.length;
    });

    const items = allItems
      .filter(item => {
        const name = String(item.name || '').toLowerCase();
        return highlightKeys.some(key => name.includes(key));
      })
      .sort((a, b) => {
        const aKey = highlightKeys.find(key => String(a.name || '').toLowerCase().includes(key)) || '';
        const bKey = highlightKeys.find(key => String(b.name || '').toLowerCase().includes(key)) || '';
        return (highlightOrder[aKey] ?? 99) - (highlightOrder[bKey] ?? 99);
      })
      // Keep first match per key (avoid duplicates across Front/Rear sets)
      .filter((item, index, list) => {
        const key = highlightKeys.find(k => String(item.name || '').toLowerCase().includes(k));
        return list.findIndex(other => String(other.name || '').toLowerCase().includes(key)) === index;
      });

    const unit = model?.mm_unit
      || sets[0]?.unit
      || sets[0]?.units?.[0]?.name
      || sets[0]?.list?.[0]?.unit
      || null;

    const unitLower = String(unit || '').toLowerCase();
    const unitSymbol = unitLower.includes('inch') || unitLower === 'in' || unitLower === 'inches'
      ? '"'
      : (unitLower.includes('cm') ? ' cm' : (unit ? ' ' + unit : ''));

    const summaryParts = groups.map(g => g.name + ' (' + g.items.length + ')');
    const summary = summaryParts.length
      ? summaryParts.join(' · ')
      : 'No measurements saved';

    return { unit, unitSymbol, count, summary, items, groups };
  }

  isModelMmExpanded(model: any, index: number): boolean {
    return !!this.expandedModelMm[this.getModelMmKey(model, index)];
  }

  toggleModelMm(model: any, index: number, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    const key = this.getModelMmKey(model, index);
    this.expandedModelMm[key] = !this.expandedModelMm[key];
  }

  private getModelMmKey(model: any, index: number): string {
    return String(model?._id || model?.id || ('model-' + index));
  }

  private getModelCustomSlot(model: any, keys: string[], fallbackIndex: number, displayLabel: string) {
    const list = model?.custom_list || [];
    if(!list.length) return null;

    let item = list.find((entry: any) => {
      const name = String(entry?.name || '').toLowerCase();
      return keys.some(key => name.includes(key));
    });
    if(!item) item = list[fallbackIndex];
    if(!item) return null;

    const values = item.value || [];
    const valueNames = values.map((v: any) => v?.name).filter(Boolean);
    return {
      label: displayLabel,
      value: valueNames.length ? valueNames.join(', ') : '—',
      image: values[0]?.image || null
    };
  }

  validateForm() {
    let form: any = this.document.getElementById('addon-form');
    for(let elem of form.elements) {
      if(elem.value === '' && elem.hasAttribute('required')) return elem.id;
    }
  }
  mmFocusOut(x) {
    if(x.value && x.value==0) {
      x.value=''; x.alert_msg = "Value must be greater than 0"; 
    }
    else if(this.selected_unit.max_value>0 && x.value>this.selected_unit.max_value) {
      x.value=''; x.alert_msg = "Value must be less than or equal to "+this.selected_unit.max_value;
    }
  }
  checkCustomSelection() {
    if(this.custom_list.length) {
      let checkedLen = this.custom_list[this.customIndex].filtered_option_list.filter(obj => obj.custom_option_checked).length;
      if(this.custom_list[this.customIndex].type=='mandatory') {
        if(this.custom_list[this.customIndex].limit==checkedLen) return null;
        else return "Must choose "+this.custom_list[this.customIndex].limit+" options";
      }
      else if(this.custom_list[this.customIndex].type=='limited') {
        if(this.custom_list[this.customIndex].limit >= checkedLen) return null;
        else return "Choose maximum "+this.custom_list[this.customIndex].limit+" options";
      }
      else return null;
    }
    else return null;
  }

  modifyWishList(type, product) {
    if(this.commonService.customer_token) {
      this.showHeader();
      if(type=='add') this.ws.addToWishList(product);
      else if(type=='remove') this.ws.removeFromWishList(product._id);
    }
    else {
      this.commonService.after_login_event = { type: 'add_product_to_wishlist', product: product, redirect: this.router.url };
      this.router.navigate(["/account"]);
    }
  }

  closeExistingAndOpenNewModal(existingModal) {
    existingModal.hide();
    setTimeout(() => { this.openPreparedFitCreate(); }, 500);
  }

  incQty() {
    this.productDetails.buynow_alert = "";
    this.productDetails.added_to_cart = false;
    this.productDetails.quantity += this.commonService.step_qty[this.productDetails.unit];
    if((this.productDetails.quantity % 1) != 0) this.productDetails.quantity = parseFloat(this.productDetails.quantity.toFixed(2));
    if((this.productDetails.quantity+this.productDetails.additional_qty) > this.productDetails.stock) this.productDetails.quantity = this.productDetails.stock-this.productDetails.additional_qty;
  }
  decQty() {
    this.productDetails.buynow_alert = "";
    this.productDetails.added_to_cart = false;
    this.productDetails.quantity -= this.commonService.step_qty[this.productDetails.unit];
    if((this.productDetails.quantity % 1) != 0) this.productDetails.quantity = parseFloat(this.productDetails.quantity.toFixed(2));
    if(this.productDetails.quantity < this.commonService.min_qty[this.productDetails.unit]) this.productDetails.quantity = this.commonService.min_qty[this.productDetails.unit];
  }

  setProductFeatures() {
    this.addMeta();
    // addons
    this.filterProductAddons();
    // size chart
    if(this.productDetails.chart_status && this.productDetails.chart_id) {
      let chartList = this.prodFeatures.size_chart;
      let chartIndex = chartList.findIndex(obj => obj._id==this.productDetails.chart_id);
      if(chartIndex!=-1) {
        this.productDetails.chart_details = chartList[chartIndex];
        this.productDetails.chart_keys = Object.keys(this.productDetails.chart_details.chart_list[0]);
      }
    }
    // faq
    if(this.productDetails.faq_status && this.productDetails.faq_list.length && this.prodFeatures.faq_list.length) {
      this.buildFAQList(this.productDetails.faq_list, this.prodFeatures.faq_list).then((resp: any) => {
        this.productDetails.faq_list = resp;
      });
    }
  }

  filterProductAddons() {
    if(this.productDetails.addon_status) {
      if(this.prodFeatures.addon_list) {
        let filteredAddons = this.prodFeatures.addon_list.filter(obj => this.productDetails.external_addon_list.findIndex(x => x.addon_id == obj._id) != -1 );
        if(this.productDetails.addon_must && !filteredAddons.length) this.productDetails.addon_must = false;
        this.buildAddonList(filteredAddons, this.prodFeatures.measurement_set).then((resp: any) => {
          this.productDetails.addon_list = resp.filter(obj => this.productDetails.stock >= obj.min_stock);
          this.findCurrency();
          if(this.commonService.ys_features.indexOf('sizing_assistant')!=-1 && this.prodFeatures.sizing_assistant.length) this.updateAddonWithSizingAssist(this.productDetails.addon_list);
        });
      }
    }
    else this.productDetails.addon_must = false;
  }

  updateAddonWithSizingAssist(addonList) {
    addonList.forEach(obj => {
      delete obj.sizing_assistant_id;
      if(!obj.custom_list.length && obj.updated_mm_list.length) {
        this.prodFeatures.sizing_assistant.forEach(element => {
          if(element.mm_list.length==obj.updated_mm_list.length) {
            if(this.findMatching(obj.updated_mm_list, element.mm_list)) {
              obj.sizing_assistant_id = element._id;
            }
          }
        });
      }
    });
  }
  findMatching(addonMmList, sizingMmList) {
    let matchingStatus: boolean = true;
    addonMmList.forEach(obj => {
      if(sizingMmList.findIndex(el => el.mmset_id==obj._id) == -1) matchingStatus = false;
    });
    return matchingStatus;
  }

  socialShare() {
    if(isPlatformBrowser(this.platformId)) {
      let windowNav: any = window.navigator;
      if(windowNav && windowNav.share) {
        windowNav.share({
          title: '', text: '',
          url: this.commonService.origin+this.router.url
        })
        .catch( (error) => { console.log(error); });
      }
      else console.log("share not supported")
    }
  }

  swipeProduct(index) {
    this.router.navigate(['/product/'+this.swipe_product_list[index]]);
  }

  showHeader() {
    let el = this.document.getElementById("headroom-head");
    if(el) {
      this.renderer.removeClass(el, 'slideUp');
      this.renderer.addClass(el, 'slideDown');
    }
  }

  onViewModel(x) {
    setTimeout(() => { this.commonService.onViewModel(x); }, 500);
  }

  sorting(field) {
    this.page = 1;
    if(field=='negative') this.reviews.sort((a, b) => 0 - (a.rating > b.rating ? -1 : 1));
    else this.reviews.sort((a, b) => 0 - (a[field] > b[field] ? 1 : -1));
  }

  // JSON LD
  stripHtml(html) {
    if(html) {
      let tmp = this.renderer.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent.slice(0, 320) || tmp.innerText.slice(0, 320) || "";
    }
    else return "";
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.wl_subscription.unsubscribe();
    if(isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem("category_details");
      sessionStorage.removeItem("swipe_product_list");
    }
    if(this.cartCloseTimer) clearTimeout(this.cartCloseTimer);
    // remove meta tag
    this.removeMetaProperties();
    this.commonService.removeElement('product-jsonld');
    this.commonService.removeElement('home-jsonld');
  }

  addMeta() {
    if(this.productDetails.taxonomy_id) {
      let tempIndex = this.prodFeatures.taxonomy.findIndex(obj => obj._id==this.productDetails.taxonomy_id);
      if(tempIndex!=-1) {
        let stockType = "in stock";
        if(this.productDetails.stock < this.commonService.min_qty[this.productDetails.unit]) stockType = "out of stock";
        this.meta.addTags([
          { property: 'og:url', content: this.commonService.origin+this.router.url },
          { property: 'product:brand', content: this.commonService.store_details.name },
          { property: 'product:availability', content: stockType },
          { property: 'product:condition', content: 'new' },
          { property: 'product:price:amount', content: this.productDetails.discounted_price },
          { property: 'product:price:currency', content: this.commonService.store_details.currency },
          { property: 'product:retailer_item_id', content: this.productDetails.sku },
          { property: 'product:category', content: this.prodFeatures.taxonomy[tempIndex].category_id }
        ]);
      }
    }
  }
  removeMetaProperties() {
    this.removeMeta("og:url");
    this.removeMeta("product:brand");
    this.removeMeta("product:availability");
    this.removeMeta("product:condition");
    this.removeMeta("product:price:amount");
    this.removeMeta("product:price:currency");
    this.removeMeta("product:retailer_item_id");
    this.removeMeta("product:category");
  }
  removeMeta(name: string) {
    let attributeSelector = `property="${name}"`;
    if(attributeSelector && attributeSelector!=undefined) this.meta.removeTag(attributeSelector);
  };

}