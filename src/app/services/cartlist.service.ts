import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';
import { CommonService } from './common.service';
import { CurrencyConversionService } from './currency-conversion.service';

@Injectable({
  providedIn: 'root'
})

export class CartlistService {

  cart_list: any = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private api: ApiService, private commonService: CommonService, private cc: CurrencyConversionService) {
    if(localStorage.getItem("customer_cartlist")) {
      this.cart_list = this.commonService.decryptData(localStorage.getItem("customer_cartlist"));
      this.findCurrency();
    }
  }

  addToCart(x) {
    if(!this.cart_list) this.cart_list = [];
    let productDetails: any = {};
    productDetails.category_id = x.category_id;
    productDetails.product_id = x.product_id;
    productDetails.sku = x.sku;
    productDetails.name = x.name;
    productDetails.weight = x.weight;
    productDetails.quantity = x.quantity+x.additional_qty;
    productDetails.additional_qty = x.additional_qty;
    productDetails.unit = x.unit;
    productDetails.stock = x.stock;
    productDetails.selling_price = x.selling_price;
    productDetails.disc_status = x.disc_status;
    productDetails.disc_percentage = x.disc_percentage;
    productDetails.discounted_price = x.discounted_price;
    productDetails.addon_price = x.addon_price;
    productDetails.final_price = x.final_price;
    productDetails.addon_status = x.external_addon_status;
    if(productDetails.addon_status) productDetails.selected_addon = x.selected_addon;
    productDetails.customization_status = x.customization_status;
    if(productDetails.customization_status) productDetails.customized_model = x.customized_model;
    productDetails.variant_status = x.variant_status;
    productDetails.variant_types = [];
    if(x.hsn_code) productDetails.hsn_code = x.hsn_code;
    if(x.vendor_id) productDetails.vendor_id = x.vendor_id;
    if(productDetails.variant_status) {
      x.variant_types.forEach(element => {
        productDetails.variant_types.push({ name: element.name, value: element.value });
      });
    }
    if(x.taxrate_id) productDetails.taxrate_id = x.taxrate_id;
    productDetails.seo_status = x.seo_status;
    productDetails.seo_details = x.seo_details;
    productDetails.image = x.image;
    productDetails.allow_cod = x.allow_cod;
    // check already exist in cart
    let cartIndex = this.checkProductExistInCart(this.cart_list, productDetails);
    // remove product, if already exist
    if(cartIndex != -1) this.cart_list.splice(cartIndex, 1);
    this.cart_list.push(productDetails);
    this.updateCartList(this.cart_list);
  }

  checkProductExistInCart(cartList, x) {
    return cartList.findIndex(obj => obj.product_id==x.product_id && JSON.stringify(obj.variant_types)==JSON.stringify(x.variant_types));
  }

  // this fn also call from cart page, so set cart_list again
  updateCartList(x) {
    this.cart_list = x;
    this.findCurrency();
    localStorage.setItem("customer_cartlist", this.commonService.encryptData(this.cart_list));
    if(this.commonService.customer_token) {
      this.api.USER_UPDATE({ cart_list: x, cart_updated_on: new Date(), cart_recovery: true }).subscribe(result => { });
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      this.api.GUEST_USER_UPDATE({ cart_list: x, cart_updated_on: new Date(), cart_recovery: true }).subscribe(result => { });
    }
  }

  // this fn call on login
  resetCartList(x) {
    this.cart_list = x;
    this.findCurrency();
    localStorage.setItem("customer_cartlist", this.commonService.encryptData(this.cart_list));
  }

  findCurrency() {
    if(this.cart_list && this.cart_list.length) {
      for(let product of this.cart_list) {
        product.temp_final_price = this.cc.CALC(product.final_price*product.quantity);
        if(product.unit!='Pcs') product.temp_final_price = this.cc.CALC((product.final_price*product.quantity)+product.addon_price);
      }
    }
  }

}
