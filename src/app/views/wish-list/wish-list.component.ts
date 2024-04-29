import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../services/wishlist.service';
import { environment } from './../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { CommonService } from '../../services/common.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';

@Component({
  selector: 'app-wish-list',
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.scss']
})

export class WishListComponent implements OnInit {

  pageLoader: boolean; list: any = [];
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  subscription: Subscription;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "My Wishlist", position: 2, link: "/wishlist" }
  ];

  constructor(
    private wishService: WishlistService, public cc: CurrencyConversionService,
    private api: ApiService, public commonService: CommonService
  ) {
    this.subscription = this.commonService.currency_type.subscribe(currency => {
      this.findCurrency();
    });
  }

  ngOnInit(): void {
    if(localStorage.getItem('customer_token')) {
      this.pageLoader = true;
      this.api.UPDATE_WISHLIST().subscribe(result => {
        if(result.status) {
          this.wishService.updateWishList(result.data.wish_list);
          this.list = this.wishService.wish_list;
          this.findCurrency();
        }
        else console.log("response", result);
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    }
    // seo
    let seoDetails = {
      h1_tag: "List of my favourites",
      page_title: "Tulsi Silks - My Wishlist",
      meta_desc: "Create a list of your favourite products so you can shop it later.",
      meta_keywords: []
    };
    this.commonService.setSiteMetaData(seoDetails, null);
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

  findCurrency() {
    for(let product of this.list) {
      product.temp_selling_price = this.cc.CALC(product.selling_price);
      product.temp_discounted_price = this.cc.CALC(product.discounted_price);
    }
  }

  removeFromWishList(index) {
    this.list.splice(index, 1);
    this.wishService.updateWishList(this.list);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}