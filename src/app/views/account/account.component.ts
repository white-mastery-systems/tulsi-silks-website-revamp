import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from './../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { CommonService } from '../../services/common.service';
import { WishlistService } from '../../services/wishlist.service';
import { CartlistService } from '../../services/cartlist.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})

export class AccountComponent implements OnInit {
  
  pageLoader: boolean; formType: string;
  registerForm: any = {}; loginForm: any = {}; forgotForm: any = {};
  template_setting: any = environment.template_setting;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "My Account", position: 2, link: "/account" }
  ];
  seoDetails: any = {
    h1_tag: "My Account | Tulsi Silks",
    page_title: "Tulsi Silks - My Account",
    meta_desc: "Manage your account, check orders, and view your order history with Tulsi Silks.",
    meta_keywords: []
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient, private router: Router,
    private api: ApiService, private activeRoute: ActivatedRoute, private wishService: WishlistService,
    private cartService: CartlistService, public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((params: Params) => {
      if(isPlatformBrowser(this.platformId) && sessionStorage.getItem('account_type')) {
        this.formType = sessionStorage.getItem('account_type');
        sessionStorage.removeItem('account_type');
      }
      else this.formType = "signup";
      let routeUrl = this.router.url;
      if(Object.entries(params).length) {
        if(params['access_token']) {
          this.pageLoader = true;
          if(routeUrl.includes("facebook")) this.facebookOauth(params['access_token']);
          else if(routeUrl.includes("google")) this.googleOauth(params['access_token']);
          else setTimeout(() => { this.pageLoader = false; }, 500);
        }
        else this.router.navigateByUrl('/account');
      }
      else {
        if(routeUrl.includes("#access_token=")) {
          this.pageLoader = true;
          let updatedRouteUrl = routeUrl.replace("#access_token=", "?access_token=");
          this.router.navigateByUrl(updatedRouteUrl);
        }
        else setTimeout(() => { this.pageLoader = false; }, 500);
      }
      this.commonService.setSiteMetaData(this.seoDetails, null);
      // schema
      this.commonService.breadCrumbList(this.bcList);
    });
  }

  onRegister() {
    this.registerForm.submit = true;
    this.registerForm.cart_list = [];
    if(this.cartService.cart_list) this.registerForm.cart_list = this.cartService.cart_list;
    this.registerForm.store_id = this.commonService.store_id;
    this.api.REGISTER(this.registerForm).subscribe(result => {
      this.registerForm.submit = false;
      if(result.status) {
        this.captureCustomerData(result);
        this.afterLoginEvent(this.commonService.after_login_event);
      }
      else {
        this.registerForm.errorMsg = result.message;
        console.log("response", result);
      }
    });
  }

  onLogin() {
    this.loginForm.submit = true;
    this.loginForm.cart_list = [];
    if(this.cartService.cart_list) this.loginForm.cart_list = this.cartService.cart_list;
    this.loginForm.store_id = this.commonService.store_id;
    this.api.LOGIN(this.loginForm).subscribe(result => {
      this.loginForm.submit = false;
      if(result.status) {
        this.captureCustomerData(result);
        this.afterLoginEvent(this.commonService.after_login_event);
      }
      else {
        this.loginForm.errorMsg = result.message;
        console.log("response", result);
      }
    });
  }

  socialSignIn(socialPlatform: string) {
    if(isPlatformBrowser(this.platformId)) {
      if(this.commonService.after_login_event) {
        sessionStorage.setItem("after_login_event", this.commonService.encryptData(this.commonService.after_login_event));
      }
      if(socialPlatform=='google' && environment.production && this.commonService.application_setting.google_id) {
        let url = "https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/userinfo.profile&response_type=token&access_type=online&prompt=consent&redirect_uri="+this.commonService.origin+"/account/google&client_id="+this.commonService.application_setting.google_id;
        window.open(url, "_self");
      }
      else if(socialPlatform=='facebook' && environment.production && this.commonService.application_setting.facebook_id) {
        let url = "https://www.facebook.com/v6.0/dialog/oauth?response_type=token&auth_type=rerequest&scope=public_profile,email&redirect_uri="+this.commonService.origin+"/account/facebook&client_id="+this.commonService.application_setting.facebook_id;
        window.open(url, "_self");
      }
    }
  }
  facebookOauth(token) {
    // get user details
    this.http.get<any>('https://graph.facebook.com/me?fields=name,email&access_token='+token).subscribe(userData => {
      if(Object.entries(userData).length && userData.email) {
        let form_data: any = { name: userData.name, email: userData.email };
        form_data.cart_list = [];
        if(this.cartService.cart_list) form_data.cart_list = this.cartService.cart_list;
        form_data.store_id = this.commonService.store_id;
        this.callSocialLoginRequest(form_data);
      }
      else {
        setTimeout(() => { this.pageLoader = false; }, 500);
        console.log("get user details error", userData)
      }
    });
  }
  googleOauth(token) {
    // get user details
    let httpOptions = { headers: new HttpHeaders({ 'Authorization': 'Bearer '+token }) };
    this.http.get<any>('https://www.googleapis.com/oauth2/v2/userinfo', httpOptions).subscribe(userData => {
      if(Object.entries(userData).length && userData.email) {
        let form_data: any = { name: userData.name, email: userData.email };
        form_data.cart_list = [];
        if(this.cartService.cart_list) form_data.cart_list = this.cartService.cart_list;
        form_data.store_id = this.commonService.store_id;
        this.callSocialLoginRequest(form_data);
      }
      else {
        setTimeout(() => { this.pageLoader = false; }, 500);
        console.log("get user details error", userData)
      }
    });
  }
  callSocialLoginRequest(formData) {
    this.api.SOCIAL_LOGIN(formData).subscribe(result => {
      setTimeout(() => { this.pageLoader = false; }, 500);
      if(result.status) {
        delete this.commonService.after_login_event;
        if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("after_login_event")) {
          this.commonService.after_login_event = this.commonService.decryptData(sessionStorage.getItem("after_login_event"));
        }
        this.captureCustomerData(result);
        this.afterLoginEvent(this.commonService.after_login_event);
      }
      else console.log("response", result);
    });
  }

  captureCustomerData(result) {
    this.commonService.customer_token = result.token;
    this.commonService.user_details = {
      name: result.customer_details.name, email: result.customer_details.email,
      dial_code: result.customer_details.dial_code, mobile: result.customer_details.mobile
    };
    if(result.customer_details.gst) this.commonService.user_details.gst = result.customer_details.gst;
    localStorage.setItem("user_details", this.commonService.encryptData(this.commonService.user_details));
    localStorage.setItem("customer_token", this.commonService.customer_token);
    this.wishService.resetWishList(result.customer_details.wish_list);
    this.cartService.resetCartList(result.customer_details.cart_list);
    // remove guest info
    if(isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem("guest_email"); sessionStorage.removeItem("guest_token");
      sessionStorage.removeItem("checkout_address"); sessionStorage.removeItem("checkout_details");
    }
    delete this.commonService.guest_email; delete this.commonService.guest_token;
  }

  afterLoginEvent(x) {
    if(x) {
      if(isPlatformBrowser(this.platformId)) sessionStorage.removeItem("qo-cd");
      if(x.type=='add_product_to_wishlist') {
        this.wishService.addToWishList(x.product);
        this.router.navigate([x.redirect]);
      }
      else if(x.type=='buynow_product') {
        let checkoutDetails: any = { buy_now: true, item_list: [x.product], order_type: 'delivery' };
        this.afterLoginCheckout(checkoutDetails);
      }
      else if(x.type=='custom_model') {
        this.commonService.product_page_attr = x.product_attr;
        this.router.navigate([x.redirect]);
      }
      else {
        // redirect to cart or wishlist
        this.router.navigate([x.redirect]);
      }
    }
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("qo-cd")) {
      let checkoutDetails = this.commonService.decryptData(sessionStorage.getItem("qo-cd"));
      this.afterLoginCheckout(checkoutDetails);
      sessionStorage.removeItem("qo-cd");
    }
    else this.scrollTop();
  }

  afterLoginCheckout(checkoutDetails) {
    this.pageLoader = true;
    this.api.USER_UPDATE({ checkout_details: checkoutDetails }).subscribe(result => {
      if(result.status) {
        let addressList = result.data.address_list;
        let shippingIndex = addressList.findIndex(obj => obj.shipping_address);
        if(shippingIndex != -1) {
          checkoutDetails.shipping_address = addressList[shippingIndex];
          // pincode verification
          if(this.commonService.ys_features.indexOf('pincode_service')!=-1 && this.commonService.store_properties.pincodes.length && this.commonService.store_properties.pincodes.indexOf(checkoutDetails.shipping_address.pincode)==-1) {
            // redirect to address list
            this.buynowNavigation(checkoutDetails, '/checkout/address-list/product');
          }
          else {
            // shipping
            if(this.commonService.ys_features.indexOf('time_based_delivery')!=-1) {
              // redirect to delivery methods
              this.buynowNavigation(checkoutDetails, '/checkout/delivery-methods');
            }
            else {
              let sendData: any = {
                sid: this.commonService.session_id, store_id: this.commonService.store_id, shipping_address: checkoutDetails.shipping_address._id,
                order_type: checkoutDetails.order_type, currency_type: this.commonService.selected_currency.country_code
              };
              sendData.item_list = this.commonService.getItemList(checkoutDetails.item_list);
              if(checkoutDetails.quick_order_id) sendData.quick_order_id = checkoutDetails.quick_order_id;
              this.api.SHIPPING_DETAILS(sendData).subscribe(result => {
                if(result.status) {
                  checkoutDetails.shipping_method = result.data.shipping_method;
                  this.buynowNavigation(checkoutDetails, '/checkout/product-order-details');
                }
                else {
                  // redirect to shipping page
                  this.buynowNavigation(checkoutDetails, '/checkout/shipping-methods');
                }
              });
            }
          }
        }
        else {
          // redirect to address list
          this.buynowNavigation(checkoutDetails, '/checkout/address-list/product');
        }
      }
      else {
        console.log("response", result);
        this.router.navigate(["/"]);
      }
    });
  }
  buynowNavigation(checkoutDetails, redirect) {
    this.api.USER_UPDATE({ checkout_details: checkoutDetails }).subscribe(result => {
      if(result.status) this.router.navigate([redirect]);
      else {
        console.log("response", result);
        this.router.navigate(["/"]);
      }
    });
  }

  onForgot() {
    this.forgotForm.store_id = this.commonService.store_id;
    this.forgotForm.submit = true;
    this.api.FORGOT_REQUEST(this.forgotForm).subscribe((result) => {
      this.forgotForm.submit = false;
      this.forgotForm.req_status = result.status;
      this.forgotForm.alert_msg = result.message;
      if(!result.status) console.log("response", result);
    });
  }

  onLogout(modalName) {
    this.registerForm = {}; this.loginForm = {}; this.forgotForm = {};
    localStorage.removeItem("customer_token");
    delete this.commonService.customer_token;
    this.wishService.resetWishList([]);
    this.cartService.resetCartList([]);
    modalName.hide();
    this.pageLoader = true;
    this.scrollTop();
    this.ngOnInit();
  }

  scrollTop() {
    if(isPlatformBrowser(this.platformId)) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy() {
    delete this.commonService.after_login_event;
  }

}