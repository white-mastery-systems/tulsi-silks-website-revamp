import { Component, OnInit, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { StoreApiService } from '../../../../services/store-api.service';
import { CommonService } from '../../../../services/common.service';
import { SwiperService } from '../../../../services/swiper.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blog-details',
  templateUrl: './blog-details.component.html',
  styleUrls: ['./blog-details.component.scss']
})

export class BlogDetailsComponent implements OnInit {

  blog_details: any = {};
  pageLoader: boolean;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  storeSubscription: Subscription;
  subscription: Subscription;
  bcList: any = [];

  constructor(
    private router: Router, private storeApi: StoreApiService, private activeRoute: ActivatedRoute, public swiperService: SwiperService,
    public commonService: CommonService, private sanitizer: DomSanitizer, private datePipe: DatePipe, private renderer: Renderer2,
    public cc: CurrencyConversionService
  ) {
    this.subscription = this.commonService.currency_type.subscribe(() => {
      this.findCurrency();
    });
    this.storeSubscription = this.commonService.storeDataListener.subscribe(() => {
      this.getData();
    });
  }

  ngOnInit(): void {
    if (this.commonService.storeDataLoaded) this.getData();
    else this.pageLoader = true;
  }

  getData(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.pageLoader = true;
      this.storeApi.BLOG_DETAILS(params['blog_id']).subscribe(result => {
        if(result.status) {
          this.blog_details = result.data;
          if(!this.blog_details.segments) this.blog_details.segments = [];
          for(let segment of this.blog_details.segments) {
            if(segment.type=="featured_product") {
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
          }
          this.findCurrency();
          this.updateMetaData();
        }
        else {
          console.log("response", result);
          this.router.navigate(["/"]);
        }
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    });
  }

  exploreAll(segment) {
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
  getCatalogInfo(catId) {
    let secIndex = this.commonService.catalog_list.findIndex(obj => obj._id==catId);
    if(secIndex != -1) {
      let categoryDetails = this.commonService.catalog_list[secIndex];
      if(categoryDetails.seo_status) this.router.navigate(['/category/'+categoryDetails.seo_details.page_url]);
      else this.router.navigate(['/category/'+categoryDetails._id]);
    }
  }

  updateMetaData() {
    this.blog_details.description = this.sanitizer.bypassSecurityTrustHtml(this.blog_details.description);
    if(this.blog_details.seo_status) {
      let seoImage = this.imgBaseUrl+this.blog_details.image;
      this.commonService.setSiteMetaData(this.blog_details.seo_details, seoImage);
    }
    else this.commonService.getStoreSeoDetails();
    // schema
    if(!this.blog_details.updatedAt) this.blog_details.updatedAt = new Date();
    let blogSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": this.commonService.origin+this.router.url.split('?')[0]
      },
      "headline": this.blog_details.seo_details?.page_title,
      "image": this.imgBaseUrl+this.blog_details.image,  
      "author": {
        "@type": "Organization",
        "name": this.commonService.store_details?.name,
        "url": this.commonService.origin,
      },  
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
        "mainEntity": []
      };
      this.blog_details.faqs.forEach(el => {
        faqSchema.mainEntity.push({
          "@type": "Question",
          "name": el.ques,
          "acceptedAnswer": { "@type": "Answer", "text": el.answer }
        });
      });
      this.commonService.createJsonLD("blog-faq-jsonld", faqSchema);
    }
  }

  stripHtml(html) {
    if (html) {
      let tmp = this.renderer.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent.slice(0, 320) || tmp.innerText.slice(0, 320) || '';
    } else return '';
  }

  ngOnDestroy() {
    this.storeSubscription.unsubscribe();
    this.commonService.removeElement('blog-jsonld');
    this.commonService.removeElement('blog-faq-jsonld');
  }

  findCurrency() {
    if(this.blog_details?.segments?.length) {
      for(let segment of this.blog_details.segments) {
        if(segment.type=="featured_product") {
          for(let product of segment.product_list) {
            product.temp_selling_price = this.cc.CALC(product.selling_price);
            product.temp_discounted_price = this.cc.CALC(product.discounted_price);
          }
        }
      }
    }
  }

}