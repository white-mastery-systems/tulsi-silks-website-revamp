import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class StoreApiService {

  store_id: string = environment.store_id;

  constructor(private http: HttpClient) { }

  IP_INFO(url) { return this.http.get<any>(url); }
  STORE_DETAILS() { return this.http.get<any>(environment.ws_url+'/store_details/details_v3?store_id='+this.store_id); }
  
  LAYOUT_LIST() { return this.http.get<any>(environment.ws_url+'/store_details/layouts?store_id='+this.store_id); }
  HOME_PAGE_BLOG_LIST(limit) { return this.http.get<any>(environment.ws_url+'/store_details/blogs?limit='+limit+'&store_id='+this.store_id); }
  INSTAGRAM(x) { return this.http.get<any>('https://graph.instagram.com/me/media?limit=15&fields=id,caption,media_url,media_type,permalink,thumbnail_url,timestamp&access_token='+x); }

  AI_STYLES() { return this.http.get<any>(environment.ws_url+'/store_details/ai_styles?store_id='+this.store_id); }
  AI_STYLES_FILTER(x) { return this.http.post<any>(environment.ws_url+'/store_details/product/ai_styles_filter_v2?store_id='+this.store_id, x); }
  SIZING_ASSISTANT(x) { return this.http.post<any>(environment.ws_url+'/store_details/sizing_assistant?store_id='+this.store_id, x); }

  SEARCH_PRODUCT(x) { return this.http.post<any>(environment.ws_url+'/store_details/product/search?store_id='+this.store_id, x); }
  COUNTRY_LIST() { return this.http.get<any>(environment.ws_url+'/store_details/country_list'); }
  PRODUCT_TAGS() { return this.http.get<any>(environment.ws_url+'/store_details/product_features/'+this.store_id+'?type=tags'); }
  TAX_RATES() { return this.http.get<any>(environment.ws_url+'/store_details/product_features/'+this.store_id+'?type=tax_rates'); }
  PRODUCT_FEATURES() { return this.http.get<any>(environment.ws_url+'/store_details/product_features/'+this.store_id); }
  VENDOR_FEATURES(vendorId) { return this.http.get<any>(environment.ws_url+'/store_details/vendor_features/'+this.store_id+'/'+vendorId); }
  CATEGORY_DETAILS(x) { return this.http.post<any>(environment.ws_url+'/store_details/category/details/v2?store_id='+this.store_id, x); }

  PRODUCT_LIST(x) { return this.http.post<any>(environment.ws_url+'/store_details/product/list/v2?store_id='+this.store_id, x); }
  FILTERED_PRODUCT_LIST(x) { return this.http.post<any>(environment.ws_url+'/store_details/product/filter?store_id='+this.store_id, x); }
  RANDOM_PRODUCT_LIST(x) { return this.http.post<any>(environment.ws_url+'/store_details/product/random_list?store_id='+this.store_id, x); }
  FOOTER_SEO_LINKS() { return this.http.get<any>(environment.ws_url+'/store_details/footer_seo_links?store_id='+this.store_id); }
  
  PRODUCT_DETAILS(x) { return this.http.post<any>(environment.ws_url+'/store_details/product/details?store_id='+this.store_id, x); }
  ADDON_DETAILS(x) { return this.http.get<any>(environment.ws_url+'/store_details/product/addon_details?store_id='+this.store_id+'&addon_id='+x); }
  
  SHIPPING_METHODS() { return this.http.get<any>(environment.ws_url+'/store_details/shipping_methods?store_id='+this.store_id); }
  DELIVERY_METHODS() { return this.http.get<any>(environment.ws_url+'/store_details/delivery_methods?store_id='+this.store_id); }
  QUICK_ORDER_DETAILS(x) { return this.http.post<any>(environment.ws_url+'/store_details/quick_order_details', x); }
  
  GIFT_CARDS() { return this.http.get<any>(environment.ws_url+'/store_details/gift_cards?store_id='+this.store_id); }
  GIFT_CARD_DETAILS(x) { return this.http.get<any>(environment.ws_url+'/store_details/gift_cards?store_id='+this.store_id+'&gc_id='+x); }
  DISCOUNTS() { return this.http.get<any>(environment.ws_url+'/store_details/discounts?store_id='+this.store_id); }
  COLLECTIONS() { return this.http.get<any>(environment.ws_url+'/store_details/collections?store_id='+this.store_id); }
  
  BLOG_LIST(skip, limit) { return this.http.get<any>(environment.ws_url+'/store_details/blogs/v1?store_id='+this.store_id+'&skip='+skip+'&limit='+limit); }
  BLOG_DETAILS(x) { return this.http.get<any>(environment.ws_url+'/store_details/blogs/v1?store_id='+this.store_id+'&id='+x); }

  STORE_ORDER_DETAILS(x) { return this.http.get<any>(environment.ws_url+'/store_details/order_details?store_id='+this.store_id+'&id='+x); }

  APPOINTMENT_LIST(x) { return this.http.post<any>(environment.ws_url+'/store_details/appointments', x); }
  APPOINTMENT_CATEGORIES() { return this.http.get<any>(environment.ws_url+'/store_details/appointment_services?store_id='+this.store_id); }
  APPOINTMENT_SERVICES(x) { return this.http.get<any>(environment.ws_url+'/store_details/appointment_services?store_id='+this.store_id+'&category='+x); }
  APPOINTMENT_SERVICE_DETAILS(x) { return this.http.get<any>(environment.ws_url+'/store_details/appointment_services?store_id='+this.store_id+'&id='+x); }

  // Reviews
  REVIEWS(x) { return this.http.get<any>(environment.ws_url+'/store_details/reviews?store_id='+this.store_id+'&product_id='+x); }
  ADD_REVIEW(x) { return this.http.post<any>(environment.ws_url+'/store_details/reviews', x); }

  UPDATE_CARTLIST(x) { return this.http.post<any>(environment.ws_url+'/store_details/update_cart_list', x); }
  CHECK_STOCK_AVAILABILITY(x) { return this.http.post<any>(environment.ws_url+'/store_details/check_stock_availabilty', x); }
  VALIDATE_COUPONS(x) { return this.http.post<any>(environment.ws_url+'/store_details/validate_coupons', x); }
  VALIDATE_STORE_OFFER_CODE(x) { return this.http.post<any>(environment.ws_url+'/store_details/validate_offer_code', x); }

  CONTACT_US(x) { return this.http.post<any>(environment.ws_url+'/store_details/enquiry_mail', x); }
  VENDOR_ENQUIRY(x) { return this.http.post<any>(environment.ws_url+'/store_details/vendor_enquiry_mail', x); }
  VENDOR_REGISTER(x) { return this.http.post<any>(environment.ws_url+'/others/vendor', x); }
  SUBSCRIBE_NEWSLETTER(x) { return this.http.post<any>(environment.ws_url+'/store_details/subscribe_newsletter', x); }

  POLICY_DETAILS(x) { return this.http.get<any>(environment.ws_url+'/store_details/policy?store_id='+this.store_id+'&type='+x); }
  CONTACT_PAGE_INFO() { return this.http.get<any>(environment.ws_url+'/store_details/contact_page?store_id='+this.store_id); }
  LOCATIONS() { return this.http.get<any>(environment.ws_url+'/store_details/locations?store_id='+this.store_id); }
  EXTRA_PAGE(x) { return this.http.get<any>(environment.ws_url+'/store_details/extra_page?store_id='+this.store_id+'&type='+x); }

  DONATION_AMOUNT(x) { return this.http.get<any>(environment.ws_url+'/store_details/donation_amount?store_id='+this.store_id+'&country_code='+x); }

  // Invoice
  INVOICE_ORDER_DETAILS(params) {
    let reqUrl = environment.ws_url+'/others/order_details/'+params.type+'/'+this.store_id+'/'+params.order_id;
    if(params.vendor_id) reqUrl = reqUrl+'?vendor_id='+params.vendor_id;
    return this.http.get<any>(reqUrl);
  }

  // square payment
  SQUARE_PAYMENT(x) { return this.http.post<any>(environment.ws_url+'/store_details/square_payment/'+this.store_id, x); }

  // fatoorah payment
  FATOORAH_INITIATE_PAY(x) { return this.http.post<any>(environment.ws_url+'/store_details/fatoorah_initiate_pay/'+this.store_id, x); }
  
  PRODUCT_ENQUIRY(x) { return this.http.post<any>(environment.ws_url + '/store_details/product_enquiry', x); }

}