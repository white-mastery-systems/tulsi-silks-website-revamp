import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.scss']
})

export class DiscountsComponent implements OnInit {

  page: number = 1; pageSize: number = 12;
  pageLoader: boolean;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router, private storeApi: StoreApiService, public commonService: CommonService) { }

  ngOnInit(): void {
    if(this.commonService.ys_features.indexOf('discounts_page')!=-1 && !this.commonService.discount_page) {
      this.pageLoader = true;
      this.storeApi.DISCOUNTS().subscribe(result => {
        if(result.status) this.commonService.discount_page = result.data;
        else {
          console.log("response", result);
          this.commonService.discount_page = {};
        }
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    }
  }

  onSelectDiscount(x) {
    if(x.link_type == 'category')
    {
      this.storeApi.CATEGORY_DETAILS({ category_id: x.category_id }).subscribe(result => {
        if(result.status) {
          let categoryDetails = result.data;
          if(categoryDetails.seo_status) this.router.navigate(['/category/'+categoryDetails.seo_details.page_url]);
          else this.router.navigate(['/category/'+categoryDetails._id]);
        }
        else console.log("response", result);
      });
    }
    else if(x.link_type == 'product')
    {
      this.storeApi.PRODUCT_DETAILS({ product_id: x.product_id }).subscribe(result => {
        if(result.status) {
          let productDetails = result.data;
          if(productDetails.seo_status) this.router.navigate(['/product/'+productDetails.seo_details.page_url]);
          else this.router.navigate(['/product/'+productDetails._id]);
        }
        else console.log("response", result);
      });
    }
    else if(x.link_type == 'internal') {
      this.router.navigate([x.link]);
    }
    else if(isPlatformBrowser(this.platformId) && x.link_type == 'external') {
      window.open(x.link, "_blank");
    }
  }

}