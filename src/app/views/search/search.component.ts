import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';
import { environment } from './../../../environments/environment';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    standalone: false
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
  productCount: number = 0;
  loading: boolean; hasMore: boolean;
  observer!: IntersectionObserver;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private storeApi: StoreApiService,
    public commonService: CommonService, private router: Router, public location: Location,
    private activeRoute: ActivatedRoute
  ) {
    if(this.commonService.ys_features.indexOf('product_search')!=-1) {
      if(!this.commonService.search_category_list.length) {
        if(this.commonService.menu_list.length) {
          this.createSearchCategoryList();
        }
        else {
          this.storeApi.STORE_DETAILS().subscribe(result => {
            if(result.status) {
              let storeDetails = result.store_details;
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
    this.activeRoute.queryParams.subscribe((params: Params) => {
      this.afterSearchEvent = false; this.searchLoader = false; this.hasMore = false;
      if(this.commonService.search_page_attr.search_form) {
        this.afterSearchEvent = true;
        this.searchForm = this.commonService.search_page_attr.search_form;
        this.product_list = this.commonService.search_page_attr.product_list;
        this.productCount = this.commonService.search_page_attr.product_count;
        let scrollPos = this.commonService.search_page_attr.scroll_y_pos;
        setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
        this.commonService.search_page_attr = {};
        if(this.productCount > this.product_list.length) this.hasMore = true;
        this.loadMoreIntersect();
      }
      else {
        this.searchForm = { category_id: '', name: params['q'] };
        this.onSearch();
      }
      // schema
      this.commonService.breadCrumbList(this.bcList);
    });
  }
  
  onSearch() {
    if(this.searchForm?.name?.length >= 3) {
      this.afterSearchEvent = true; this.searchLoader = true;
      this.searchForm.skip = 0; this.searchForm.limit = 10;
      this.storeApi.SEARCH_PRODUCT(this.searchForm).subscribe(result => {
        setTimeout(() => { this.searchLoader = false; }, 500);
        if(result.status) {
          this.productCount = result.count;
          this.product_list = result.list;
          this.product_list.forEach(obj => {
            if(obj.hold_till) {
              let balanceStock = obj.stock;
              if(new Date() < new Date(obj.hold_till)) balanceStock = obj.stock - obj.hold_qty;
              obj.stock = balanceStock;
            }
          });
          if(this.productCount > this.product_list.length) this.hasMore = true;
          this.loadMoreIntersect();
        }
        else console.log("response", result);
      });
    }
  }

  loadMoreIntersect() {
    if(isPlatformBrowser(this.platformId)) {
      // Delay ensures DOM is rendered
      setTimeout(() => {
        const loadMoreEl = document.getElementById('load-more');
        if(!loadMoreEl) {
          console.error('load-more element not found');
          return;
        }
        this.observer = new IntersectionObserver(entries => {
          if(entries[0].isIntersecting && !this.loading && this.hasMore) this.loadMoreItems();
        });
        this.observer.observe(loadMoreEl);
      }, 500);
    }
  }

  loadMoreItems() {
    this.loading = true; this.hasMore = false;
    this.searchForm.skip = this.product_list.length;
    this.searchForm.limit = 10;
    this.storeApi.SEARCH_PRODUCT(this.searchForm).subscribe(result => {
      setTimeout(() => { this.loading = false; }, 500);
      if(result.status) {
        result.list.forEach(obj => {
          if(obj.hold_till) {
            let balanceStock = obj.stock;
            if(new Date() < new Date(obj.hold_till)) balanceStock = obj.stock - obj.hold_qty;
            obj.stock = balanceStock;
          }
          this.product_list.push(obj);
        });
        if(this.productCount > this.product_list.length) this.hasMore = true;
      }
      else console.log("response", result);
    });
  }

  onSubmit() {
    if(this.searchForm?.name?.length >= 3) {
      this.router.navigate(
        ['/search'],
        { queryParams: { q: this.searchForm.name } }
      );
    }
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
      search_form: this.searchForm, product_list: this.product_list,
      scroll_y_pos: this.commonService.scroll_y_pos, product_count: this.productCount
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

}