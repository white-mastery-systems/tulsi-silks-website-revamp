import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { StoreApiService } from '../../../services/store-api.service';
import { CartlistService } from '../../../services/cartlist.service';
import { CommonService } from '../../../services/common.service';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';
import { environment } from '../../../../environments/environment';
declare const fbq: Function;
declare var gtag;

@Component({
    selector: 'app-order-summary',
    templateUrl: './order-summary.component.html',
    styleUrls: ['./order-summary.component.scss'],
    standalone: false
})

export class OrderSummaryComponent implements OnInit {

  pageLoader: boolean;
  params: any = {};
  order_details: any = {};
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private activeRoute: ActivatedRoute, private api: ApiService, private storeApi: StoreApiService,
    private router: Router, private cartService: CartlistService, public commonService: CommonService, public cc: CurrencyConversionService
  ) {
    this.commonService.loadGoogleAnalytics("UA-102000599-1, AW-847341911", 0);
  }

  ngOnInit(): void {
    // query parameter
    this.activeRoute.queryParams.subscribe((params: Params) => {
      this.params = params;
      if(this.params.type) this.getOrderDetails();
      else {
        // parameter
        this.activeRoute.params.subscribe((params: Params) => {
          this.params = params;
          if(this.params.type) this.getOrderDetails();
        });
      }
    });
  }

  getOrderDetails() {
    this.pageLoader = true; 
    if(this.params.type=="product") {
      // guest logout
      if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("guest_email")) {
        delete this.commonService.guest_token;
        delete this.commonService.guest_email;
        sessionStorage.removeItem("guest_email");
        sessionStorage.removeItem("guest_token");
        sessionStorage.removeItem("checkout_address");
        sessionStorage.removeItem("checkout_details");
        this.cartService.resetCartList([]);
      }
      this.storeApi.STORE_ORDER_DETAILS(this.params.order_id).subscribe(result => {
        setTimeout(() => { this.pageLoader = false; }, 500);
        if(result.status) {
          this.order_details = result.data;
          this.order_details.base_final_price = this.order_details.final_price;
          this.order_details.base_shipping_cost = this.order_details.shipping_cost;
          let countryInr = this.order_details.currency_type.country_inr_value;
          this.order_details.sub_total = (this.order_details.sub_total/countryInr).toFixed(2);
          this.order_details.gift_wrapper = (this.order_details.gift_wrapper/countryInr).toFixed(2);
          this.order_details.packaging_charges = (this.order_details.packaging_charges/countryInr).toFixed(2);
          this.order_details.shipping_cost = (this.order_details.shipping_cost/countryInr).toFixed(2);
          this.order_details.cod_charges = (this.order_details.cod_charges/countryInr).toFixed(2);
          this.order_details.discount_amount = (this.order_details.discount_amount/countryInr).toFixed(2);
          this.order_details.final_price = (this.order_details.final_price/countryInr).toFixed(2);
          for(let product of this.order_details.item_list) {
            product.base_final_price = product.final_price*product.quantity;
            if(product.unit!='Pcs') product.base_final_price += product.addon_price;
            product.final_price = (product.base_final_price/countryInr).toFixed(2);
          }
          // tracking
          if(isPlatformBrowser(this.platformId)) {
            // gtag
            if(environment.gtag_tracking || environment.gtag_conversion_id) {
              let gtagData: any = {
                transaction_id: this.order_details.order_number, affiliation: this.commonService.store_details.name,
                value: (this.order_details.base_final_price-this.order_details.base_shipping_cost), currency: this.commonService.store_details.currency,
                tax: 0, shipping: this.order_details.base_shipping_cost
              };
              gtagData.items = this.filterProductDetails(this.order_details.item_list);
              let gawData: any = {
                send_to: environment.gtag_conversion_id, transaction_id: this.order_details.order_number,
                value: this.order_details.base_final_price, currency: this.commonService.store_details.currency
              }
              if(localStorage.getItem("gtag_orders")) {
                let gtagOrderList = this.commonService.decryptData(localStorage.getItem("gtag_orders"));
                if(!gtagOrderList.includes(this.params.order_id)) {
                  gtagOrderList.push(this.params.order_id);
                  localStorage.setItem("gtag_orders", this.commonService.encryptData(gtagOrderList));
                  if(environment.gtag_conversion_id) gtag('event', 'conversion', gawData);
                  if(environment.gtag_tracking) gtag('event', 'purchase', gtagData);
                }
              }
              else {
                localStorage.setItem("gtag_orders", this.commonService.encryptData([this.params.order_id]));
                if(environment.gtag_conversion_id) gtag('event', 'conversion', gawData);
                if(environment.gtag_tracking) gtag('event', 'purchase', gtagData);
              }
            }
            // fb pixel
            if(environment.facebook_pixel) {
              let fbData: any = { value: this.order_details.base_final_price, currency: this.commonService.store_details.currency };
              if(localStorage.getItem("fbpixel_orders")) {
                let fbOrderList = this.commonService.decryptData(localStorage.getItem("fbpixel_orders"));
                if(!fbOrderList.includes(this.params.order_id)) {
                  fbOrderList.push(this.params.order_id);
                  localStorage.setItem("fbpixel_orders", this.commonService.encryptData(fbOrderList));
                  fbq('track', 'Purchase', fbData);
                }
              }
              else {
                localStorage.setItem("fbpixel_orders", this.commonService.encryptData([this.params.order_id]));
                fbq('track', 'Purchase', fbData);
              }
            }
          }
        }
        else {
          console.log("response", result);
          this.router.navigate(["/"]);
        }
      });
      // update cart list
      if(localStorage.getItem('customer_token')) {
        this.api.USER_DETAILS().subscribe(result => {
          if(result.status) this.cartService.resetCartList(result.data.cart_list);
          else this.cartService.resetCartList([]);
        });
      }
    }
    else if(this.params.type=="giftcard") {
      // order details
      if(localStorage.getItem('customer_token')) {
        this.api.COUPON_DETAILS(this.params.order_id).subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) {
            this.order_details = result.data;
            this.order_details.price = (this.order_details.price/this.order_details.currency_type.country_inr_value).toFixed(2);
          }
          else {
            console.log("response", result);
            this.router.navigate(["/"]);
          }
        });
      }
    }
    else if(this.params.type=="donation") {
      // order details
      if(localStorage.getItem('customer_token')) {
        this.api.DONATION_DETAILS(this.params.order_id).subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) this.order_details = result.data;
          else {
            console.log("response", result);
            this.router.navigate(["/"]);
          }
        });
      }
    }
    else {
      console.log("Invalid order type");
      this.router.navigate(["/"]);
    }
  }

  filterProductDetails(list) {
    let proList = [];
    list.forEach((element, index) => {
      proList.push({
        "id": element.sku, "name": element.name, "brand": this.commonService.store_details.name,
        "category": 'product', "list_position": index+1,
        "quantity": element.quantity, "price": element.base_final_price
      });
    });
    return proList;
  }

}