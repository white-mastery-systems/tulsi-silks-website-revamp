import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { environment } from './../../../environments/environment';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';
import { SwiperService } from '../../services/swiper.service'; // Add this import
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
  bcList: any = [];
  IsBrowser: boolean;
  trendColorList = ["Black", "White/Off-White", "Beige", "Brown", "Grey", "Cream", "Blue", "Red", "Maroon", "Gold", "Silver"];

  categorySchema: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tulsi Silks",
    "url": "https://tulsisilks.co.in/",
    "logo": "https://yourstore.io/api/uploads/5d30013a5c83a702392c4c8b/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 44 24991086",
      "contactType": "sales",
      "areaServed": "IN",
      "availableLanguage": "en"
    },
    "sameAs": [
      "https://www.facebook.com/TulsiSilks/",
      "https://www.instagram.com/tulsisilks/"
    ]
  };

  categoryFAQSchema: any = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": []
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private router: Router, 
    private activeRoute: ActivatedRoute,
    private storeApi: StoreApiService, 
    public cc: CurrencyConversionService, 
    public commonService: CommonService,
    public swiperService: SwiperService // Add this injection
  ) {
    this.subscription = this.commonService.currency_type.subscribe(currency => {
      this.findCurrency();
    });
    if(isPlatformBrowser(this.platformId)) this.IsBrowser = true;
  }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.showMore = false; this.params = params; this.tag_list = []; this.randomProducts = [];
      if(this.router.url=='/recommended-products' || this.router.url=='/all-products' || this.router.url=='/new-arrivals' || this.router.url=='/on-sale'|| this.router.url=='/featured-products'|| this.router.url=='/best-sellers') {
        this.params = { category_id: this.router.url };
        if(this.commonService.category_page_attr.category_id == this.router.url) {
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
          setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
          this.commonService.category_page_attr = {};
        }
        else {
          this.page = 1; this.sort_value = "latest";
          this.pageLoader = true; this.collapseIndex = 0;
          if(this.router.url=='/recommended-products') {
            this.category_details = { name: "Specially curated for you", route: this.router.url };
            if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("ai_styles")) {
              let filterList = this.commonService.decryptData(sessionStorage.getItem("ai_styles"));
              this.storeApi.AI_STYLES_FILTER({styles: filterList}).subscribe(result => {
                setTimeout(() => { this.pageLoader = false; }, 500);
                if(result.status) this.filterProducts(result.list);
                else console.log("response", result);
              });
            }
            else this.pageLoader = false;
          }
          else {
            let categoryName = ""; let filterType = "";
            if(this.router.url == "/all-products") {
              categoryName = "All Products"; filterType = "all";
            }
            else if(this.router.url == "/new-arrivals") {
              categoryName = "New Arrivals"; filterType = "new_arrivals";
            }
            else if(this.router.url == "/on-sale") {
              categoryName = "On Sale"; filterType = "discount";
            }
            else if(this.router.url == "/featured-products") {
              categoryName = "Featured Products"; filterType = "featured";
            }
            else if(this.router.url == "/best-sellers") {
              categoryName = "Best Sellers"; filterType = "best_sellers";
            }
            this.category_details = { name: categoryName, route: this.router.url };
            // seo details
            let metaInfo = {
              "all": {
                h1_tag: "All Products - "+this.commonService.store_details?.name,
                page_title: "All Products - Extensive Collection for Every Need | "+this.commonService.store_details?.name,
                meta_desc: "Browse our extensive collection of products at "+this.commonService.store_details?.name+", catering to a wide range of needs. You can find everything you're looking for here. Start exploring now.",
                meta_keywords: []
              },
              "new_arrivals": {
                h1_tag: "New Arrivals from Tulsi Silks",
                page_title: "Shop the Latest New Arrivals Collections from Tulsi Silks",
                meta_desc: "Explore the latest arrivals at Tulsi Silks and stay ahead of the trends with our newest saree collections. From exquisite sarees to timeless weaves, find the perfect blend of tradition and style. Elevate your wardrobe with premium silk craftsmanship and unmatched elegance. Shop now and experience luxury!",
                meta_keywords: []
              },
              "discount": {
                h1_tag: "On Sale - "+this.commonService.store_details?.name,
                page_title: "On Sale - Great Deals and Discounts | "+this.commonService.store_details?.name,
                meta_desc: "Explore the on-sale items at "+this.commonService.store_details?.name+" and enjoy great deals and discounts. Find high-quality products at affordable prices and make the most of your shopping experience.",
                meta_keywords: []
              },
              "featured": {
                h1_tag: "Featured Products - "+this.commonService.store_details?.name,
                page_title: "Featured Products - Handpicked Selection of Must-Haves | "+this.commonService.store_details?.name,
                meta_desc: "Check out our handpicked selection of featured products at "+this.commonService.store_details?.name+". Discover the trending and highly recommended must-haves from "+this.commonService.store_details?.name+".",
                meta_keywords: []
              },
              "best_sellers": {
                h1_tag: "Featured Products - "+this.commonService.store_details?.name,
                page_title: "Featured Products - Handpicked Selection of Must-Haves | "+this.commonService.store_details?.name,
                meta_desc: "Check out our handpicked selection of featured products at "+this.commonService.store_details?.name+". Discover the trending and highly recommended must-haves from "+this.commonService.store_details?.name+".",
                meta_keywords: []
              }
            };
            if(metaInfo[filterType]) {
              this.category_details.seo_status = true;
              this.category_details.seo_details = metaInfo[filterType];
            }
            // seo
            this.updateMetaData();
            this.storeApi.FILTERED_PRODUCT_LIST({ type: filterType }).subscribe(result => {
              setTimeout(() => { this.pageLoader = false; }, 500);
              if(result.status) this.filterProducts(result.list);
              else console.log("response", result);
            });
          }
          // seo
          this.updateMetaData();
        }
      }
      else if(this.params.category_id) {
        // product list
        if(this.commonService.category_page_attr.category_id == this.params.category_id) {
          this.page = this.commonService.category_page_attr.page;
          this.gridType = this.commonService.category_page_attr.grid_type;
          this.sort_value = this.commonService.category_page_attr.sort_value;
          this.collapseIndex = this.commonService.category_page_attr.collapse_index;
          this.category_details = this.commonService.category_page_attr.category_details;
          this.rangeMin = this.commonService.category_page_attr.range_min;
          this.rangeMax = this.commonService.category_page_attr.range_max;
          this.range_disp = this.commonService.category_page_attr.range_disp;
          this.randomProducts = this.commonService.category_page_attr.random_products;
          if(this.category_details?.faqs?.length) this.buildFAQSchema();
          // seo
          this.updateMetaData();
          this.parent_list = this.commonService.category_page_attr.parent_list;
          this.list = this.parent_list;
          this.findCurrency();
          // tag filter
          this.tag_list = this.commonService.category_page_attr.tag_list;
          this.onTagFilter(false);
          let scrollPos = this.commonService.category_page_attr.scroll_y_pos;
          setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
          this.commonService.category_page_attr = {};
        }
        else {
          this.page = 1; this.sort_value = "latest";
          this.pageLoader = true; this.collapseIndex = 0;
          this.storeApi.PRODUCT_LIST({ category_id: this.params.category_id }).subscribe(result => {
            setTimeout(() => { this.pageLoader = false; }, 500);
            if(result.status)
            {
              this.category_details = result.category_details;
              if(this.category_details?.faqs?.length) this.buildFAQSchema();
              // seo
              this.updateMetaData();
              // filter products
              this.parent_list = [];
              result.list.forEach(object => {
                object.created_on = new Date(new Date(new Date(object.created_on).setHours(23,59,59,59)).setDate(new Date(object.created_on).getDate() + 30));
                if(object.badge_list?.length) object.badge_list = this.commonService.buildTags(object.badge_list);
                if(object.hold_till) {
                  let balanceStock = object.stock;
                  if(new Date() < new Date(object.hold_till)) balanceStock = object.stock - object.hold_qty;
                  object.stock = balanceStock;
                }
                if(this.commonService.store_details?.additional_features?.disp_all_products) {
                  if(object.stock < this.commonService.min_qty[object.unit]) object.stock = 0;
                  this.parent_list.push(object);
                }
                else {
                  if(object.stock >= this.commonService.min_qty[object.unit] || object.allow_preorder) this.parent_list.push(object);
                }
              });
              this.list = this.parent_list;
              if(this.list.length > this.pageSize && this.category_details.prod_list_status) {
                this.randomProducts = this.getRandomProds(this.list, 15);
              }
              this.findCurrency();
              this.getProductTags();
            }
            else {
              console.log("response", result);
              this.router.navigate(["/"]);
            }
          });
        }
      }
      // JSON-LD
      this.commonService.createJsonLD("category-jsonld", this.categorySchema);
    });
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
    if(isPlatformBrowser(this.platformId)) {
      if(sessionStorage.getItem('pt')) {
        this.store_tags = this.commonService.decryptData(sessionStorage.getItem('pt'));
        this.onCreateTagList(this.list, false);
      }
      else {
        this.storeApi.PRODUCT_TAGS().subscribe(result => {
          if(result.status) {
            this.store_tags = JSON.parse(result.list);
            sessionStorage.setItem('pt', this.commonService.encryptData(this.store_tags));
            this.onCreateTagList(this.list, false);
          }
          else console.log("response", result);
        });
      }
    }
    this.findMinMax();
  }

  filterProducts(productList) {
    this.parent_list = [];
    productList.forEach(object => {
      object.created_on = new Date(new Date(new Date(object.created_on).setHours(23,59,59,59)).setDate(new Date(object.created_on).getDate() + 30));
      if(object.badge_list?.length) object.badge_list = this.commonService.buildTags(object.badge_list);
      if(object.hold_till) {
        let balanceStock = object.stock;
        if(new Date() < new Date(object.hold_till)) balanceStock = object.stock - object.hold_qty;
        object.stock = balanceStock;
      }
      if(this.commonService.store_details?.additional_features?.disp_all_products) {
        if(object.stock < this.commonService.min_qty[object.unit]) object.stock = 0;
        this.parent_list.push(object);
      }
      else {
        if(object.stock >= this.commonService.min_qty[object.unit] || object.allow_preorder) this.parent_list.push(object);
      }
    });
    this.list = this.parent_list;
    this.findCurrency();
    this.getProductTags();
  }

  findCurrency() {
    for(let product of this.parent_list) {
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
      parent_list: this.parent_list, page_url: this.router.url, grid_type: this.gridType, random_products: this.randomProducts,
      range_min: this.rangeMin, range_max: this.rangeMax, range_disp: this.range_disp
    }
    if(isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem("category_details", this.commonService.encryptData(this.category_details));
      if(this.template_setting.product_swiper) {
        let swipeProList: any = [];
        this.list.forEach(obj => {
          if(obj.seo_status) swipeProList.push(obj.seo_details.page_url);
          else swipeProList.push(obj._id);
        });
        sessionStorage.setItem("swipe_product_list", this.commonService.encryptData(swipeProList));
      }
    }
  }

  onCreateTagList(list, click) {
    let duplicateTagList: any = this.tag_list;
    this.tag_list = [];
    list.forEach(prod => {
      if(prod.tag_status) {
        prod.tag_list.forEach(tagObj => {
          let tagId = Object.keys(tagObj)[0];
          let existingTagIndex = duplicateTagList.findIndex(x => x._id == tagId && x.option_list.findIndex(obj => obj.checked)!=-1);
          if(existingTagIndex!=-1) {
            let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
            if(tagIndex == -1) this.tag_list.push(duplicateTagList[existingTagIndex]);
          }
          else {
            let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
            if(tagIndex == -1) {
              let tIndex = this.store_tags.findIndex(element => element._id==tagId);
              if(tIndex!=-1) {
                let optionArray = [];
                tagObj[tagId].forEach(element => { optionArray.push({name: element}) });
                if(optionArray.length) this.tag_list.push({ _id: tagId, name: this.store_tags[tIndex].name, rank: this.store_tags[tIndex].rank, option_list: optionArray });
              }
            }
            else {
              tagObj[tagId].forEach(element => {
                let optionIndex = this.tag_list[tagIndex].option_list.findIndex(x => x.name == element);
                if(optionIndex == -1) {
                  this.tag_list[tagIndex].option_list.push({ name: element });
                }
              });
            }
          }
        });
      }
    });
    if(this.tag_list.length && !click) this.gridType = "three";
    if(this.tag_list.length) {
      let trendingColors = this.tag_list[0].option_list.filter(el => this.trendColorList.indexOf(el.name)!=-1);
      let classicColors = this.tag_list[0].option_list.filter(el => this.trendColorList.indexOf(el.name)==-1);
      let newtagList = [];
      if(trendingColors.length) {
        newtagList.push(
          { _id: this.tag_list[0]._id, name: "Trending Colors", rank: 1, option_list: trendingColors }
        )
      }
      if(classicColors.length) {
        newtagList.push(
          { _id: this.tag_list[0]._id, name: "Classic Colors", rank: 2, option_list: classicColors }
        )
      }
      this.tag_list = newtagList;
      if(this.tag_list.length===1) this.collapseIndex = 0;
    }
  }

  onTagFilter(changeEvent) {
    let parentProducts: any = this.parent_list;
    this.tagSelected = false;
    let dummyList = [];
    this.tag_list.forEach(tag => {
      let tagId = tag._id;
      if(dummyList.length) { parentProducts = dummyList; dummyList = []; }
      tag.option_list.forEach(tagOption => {
        if(tagOption.checked) {
          this.tagSelected = true;
          let optionName = tagOption.name;
          parentProducts.forEach(prod => {
            prod.tag_list.forEach(prodTag => {
              if(Object.keys(prodTag)[0] == tagId) {
                let tagIndex = prodTag[tagId].findIndex(x => x == optionName);
                if(tagIndex != -1) {
                  // push product
                  let index = dummyList.findIndex(x => x._id == prod._id);
                  if(index == -1) dummyList.push(prod);
                }
              }
            });
          });
        }
      });
    });
    if(this.tagSelected) {
      if(dummyList.length) parentProducts = dummyList;
      this.list = parentProducts;
    }
    else this.list = this.parent_list;
    if(changeEvent) this.page = 1;
    this.findMinMax();
  }

  clearTagFilter() {
    this.list = this.parent_list;
    this.tag_list.forEach(tag => {
      tag.option_list.forEach(tagOption => { delete tagOption.checked; });
    });
    this.tagSelected = false;
    this.onCreateTagList(this.list, false);
    this.findMinMax();
  }

  findMinMax() {
    if(this.commonService.category_page_attr.category_id == this.router.url) {

    }
    else if(this.params.category_id && this.commonService.category_page_attr.category_id == this.params.category_id) {

    }
    else {
      let minPrice = this.list.reduce((min, p) => parseFloat(p?.temp_discounted_price)<min ? parseFloat(p?.temp_discounted_price) : min, parseFloat(this.list[0]?.temp_discounted_price));
      let maxPrice = this.list.reduce((max, p) => parseFloat(p?.temp_discounted_price)>max ? parseFloat(p?.temp_discounted_price) : max, parseFloat(this.list[0]?.temp_discounted_price));
      this.rangeMin = minPrice; this.rangeMax = maxPrice;
      if(!isNaN(minPrice) && !isNaN(maxPrice)) this.range_disp = { floor: minPrice, ceil: maxPrice };
    }
  }

  updateMetaData() {
    if(this.category_details.seo_status) this.commonService.setSiteMetaData(this.category_details.seo_details, null);
    else this.commonService.getStoreSeoDetails();
    // schema
    if(this.category_details?.name) {
      this.bcList = [
        { name: 'Home', position: 1, link: '/' },
        {
          name: this.category_details.name,
          position: 2,
          link: this.router.url,
        }
      ];
    }
    else this.bcList = [{ name: 'Home', position: 1, link: '/' }];
    this.commonService.breadCrumbList(this.bcList);
  }

  getRandomProds(arr, num) {
    let shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.commonService.removeElement('category-jsonld');
    this.commonService.removeElement('category-faq-jsonld');
  }

}