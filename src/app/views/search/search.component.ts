import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';
import { environment } from './../../../environments/environment';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  afterSearchEvent: boolean;
  searchLoader: boolean;
  searchForm: any = {};
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  product_list: any = [];
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "Search", position: 2, link: "/search" }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private storeApi: StoreApiService,
    public commonService: CommonService, private router: Router, public location: Location
  ) {
    if(this.commonService.ys_features.indexOf('product_search')!=-1) {
      if(!this.commonService.search_category_list.length) {
        if(this.commonService.menu_list.length) {
          this.createSearchCategoryList();
        }
        else {
          this.storeApi.STORE_DETAILS().subscribe(result => {
            if(result.status) {
              let storeDetails = JSON.parse(result.store_details);
              this.commonService.menu_list = storeDetails.menu_list;
              this.createSearchCategoryList();
            }
          });
        }
      }
    }
    else this.router.navigate(['/']);
  }

  ngOnInit(): void {
    this.afterSearchEvent = false; this.searchLoader = false;
    if(this.commonService.search_page_attr.search_form) {
      this.afterSearchEvent = true;
      this.searchForm = this.commonService.search_page_attr.search_form;
      this.product_list = this.commonService.search_page_attr.product_list;
      let scrollPos = this.commonService.search_page_attr.scroll_y_pos;
      setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
      this.commonService.search_page_attr = {};
    }
    else this.searchForm = { category_id: '' };
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

  onSubmit() {
    this.afterSearchEvent = true; this.searchLoader = true;
    this.storeApi.SEARCH_PRODUCT(this.searchForm).subscribe(result => {
      setTimeout(() => { this.searchLoader = false; }, 500);
      if(result.status) {
        this.product_list = result.list;
        this.product_list.forEach(obj => {
          if(obj.hold_till) {
            let balanceStock = obj.stock;
            if(new Date() < new Date(obj.hold_till)) balanceStock = obj.stock - obj.hold_qty;
            obj.stock = balanceStock;
          }
        });
      }
      else console.log("response", result);
    });
  }
  
  createSearchCategoryList() {
    if(isPlatformBrowser(this.platformId)) {
      let menuList = this.commonService.menu_list.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
      const worker = new Worker(new URL('../../web-worker/app.worker', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        this.commonService.search_category_list = JSON.parse(data).reverse();
      };
      worker.postMessage({ type: 'search', list: menuList });
    }
  }
  
  onSelectProduct(x) {
    this.commonService.selected_product = x;
    this.commonService.search_page_attr = {
      search_form: this.searchForm, product_list: this.product_list, scroll_y_pos: this.commonService.scroll_y_pos
    }
  }

}