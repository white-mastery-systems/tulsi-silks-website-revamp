import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { StoreApiService } from '../../../services/store-api.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-sections',
    templateUrl: './sections.component.html',
    styleUrls: ['./sections.component.scss'],
    standalone: false
})

export class SectionsComponent implements OnInit {

  params: any;
  imgBaseUrl: string = environment.img_baseurl;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router, private activeRoute: ActivatedRoute, public commonService: CommonService, private storeApi: StoreApiService) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.params = params;
    });
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