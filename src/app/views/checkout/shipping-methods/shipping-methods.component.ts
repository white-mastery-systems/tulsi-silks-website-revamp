import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../services/api.service';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';

@Component({
    selector: 'app-shipping-methods',
    templateUrl: './shipping-methods.component.html',
    styleUrls: ['./shipping-methods.component.scss'],
    standalone: false
})
export class ShippingMethodsComponent implements OnInit {

  pageLoader: boolean;
  cart_weight: any = 0; cart_total: any = 0;
  list: any = []; shipping_address: any = {};
  checkout_details: any = {};
  template_setting: any = environment.template_setting;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
    private api: ApiService, private storeApi: StoreApiService, public commonService: CommonService,
    private router: Router, public cc: CurrencyConversionService
  ) { }

  ngOnInit(): void {
    if(this.commonService.ys_features.indexOf('time_based_delivery')==-1) {
      this.pageLoader = true;
      if(this.commonService.customer_token) {
        this.api.USER_DETAILS().subscribe(result => {
          if(result.status && result.data.checkout_details) {
            this.checkout_details = result.data.checkout_details;
            if(this.checkout_details.item_list && this.checkout_details.shipping_address) this.calcShippingPrice();
            else this.router.navigate(["/"]);
          }
          else {
            console.log("response", result);
            this.router.navigate(["/"]);
          }
        });
      }
      else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("checkout_details")) {
        this.checkout_details = this.commonService.decryptData(sessionStorage.getItem("checkout_details"));
        if(this.checkout_details.item_list && this.checkout_details.shipping_address) this.calcShippingPrice();
        else this.router.navigate(["/"]);
      }
      else this.router.navigate(["/"]);
    }
  }

  calcShippingPrice() {
    this.shipping_address = this.checkout_details.shipping_address;
    this.cart_total = this.totalCartAmount(this.checkout_details.item_list);
    this.calcCartWeight(this.checkout_details.item_list);
    // shipping methods
    this.storeApi.SHIPPING_METHODS().subscribe(result => {
      setTimeout(() => { this.pageLoader = false; }, 500);
      if(result.status) {
        if(this.shipping_address.country==this.commonService.store_details.country) {
          // Domestic
          let domesticList = result.list.filter(obj => obj.shipping_type=='Domestic');
          for(let data of domesticList)
          {
            let alertStatus: boolean = false;
            if(data.alert_status && data.free_shipping && data.minimum_price) alertStatus = true;
            // zone based
            if(data.domes_zone_status) {
              this.findDomesticPrice(data.domes_zones, this.shipping_address, this.cart_weight).then((respData: any) => {
                if(respData) {
                  if(data.free_shipping) {
                    if(this.cart_total >= data.minimum_price) respData.shipping_price = 0;
                  }
                  respData._id = data._id;
                  respData.name = data.name;
                  respData.tracking_link = data.tracking_link;
                  respData.temp_shipping_price = this.cc.CALC(respData.shipping_price);
                  if(alertStatus) respData.minimum_price = data.minimum_price;
                  this.list.push(respData);
                }
              });
            }
            // non-zone based
            else {
              if(data.free_shipping) {
                if(this.cart_total >= data.minimum_price) data.shipping_price = 0;
              }
              let shipData: any = {
                _id: data._id, name: data.name, tracking_link: data.tracking_link,
                shipping_price: data.shipping_price, delivery_time: data.delivery_time
              }
              if(alertStatus) shipData.minimum_price = data.minimum_price;
              shipData.temp_shipping_price = this.cc.CALC(shipData.shipping_price);
              this.list.push(shipData);
            }
          }
        }
        else {
          // International
          let internationalList = result.list.filter(obj => obj.shipping_type=='International');
          for(let data of internationalList)
          {
            let alertStatus: boolean = false;
            if(data.alert_status && data.free_shipping && data.minimum_price) alertStatus = true;
            // zone based
            if(data.inter_zone_status) {
              this.findInternatioanlPrice(data.inter_zones, this.shipping_address, this.cart_weight).then((respData: any) => {
                if(respData) {
                  if(data.free_shipping) {
                    if(this.cart_total >= data.minimum_price) respData.shipping_price = 0;
                  }
                  respData._id = data._id;
                  respData.name = data.name;
                  respData.tracking_link = data.tracking_link;
                  respData.temp_shipping_price = this.cc.CALC(respData.shipping_price);
                  if(alertStatus) respData.minimum_price = data.minimum_price;
                  this.list.push(respData);
                }
              });
            }
            // non-zone based
            else {
              if(data.free_shipping) {
                if(this.cart_total >= data.minimum_price) data.shipping_price = 0;
              }
              let shipData: any = {
                _id: data._id, name: data.name, tracking_link: data.tracking_link,
                shipping_price: data.shipping_price, delivery_time: data.delivery_time
              }
              if(alertStatus) shipData.minimum_price = data.minimum_price;
              shipData.temp_shipping_price = this.cc.CALC(shipData.shipping_price);
              this.list.push(shipData);
            }
          }
        }
      }
      else console.log("response", result);
    });
  }

  calcCartWeight(itemList) {
    let sum: any = 0;
    itemList.forEach(element => { sum += (parseFloat(element.weight)*parseFloat(element.quantity)); });
    sum = sum.toFixed(2);
    this.cart_weight = parseFloat(sum);
  }

  totalCartAmount(itemList) {
    let totalAmount = 0;
    if(itemList.length) {
      itemList.forEach((product) => {
        totalAmount += this.cc.CALC_INR_WITH_AC(product.final_price * product.quantity);
        if(product.unit!="Pcs") { totalAmount += this.cc.CALC_INR_WITH_AC(product.addon_price); }
      });
    }
    return totalAmount;
  }

  onSelect(x) {
    let sendData: any = {
      sid: this.commonService.session_id, store_id: this.commonService.store_id, shipping_address: this.checkout_details.shipping_address._id,
      order_type: this.checkout_details.order_type, currency_type: this.commonService.selected_currency.country_code, shipping_id: x._id
    };
    sendData.item_list = this.commonService.getItemList(this.checkout_details.item_list);
    if(this.checkout_details.quick_order_id) sendData.quick_order_id = this.checkout_details.quick_order_id;
    this.api.SHIPPING_DETAILS(sendData).subscribe(result => {
      if(result.status) {
        this.checkout_details.shipping_method = result.data.shipping_method;
        if(this.commonService.customer_token) {
          this.api.USER_UPDATE({ checkout_details: this.checkout_details }).subscribe(result => {
            if(result.status) this.router.navigate(["checkout/product-order-details"]);
            else {
              console.log("response", result);
              this.router.navigate(["/"]);
            }
          });
        }
        else {
          if(isPlatformBrowser(this.platformId)) sessionStorage.setItem("checkout_details", this.commonService.encryptData(this.checkout_details));
          this.router.navigate(["checkout/product-order-details"]);
        }
      }
      else {
        console.log("response", result);
        this.router.navigate(["/"]);
      }
    });
  }

  findInternatioanlPrice(zones, shippingAddress, cartWeight) {
    return new Promise((resolve, reject) => {
      // zone
      let filterZone = zones.filter(obj => obj.countries.findIndex(x => x == shippingAddress.country)!=-1);
      if(filterZone.length && filterZone[0].rate_multiplier.length) {
        // multiplier
        let rateMultiplier = filterZone[0].rate_multiplier;
        rateMultiplier.sort((a, b) => 0 - (a.weight > b.weight ? -1 : 1));  // sort asc
        let shippingMultiplier = rateMultiplier[rateMultiplier.length - 1].multiplier;
        let filterMultiplier = rateMultiplier.filter(obj => obj.weight>=cartWeight);
        if(filterMultiplier.length) shippingMultiplier = filterMultiplier[0].multiplier;
        // find price
        let zonePrice = Math.round(filterZone[0].price_per_kg*shippingMultiplier);
        resolve({ shipping_price: zonePrice, delivery_time: filterZone[0].delivery_time })
      }
      else {
        resolve(null);
      }
    });
  }

  findDomesticPrice(zones, shippingAddress, cartWeight) {
    return new Promise((resolve, reject) => {
      // zone
      let filterZone = zones.filter(obj => obj.states.findIndex(x => x == shippingAddress.state)!=-1);
      if(filterZone.length && filterZone[0].rate_multiplier.length) {
        // multiplier
        let rateMultiplier = filterZone[0].rate_multiplier;
        rateMultiplier.sort((a, b) => 0 - (a.weight > b.weight ? -1 : 1));  // sort asc
        let shippingMultiplier = rateMultiplier[rateMultiplier.length - 1].multiplier;
        let filterMultiplier = rateMultiplier.filter(obj => obj.weight>=cartWeight);
        if(filterMultiplier.length) shippingMultiplier = filterMultiplier[0].multiplier;
        // find price
        let zonePrice = Math.round(filterZone[0].price_per_kg*shippingMultiplier);
        resolve({ shipping_price: zonePrice, delivery_time: filterZone[0].delivery_time })
      }
      else {
        resolve(null);
      }
    });
  }

}