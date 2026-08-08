import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})

export class ApiService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) { }

  WHATSAPP_VALIDATE_CART_TOKEN(token) { return this.http.get<any>(environment.ws_url+'/whatsapp/validate-cart-token?token='+token); }

  REGISTER(x) { return this.http.post<any>(environment.ws_url+'/auth/user/register', x); }
  LOGIN(x) { return this.http.post<any>(environment.ws_url+'/auth/user/login', x); }
  SOCIAL_LOGIN(x) { return this.http.post<any>(environment.ws_url+'/auth/user/social_login', x); }
  FORGOT_REQUEST(x) { return this.http.post<any>(environment.ws_url+'/auth/user/forgot_request', x); }
  VALIDATE_FORGOT_REQUEST(x) { return this.http.post<any>(environment.ws_url+'/auth/user/validate_forgot_request', x); }
  UPDATE_PWD(x) { return this.http.post<any>(environment.ws_url+'/auth/user/update_pwd', x); }
  GUEST_LOGIN(x) { return this.http.post<any>(environment.ws_url+'/auth/user/guest_login', x); }

  CHANGE_PWD(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.put<any>(environment.ws_url+'/user/change_pwd', x, httpOptions);
  }
  USER_DETAILS() {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/customer', httpOptions);
  }
  USER_UPDATE(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.put<any>(environment.ws_url+'/user/customer', x, httpOptions);
  }
  UPDATE_USER_MOBILE(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.post<any>(environment.ws_url+'/user/update_mobile', x, httpOptions);
  }
  UPDATE_WISHLIST() {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/update_wish_list', httpOptions);
  }

  // guest user
  GUEST_USER_UPDATE(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
    return this.http.put<any>(environment.ws_url+'/guest_user/details', x, httpOptions);
  }

  // Address list
  ADD_ADDRESS(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.post<any>(environment.ws_url+'/user/address', x, httpOptions);
  }
  UPDATE_ADDRESS(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.put<any>(environment.ws_url+'/user/address', x, httpOptions);
  }
  DELETE_ADDRESS(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.patch<any>(environment.ws_url+'/user/address', x, httpOptions);
  }

  // Model
  ADD_MODEL(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.post<any>(environment.ws_url+'/user/model', x, httpOptions);
  }
  UPDATE_MODEL(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.put<any>(environment.ws_url+'/user/model', x, httpOptions);
  }
  DELETE_MODEL(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.patch<any>(environment.ws_url+'/user/model', x, httpOptions);
  }

  // feedback
  GET_FEEDBACK() {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/feedback', httpOptions);
  }
  FEEDBACK(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.post<any>(environment.ws_url+'/user/feedback', x, httpOptions);
  }

  // giftcard and offer coupon
  BUY_COUPON(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.post<any>(environment.ws_url+'/user/buy_coupon', x, httpOptions);
  }
  COUPON_LIST() {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/coupon', httpOptions);
  }
  COUPON_DETAILS(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/coupon?coupon_id='+x, httpOptions);
  }
  VALIDATE_OFFER_CODE(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.post<any>(environment.ws_url+'/user/validate_offercoupon', x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.post<any>(environment.ws_url+'/guest_user/validate_offercoupon', x, httpOptions);
    }
    else return null;
  }

  // appointment
  CREATE_APPOINTMENT(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.post<any>(environment.ws_url+'/user/appointment', x, httpOptions);
  }
  APPOINTMENT_LIST() {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/appointment', httpOptions);
  }
  APPOINTMENT_DETAILS(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/appointment?id='+x, httpOptions);
  }

  // COD OTP
  SEND_COD_OTP(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.post<any>(environment.ws_url+'/user/order/cod_otp', x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.post<any>(environment.ws_url+'/guest_user/order/cod_otp', x, httpOptions);
    }
    else return null;
  }
  VALIDATE_COD_OTP(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.get<any>(environment.ws_url+'/user/order/cod_otp?otp='+x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.get<any>(environment.ws_url+'/guest_user/order/cod_otp?otp='+x, httpOptions);
    }
    else return null;
  }

  // product
  PICKUP_DETAILS(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.post<any>(environment.ws_url+'/user/order/pickup_details', x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.post<any>(environment.ws_url+'/guest_user/order/pickup_details', x, httpOptions);
    }
    else return null;
  }
  DELIVERY_DETAILS(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.post<any>(environment.ws_url+'/user/order/delivery_details', x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.post<any>(environment.ws_url+'/guest_user/order/delivery_details', x, httpOptions);
    }
    else return null;
  }
  SHIPPING_DETAILS(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.post<any>(environment.ws_url+'/user/order/shipping_details', x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.post<any>(environment.ws_url+'/guest_user/order/shipping_details', x, httpOptions);
    }
    else return null;
  }
  CHECKOUT_DETAILS(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.get<any>(environment.ws_url+'/user/order/checkout_details?sid='+x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.get<any>(environment.ws_url+'/guest_user/order/checkout_details?sid='+x, httpOptions);
    }
    else return null;
  }
  CALC_ORDER_DISCOUNT(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.post<any>(environment.ws_url+'/user/order/calc_discount', x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.post<any>(environment.ws_url+'/guest_user/order/calc_discount', x, httpOptions);
    }
    else return null;
  }
  CREATE_ORDER(x) {
    if(localStorage.getItem('customer_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
      return this.http.post<any>(environment.ws_url+'/user/order/create_v2', x, httpOptions);
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('guest_token')) {
      let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+sessionStorage.getItem('guest_token') }) };
      return this.http.post<any>(environment.ws_url+'/guest_user/order/create_v2', x, httpOptions);
    }
    else return null;
  }
  UPDATE_ORDER_PAYMENT(storeId, x) { return this.http.post<any>(environment.ws_url+'/store_details/update_order_payment?store_id='+storeId, x); }
  ORDER_LIST(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/order/list?type='+x, httpOptions);
  }
  ORDER_DETAILS(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/order/details?order_id='+x, httpOptions);
  }
  CANCEL_ORDER(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.patch<any>(environment.ws_url+'/user/order/details', x, httpOptions);
  }

  // donation
  MAKE_DONATION(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.post<any>(environment.ws_url+'/user/donation', x, httpOptions);
  }
  DONATION_DETAILS(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/donation?order_id='+x, httpOptions);
  }

  // CCAvenue encryption
  GET_ENCRYPTED_DATA(storeId, userEmail, orderAmount, orderDetails, orderType) {
    if(!orderDetails.billing_address) orderDetails.billing_address = {};
    let order_number = orderDetails.order_number,
    currency = orderDetails.currency_type.country_code,
    amount = orderAmount,

    billing_email = userEmail,
    billing_name = orderDetails.billing_address.name ? orderDetails.billing_address.name : '',
    billing_address = orderDetails.billing_address.address ? orderDetails.billing_address.address : '',
    billing_city = orderDetails.billing_address.city ? orderDetails.billing_address.city : '',
    billing_state = orderDetails.billing_address.state ? orderDetails.billing_address.state : '',
    billing_zip = orderDetails.billing_address.pincode ? orderDetails.billing_address.pincode : '',
    billing_country = orderDetails.billing_address.country ? orderDetails.billing_address.country : '',
    billing_tel = orderDetails.billing_address.mobile ? orderDetails.billing_address.mobile : '',
    
    delivery_name = orderDetails.shipping_address.name ? orderDetails.shipping_address.name : '',
    delivery_address = orderDetails.shipping_address.address ? orderDetails.shipping_address.address : '',
    delivery_city = orderDetails.shipping_address.city ? orderDetails.shipping_address.city : '',
    delivery_state = orderDetails.shipping_address.state ? orderDetails.shipping_address.state : '',
    delivery_zip = orderDetails.shipping_address.pincode ? orderDetails.shipping_address.pincode : '',
    delivery_country = orderDetails.shipping_address.country ? orderDetails.shipping_address.country : '',

    // orderType => product, giftcard
    merchant_param1 = orderType,  
    merchant_param2 = orderDetails._id

    let parameters =
    `store_id=${storeId}&order_id=${order_number}&currency=${currency}&amount=${amount}&billing_name=${billing_name}&billing_address=${billing_address}
    &billing_city=${billing_city}&billing_state=${billing_state}&billing_zip=${billing_zip}&billing_country=${billing_country}&billing_tel=${billing_tel}
    &billing_email=${billing_email}&delivery_name=${delivery_name}&delivery_address=${delivery_address}&delivery_city=${delivery_city}
    &delivery_state=${delivery_state}&delivery_zip=${delivery_zip}&delivery_country=${delivery_country}&merchant_param1=${merchant_param1}
    &merchant_param2=${merchant_param2}&redirect_url=${environment.ccavenue_redirect_url+storeId}&cancel_url=${environment.ccavenue_cancel_url+storeId}`;

    return this.http.get<any>(environment.ws_url+'/store_details/ccavenue_encryption?'+parameters);
  }

}