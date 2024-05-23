import { Component, OnInit, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { StoreApiService } from '../../../../services/store-api.service';
import { CommonService } from '../../../../services/common.service';
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
  bcList: any = [];

  constructor(
    private router: Router, private storeApi: StoreApiService, private activeRoute: ActivatedRoute,
    public commonService: CommonService, private sanitizer: DomSanitizer, private datePipe: DatePipe, private renderer: Renderer2
  ) {
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
      "headline": this.blog_details.name,
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

}