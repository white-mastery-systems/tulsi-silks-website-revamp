import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../../services/common.service';
import { StoreApiService } from '../../../services/store-api.service';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';

@Component({
  selector: 'app-gift-cards',
  templateUrl: './gift-cards.component.html',
  styleUrls: ['./gift-cards.component.scss']
})

export class GiftCardsComponent implements OnInit {

  list: any = [];
  pageLoader: boolean;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  subscription: Subscription;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "Gift Cards", position: 2, link: "/gift-cards" }
  ];

  constructor(
    private router: Router, private storeApi: StoreApiService,
    public cc: CurrencyConversionService, public commonService: CommonService
  ) {
    this.subscription = this.commonService.currency_type.subscribe(currency => {
      this.findCurrency();
    });
  }

  ngOnInit(): void {
    if(this.commonService.ys_features.indexOf('giftcard')!=-1) {
      if(Object.entries(this.commonService.giftcard_page_attr).length) {
        this.list = this.commonService.giftcard_page_attr.list;
        this.findCurrency();
        let scrollPos = this.commonService.giftcard_page_attr.scroll_y_pos;
        setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
        this.commonService.giftcard_page_attr.scroll_y_pos = 0;
      }
      else {
        this.pageLoader = true;
        this.storeApi.GIFT_CARDS().subscribe(result => {
          if(result.status) {
            this.list = result.list;
            this.findCurrency();
          }
          else console.log("response", result);
          setTimeout(() => { this.pageLoader = false; }, 500);
        });
      }
    }
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

  findCurrency() {
    for(let card of this.list) {
      card.temp_price = this.cc.CALC_ROUND_WO_AC(card.price);
    }
  }

  onSelect(x) {
    if(this.commonService.customer_token) {
      this.commonService.giftcard_page_attr = { list: this.list, scroll_y_pos: this.commonService.scroll_y_pos };
      this.router.navigate(["/gift-cards/"+x.page_url]);
    }
    else {
      this.commonService.after_login_event = { redirect: "/gift-cards/"+x.page_url };
      this.router.navigate(["/account"]);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}