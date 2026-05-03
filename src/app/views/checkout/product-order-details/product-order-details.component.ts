import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { StoreApiService } from '../../../services/store-api.service';
import { environment } from '../../../../environments/environment';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';
import { CartlistService } from '../../../services/cartlist.service';
import { CommonService } from '../../../services/common.service';
import { DynamicAssetLoaderService } from '../../../services/dynamic-asset-loader.service';
declare var SqPaymentForm : any;
declare var Foloosipay: any;
declare const fbq: Function;
declare var window: any;
declare const Razorpay: any;

@Component({
    selector: 'app-product-order-details',
    templateUrl: './product-order-details.component.html',
    styleUrls: ['./product-order-details.component.scss'],
    standalone: false
})

export class ProductOrderDetailsComponent implements OnInit {

  @ViewChild('ccAvenueForm', {static: false}) ccAvenueForm: ElementRef;
  @ViewChild('razorpayForm', {static: false}) razorpayForm: ElementRef;

  pageLoader: boolean; item_list: any = [];
  orderForm: any = { gift_wrapper: 0, tempGiftWrapCharges: 0 };
  shipping_address: any = {}; billing_address: any = {};
  shipping_method: any = {}; coupon_list: any = [];
  environment: any = environment;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  sub_total: any; tempSubTotal: any;
  manualDiscAmount: any = 0; tempManualDiscAmount: any = 0;
  discountAmount: any = 0; tempDiscountAmount: any = 0;
  offerAmount: any = 0; tempOfferAmount: any = 0;
  cartWeight: any = 0; cartQty: any = 0; buy_now: boolean;
  offer_form: any = {}; checkout_details: any = {};
  unique_product_list: any = []; accept_cod_tc: boolean;
  existCustomItems: boolean; otpForm: any = {};

  encRequest: String; accessCode: String;
  ccavenue_redirect: string = environment.ccavenue_payment_url;
  razorpayOptions: any = { my_order_type: "product", customer_name: "", customer_mobile: "" };
  squareForm: any; squareFormErrors: any = [];
  fatoorahCheckoutDetails: any; fatoorahPaymentMethods: any = [];
  autoDiscountDetails: any = {}; codConfig: any = {};
  private subscription: Subscription;
  codSeconds: number; codTimer: string;

  canMakePaymentCache = 'canMakePaymentCache';
  qrvalue : string = "temp"; payment_id: string;
  orderDetails: any; payAppConfig: any;

  constructor(
    @Inject(DOCUMENT) private document, private cartService: CartlistService, private api: ApiService, private router: Router, private assetLoader: DynamicAssetLoaderService,
    @Inject(PLATFORM_ID) private platformId: Object, public cc: CurrencyConversionService, private storeApi: StoreApiService, public commonService: CommonService
  ) {
    // squarepay
    let squareIndex = this.commonService.payment_methods.findIndex(obj => obj.name=='Square');
    if(squareIndex != -1) {
      if(this.commonService.payment_methods[squareIndex].mode=='live')
        this.assetLoader.load('square-live', 'squarepay').then(data => { }).catch(error => console.log("err", error));
      else this.assetLoader.load('square-sandbox', 'squarepay').then(data => { }).catch(error => console.log("err", error));
    }
    // foloosipay
    if(this.commonService.payment_methods.findIndex(obj => obj.name=='Foloosi') != -1) {
      this.assetLoader.load('foloosipay').then(data => {
        Foloosipay.init();
      }).catch(error => console.log("err", error));
    }
    // razorpay
    this.assetLoader.load('razorpay').then(() => { })
    .catch(error => console.log("err", error));
  }

  ngOnInit(): void {
    this.buy_now = false;
    // open offer input
    if(this.commonService.checkout_setting.apply_coupon) {
      this.orderForm.offer_applied = true; this.offer_form = {}; this.offerAmount = 0; this.tempOfferAmount = 0;
    }
    this.pageLoader = true;
    this.api.VALIDATE_OFFER_CODE({ store_id: this.commonService.store_id }).subscribe(result => {
      if(result.status) this.autoDiscountDetails = result.data;
      this.api.CHECKOUT_DETAILS(this.commonService.session_id).subscribe(result => {
        setTimeout(() => { this.pageLoader = false; }, 500);
        if(result.status) {
          this.checkout_details = result.data;
          if(this.checkout_details.currency_type==this.commonService.selected_currency.country_code) {
            this.manualDiscAmount = this.checkout_details.manual_discount;
            this.tempManualDiscAmount = this.cc.CALC_WO_AC(this.manualDiscAmount);
            // razorpay user details
            this.razorpayOptions.customer_email = this.checkout_details.customer_email;
            this.razorpayOptions.customer_name = this.checkout_details.customer_name;
            if(this.checkout_details.customer_mobile) this.razorpayOptions.customer_mobile = this.checkout_details.customer_mobile;
            else {
              if(this.checkout_details.order_type!='pickup') this.razorpayOptions.customer_mobile = this.checkout_details.shipping_address.mobile;
              else this.razorpayOptions.customer_mobile = this.checkout_details.billing_address.mobile;
            }
            this.setOrderDetails();
          }
          else this.router.navigate(["/"]);
        }
        else {
          console.log("response", result);
          this.router.navigate(["/"]);
        }
      });
    });
  }

  setOrderDetails() {
    if(this.checkout_details.order_type=='delivery') {
      if(!this.checkout_details.billing_address || this.commonService.application_setting.disable_delivery) this.router.navigate(["/"]);
    }
    if(this.checkout_details.buy_now) this.buy_now = true;
    this.item_list = this.checkout_details.item_list;
    this.shipping_address = this.checkout_details.shipping_address;
    this.billing_address = this.checkout_details.billing_address;
    this.shipping_method = this.checkout_details.shipping_method;
    this.shipping_method.tempShippingPrice = this.cc.CALC_WO_AC(this.shipping_method.shipping_price);
    this.item_list.forEach((obj, index) => {
      obj.cart_id = index+1;
      if(obj.customization_status) this.existCustomItems = true;
      if(obj.unit=="Pcs") {
        obj.tempFinalPrice = this.cc.CALC_WO_AC(obj.final_price*obj.quantity);
      }
      else {
        obj.tempFinalPrice = this.cc.CALC_WO_AC((obj.final_price*obj.quantity)+obj.addon_price);
      }
    });
    this.sub_total = this.checkout_details.sub_total;
    this.tempSubTotal = this.cc.CALC_WO_AC(this.sub_total);
    this.cartQty = this.checkout_details.cart_qty;
    this.cartWeight = this.checkout_details.cart_weight;
    let smDetails = this.checkout_details.sm_details;
    if(smDetails?.minimum_price && smDetails?.shipping_price>0 && smDetails?.minimum_price>this.sub_total) {
      this.shipping_method.tempMinPrice = this.cc.CALC_WO_AC(smDetails?.minimum_price-this.sub_total);
    }
    // gift wrapping
    this.orderForm.dispGiftWrappingCharges = this.cc.CALC(this.commonService.application_setting.gift_wrapping_charges) * this.cartQty;
    // packaging charges
    this.orderForm.packaging_charges = this.checkout_details.packaging_charges;
    this.orderForm.tempPackagingCharges = this.cc.CALC_WO_AC(this.orderForm.packaging_charges);
    // apply auto-discount
    if(this.orderForm.offer_applied && this.autoDiscountDetails.code) {
      this.offer_form.code = this.autoDiscountDetails.code;
      this.onCalcOrderDicount();
    }
  }

  decProductQty(index) {
    this.orderForm.cod_alert = false;
    this.orderForm.cart_exceed_alert = false;
    this.resetDiscount();
    if(this.item_list[index].additional_qty==0 && this.item_list[index].quantity>this.commonService.min_qty[this.item_list[index].unit]) {
      this.item_list[index].unavailable = false;
      this.item_list[index].quantity -= this.commonService.step_qty[this.item_list[index].unit];
      if((this.item_list[index].quantity % 1) != 0) this.item_list[index].quantity = parseFloat(this.item_list[index].quantity.toFixed(2));
      if(this.item_list[index].quantity < this.commonService.min_qty[this.item_list[index].unit]) this.item_list[index].quantity = this.commonService.min_qty[this.item_list[index].unit];
    }
    else this.item_list.splice(index, 1);
    // get shipping method
    if(!this.shipping_method.delivery_method) {
      let sendData: any = {
        sid: this.commonService.session_id, store_id: this.commonService.store_id, shipping_address: this.shipping_address._id,
        order_type: this.checkout_details.order_type, currency_type: this.commonService.selected_currency.country_code,
        shipping_id: this.shipping_method._id
      };
      sendData.item_list = this.commonService.getItemList(this.item_list);
      this.api.SHIPPING_DETAILS(sendData).subscribe(result => {
        if(result.status) {
          this.shipping_method = result.data.shipping_method;
          this.shipping_method.tempShippingPrice = this.cc.CALC_WO_AC(this.shipping_method.shipping_price);
        }
        else {
          console.log("response", result);
          this.router.navigate(["/"]);
        }
      });
    }
    if(!this.buy_now) {
      this.cartService.updateCartList(this.item_list);
      this.checkout_details.item_list = this.item_list;
      if(this.commonService.customer_token) this.api.USER_UPDATE({ checkout_details: this.checkout_details }).subscribe(result => { });
      else if(isPlatformBrowser(this.platformId)) sessionStorage.setItem("checkout_details", this.commonService.encryptData(this.checkout_details));
    }
  }

  resetDiscount() {
    this.orderForm.offer_applied = false; this.offerAmount = 0; this.tempOfferAmount = 0;
    this.orderForm.coupon_status = false; this.discountAmount = 0; this.tempDiscountAmount = 0; this.coupon_list = [];
  }

  onMakePayment(paymentDetails) {
    let packDetails = this.commonService.store_details.package_details;
    if(packDetails && packDetails.billing_status)
    {
      this.unique_product_list = []; delete this.orderForm.errorMsg;
      delete this.shipping_method.tempMinPrice; this.orderForm.submit = true;
      this.orderForm.cart_exceed_alert = false; this.orderForm.cod_alert = false;
      this.orderForm.offer_invalid_error = false;
      // validate cart weight
      let maxWeight = this.commonService.application_setting.max_shipping_weight;
      if(maxWeight===0) { maxWeight = this.cartWeight; }
      if(maxWeight >= this.cartWeight)
      {
        // order details
        let checkoutDetails: any = { coupon_list: [], sid: this.commonService.session_id };
        if(this.orderForm.offer_applied && this.offer_form.code) checkoutDetails.offer_code = this.offer_form.code;
        this.coupon_list.forEach(element => {
          if(element.code) element.code = element.code.trim();
          else element.code = "";
          if(element.code && checkoutDetails.coupon_list.findIndex(obj => obj.code==element.code)==-1) checkoutDetails.coupon_list.push({ code: element.code });
        });
        checkoutDetails.store_id = this.commonService.store_id;
        checkoutDetails.payment_details = { name: paymentDetails.name };
        if(this.orderForm.order_note) checkoutDetails.order_note = this.orderForm.order_note;
        if(this.orderForm.gift_status) checkoutDetails.gift_status = true;
        if(this.orderForm.need_sample) checkoutDetails.need_sample = true;
        let discountAmount = parseFloat(this.manualDiscAmount)+parseFloat(this.discountAmount)+parseFloat(this.offerAmount);
        checkoutDetails.grand_total = parseFloat(this.sub_total)+parseFloat(this.shipping_method.shipping_price)+parseFloat(this.orderForm.gift_wrapper)+parseFloat(this.orderForm.packaging_charges);
        checkoutDetails.final_price = checkoutDetails.grand_total - discountAmount;
        // for guest login
        if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("guest_email")) {
          checkoutDetails.guest_email = this.commonService.decryptData(sessionStorage.getItem("guest_email"));
        }
        // create order
        checkoutDetails.payment_details = { name: paymentDetails.name };
        if(paymentDetails.name=="COD") {
          if(paymentDetails.cod_config) this.codConfig = paymentDetails.cod_config;
          if(this.offerAmount > 0) {
            if(this.commonService.checkout_setting.cod_apply_coupon) this.placeCodOrder(checkoutDetails);
            else {
              this.orderForm.submit = false;
              this.orderForm.cod_offer_alert = true;
            }
          }
          else this.placeCodOrder(checkoutDetails);
        }
        else {
          // fb pixel
          if(isPlatformBrowser(this.platformId) && environment.facebook_pixel) {
            fbq('track', 'InitiateCheckout', {
              value: checkoutDetails.final_price, currency: this.commonService.store_details.currency
            });
          }
          if(paymentDetails.name=="Fatoorah") {
            this.fatoorahCheckoutDetails = checkoutDetails;
            this.storeApi.FATOORAH_INITIATE_PAY({ currency_type: this.commonService.selected_currency, price: this.fatoorahCheckoutDetails.final_price }).subscribe(result => {
              this.orderForm.submit = false;
              if(result.status) {
                this.fatoorahPaymentMethods = result.data.PaymentMethods;
                this.document.getElementById("openFatoorahModal").click();
              }
              else {
                console.log("response", result);
                this.router.navigate(['/checkout/payment-failure'], { queryParams: { response: result.message } });
              }
            });
          }
          else {
            this.api.CREATE_ORDER(checkoutDetails).subscribe(result => {
              if(isPlatformBrowser(this.platformId) && result.status) {
                if(paymentDetails.name) {
                  if(paymentDetails.name=="CCAvenue") {
                    if(paymentDetails.app_config) {
                      this.accessCode = paymentDetails.app_config.access_code;
                      this.getEncryptedData(result.data);
                    }
                    else console.log("Invalid payment details");
                  }
                  else if(paymentDetails.name=="Razorpay") {
                    this.razorpayOptions.my_order_id = result.data.order_id;
                    this.razorpayOptions.razorpay_order_id = result.data.razorpay_response.id;
                    if(paymentDetails.app_config) {
                      // this.razorpayOptions.key = paymentDetails.app_config.key;
                      // this.razorpayOptions.store_name = paymentDetails.app_config.name;
                      // this.razorpayOptions.description = paymentDetails.app_config.description;
                      // setTimeout(_ => this.razorpayForm.nativeElement.submit());
                      const options = {
                        key: paymentDetails.app_config.key, 
                        order_id: result.data.razorpay_response.id,
                        name: paymentDetails.app_config.name,
                        description: paymentDetails.app_config.description,
                        prefill: {
                          name: this.razorpayOptions.customer_name,
                          email: this.razorpayOptions.customer_email,
                          contact: this.razorpayOptions.customer_mobile
                        },
                        notes: {
                          my_store_id: this.commonService.store_id,
                          my_order_id: result.data.order_id,
                          my_order_type: "product"
                        },
                        callback_url: environment.razorpay_redirect_url+this.commonService.store_id,
                        modal: {
                          ondismiss: () => {
                            window.location.href = this.commonService.origin;
                          }
                        },
                        config: {
                          display: {
                            sequence: ["block.upi", "block.card", "block.netbanking", "block.wallet", "block.paylater"]
                          }
                        }
                      };
                      const rzp1 = new Razorpay(options);
                      rzp1.open();
                    }
                    else {
                      this.orderForm.submit = false;
                      console.log("Invalid payment details");
                    }
                  }
                  else if(paymentDetails.name=="Foloosi") {
                    Foloosipay.open(result.data.reference_token, paymentDetails.app_config.merchant_key);
                    const foloosiHandler = (e => {
                      let payData = e.data;
                      if(payData.status == 'success') {
                        Foloosipay.close();
                        this.orderForm.submit = true;
                        window.location.href = payData.data.redirect_url;
                      }
                      else { console.log(payData); }
                    });
                    window.addEventListener('message', foloosiHandler);
                  }
                  else if(paymentDetails.name=="PayPal" || paymentDetails.name=="Flutterwave" || paymentDetails.name=="Billbox")
                    window.location.href = result.data.payment_url;
                  else if(paymentDetails.name=="Telr") window.location.href = result.data.url;
                  else if(paymentDetails.name=="Square") this.createSquarePayment(paymentDetails, result.data.order_id);
                  else if(paymentDetails.name=="Gpay") {
                    this.orderForm.submit = false;
                    this.orderDetails = result.data;
                    this.payAppConfig = paymentDetails.app_config;
                    this.qrvalue = "upi://pay?pa="+paymentDetails.app_config.upi_id+"&pn="+paymentDetails.app_config.merchant_name+"&mc="+paymentDetails.app_config.merchant_code+"&am="+this.orderDetails.amount+"&cu="+this.orderDetails.currency+"&tr="+this.orderDetails.order_number;
                    this.document.getElementById('openQrcodeModal').click();
                  }
                  else if(paymentDetails.name=="Bank Payment") {
                    this.orderForm.submit = false;
                    this.orderDetails = result.data;
                    this.payAppConfig = paymentDetails.app_config;
                    this.document.getElementById('openBankPayModal').click();
                  }
                  else console.log("Invalid payment method");
                }
                else this.router.navigate(["/checkout/order-summary/product/"+result.data.order_id]);
              }
              else this.orderErrResponse(result);
            });
          }
        }
      }
      else {
        this.orderForm.submit = false;
        this.orderForm.cart_exceed_alert = true;
      }
    }
    else this.document.getElementById('ysps_modal').click();
  }

  placeCodOrder(checkoutDetails) {
    let codCharges: any = this.cc.CALC_INR_WITH_AC(this.codConfig.cod_charges);
    this.codConfig.tempCodCharges = this.cc.CALC(this.codConfig.cod_charges);
    if(this.accept_cod_tc) {
      checkoutDetails.cod_charges = parseFloat(codCharges);
      checkoutDetails.grand_total += checkoutDetails.cod_charges;
      checkoutDetails.final_price += checkoutDetails.cod_charges;
      if(this.codConfig.sms_status) {
        delete this.otpForm.err_msg;
        this.api.VALIDATE_COD_OTP(this.otpForm.otp).subscribe(result => {
          if(result.status) {
            this.document.getElementById('closeCodModal').click();
            checkoutDetails.cod_mobile = this.otpForm.mobile;
            this.continuePlaceCodOrder(checkoutDetails);
          }
          else {
            this.orderForm.submit = false;
            this.otpForm.err_msg = result.message;
            console.log("response", result);
          }
        });
      }
      else {
        this.document.getElementById('closeCodModal').click();
        this.continuePlaceCodOrder(checkoutDetails);
      }
    }
    else {
      this.orderForm.submit = false;
      if(this.item_list.findIndex(obj => !obj.allow_cod) != -1) {
        this.orderForm.cod_alert = true;
      }
      else {
        if(this.billing_address) this.otpForm = { mobile: this.billing_address.mobile };
        this.document.getElementById("open_cod_modal").click();
      }
    }
  }
  continuePlaceCodOrder(checkoutDetails) {
    // fb pixel
    if(isPlatformBrowser(this.platformId) && environment.facebook_pixel) {
      fbq('track', 'InitiateCheckout', {
        value: checkoutDetails.final_price, currency: this.commonService.store_details.currency
      });
    }
    // create order
    this.api.CREATE_ORDER(checkoutDetails).subscribe(result => {
      if(result.status) this.router.navigate(["/checkout/order-summary/product/"+result.data.order_id]);
      else this.orderErrResponse(result);
    });
  }

  sendCodOtp() {
    delete this.otpForm.err_msg;
    if(localStorage.getItem("temp_data")) {
      let smsDetails = this.commonService.decryptData(localStorage.getItem("temp_data"));
      let smsIndex = smsDetails.findIndex(obj => obj.mobile==this.otpForm.mobile && obj.count>=environment.cod_sms.limit);
      if(smsIndex==-1) this.sendSMS();
      else {
        let timeStamp = parseInt(smsDetails[smsIndex].timestamp)+(environment.cod_sms.interval_in_mins*60000);
        if(timeStamp > new Date().valueOf()) {
          this.otpForm.otp_status = false;
          this.otpForm.err_msg = "Please try again after sometimes or use alternate mobile number.";
        }
        else {
          smsDetails.splice(smsIndex, 1);
          localStorage.setItem("temp_data", this.commonService.encryptData(smsDetails));
          this.sendSMS();
        }
      }
    }
    else this.sendSMS();
  }
  sendSMS() {
    this.otpForm.submit = true;
    this.api.SEND_COD_OTP({ store_id: this.commonService.store_id, mobile: this.billing_address.dial_code+this.otpForm.mobile }).subscribe(result => {
      this.otpForm.submit = false;
      this.otpForm.otp_status = result.status;
      if(result.status) {
        this.otpForm.sms_sent = true;
        setTimeout(() => { this.otpForm.sms_sent = false; }, 5000);
        this.codSeconds = environment.cod_sms.valid_in_seconds; delete this.codTimer;
        if(isPlatformBrowser(this.platformId)) this.subscription = interval(1000).subscribe(x => { this.getTimeDifference(); });
        let tempSmsRecord = [];
        if(localStorage.getItem("temp_data")) tempSmsRecord = this.commonService.decryptData(localStorage.getItem("temp_data"));
        let tempIndex = tempSmsRecord.findIndex(obj => obj.mobile==this.otpForm.mobile);
        if(tempIndex!=-1) {
          tempSmsRecord[tempIndex].count += 1;
          tempSmsRecord[tempIndex].timestamp = new Date().valueOf();
        }
        else tempSmsRecord.push({ mobile: this.otpForm.mobile, count: 1, timestamp: new Date().valueOf() });
        localStorage.setItem("temp_data", this.commonService.encryptData(tempSmsRecord));
      }
      else {
        this.otpForm.err_msg = result.message;
        console.log("response", result);
      }
    });
  }

  onupdateOrderId(payId, orderId) {
    if(payId) {
      this.api.UPDATE_ORDER_PAYMENT(this.commonService.store_id, { order_id: orderId, payment_id: payId }).subscribe(result => {
        this.document.getElementById("closeModal").click();
        this.router.navigate(["/checkout/order-summary/product/"+orderId]);
      });
    }
    else {
      this.document.getElementById("closeModal").click();
      this.router.navigate(["/checkout/order-summary/product/"+orderId]);
    }
  }

  getTimeDifference() {
    if(this.codSeconds >= 0) {
      this.codTimer = new Date(this.codSeconds * 1000).toISOString().substr(14, 5);
      this.codSeconds -= 1;
    }
    else {
      this.subscription.unsubscribe();
      if(localStorage.getItem("temp_data")) {
        let smsDetails = this.commonService.decryptData(localStorage.getItem("temp_data"));
        let smsIndex = smsDetails.findIndex(obj => obj.mobile==this.otpForm.mobile && obj.count>=environment.cod_sms.limit);
        if(smsIndex!=-1) {
          this.otpForm.otp_status = false;
          this.otpForm.err_msg = "Please try again after sometimes or use alternate mobile number.";
        }
      }
    }
  }

  confirmFatoorah(payId) {
    this.fatoorahCheckoutDetails.fatoorah_pay_id = payId;
    this.document.getElementById("closeFatoorahModal").click();
    this.orderForm.submit = true;
    this.api.CREATE_ORDER(this.fatoorahCheckoutDetails).subscribe(result => {
      if(result.status && isPlatformBrowser(this.platformId)) window.location.href = result.data.PaymentURL;
      else this.orderErrResponse(result);
    });
  }

  orderErrResponse(result) {
    this.orderForm.submit = false;
    console.log("response", result);
    this.orderForm.errorMsg = result.message;
    if(result.item_list) {
      this.unique_product_list = result.item_list;
      for(let item of this.item_list) {
        delete item.available_qty; delete item.unavailable;
        let index = this.unique_product_list.findIndex(object => object.product_id==item.product_id && object.unavailable);
        if(index!=-1) {
          item.unavailable = true;
          item.available_qty = this.unique_product_list[index].available_qty;
        }
      }
    }
  }

  giftStatus() {
    this.orderForm.gift_wrapper = 0;
    this.orderForm.tempGiftWrapCharges = 0;
    if(this.orderForm.gift_status) {
      this.orderForm.gift_wrapper = this.cc.CALC_INR_WITH_AC(this.commonService.application_setting.gift_wrapping_charges) * this.cartQty;
      this.orderForm.tempGiftWrapCharges = this.cc.CALC_WO_AC(this.orderForm.gift_wrapper);
    }
    if(this.commonService.application_setting.gift_wrapping_charges > 0) this.resetDiscount();
  }

  /* GIFTCARD COUPON */
  onCalcOrderDicount() {
    return new Promise((resolve, reject) => {
      let discForm: any = { store_id: this.commonService.store_id, coupon_list: [], sid: this.commonService.session_id };
      if(this.orderForm.gift_status) discForm.gift_status = true;
      if(this.orderForm.coupon_status) {
        this.coupon_list.forEach(element => {
          if(element.code) element.code = element.code.trim();
          else element.code = "";
          if(element.code && discForm.coupon_list.findIndex(obj => obj.code==element.code)==-1) discForm.coupon_list.push({ code: element.code });
        });
        this.coupon_list = discForm.coupon_list;
      }
      if(this.orderForm.offer_applied && this.offer_form.code) discForm.offer_code = this.offer_form.code;
      this.api.CALC_ORDER_DISCOUNT(discForm).subscribe(result => {
        this.discountAmount = 0; this.tempDiscountAmount = 0;
        this.offerAmount = 0; this.tempOfferAmount = 0;
        if(result.status) {
          this.coupon_list = result.coupon_list;
          this.discountAmount = this.coupon_list.reduce((accumulator, currentValue) => {
            return accumulator + currentValue['price'];
          }, 0);
          this.tempDiscountAmount = this.cc.CALC_WO_AC(this.discountAmount);
          // offer code
          if(this.offer_form.code) {
            this.offer_form.status = 'valid';
            this.offerAmount = result.offer_amount;
            this.tempOfferAmount = this.cc.CALC_WO_AC(this.offerAmount);
          }
        }
        else {
          console.log("response", result);
          if(this.offer_form.code) {
            this.offer_form.alert_msg = result.message;
            this.offer_form.status = 'invalid';
          }
        }
        resolve(this.coupon_list);
      });
    });
  }

  onRemoveCoupon(index) {
    this.coupon_list.splice(index, 1);
    if(!this.coupon_list.length) this.orderForm.coupon_status = false;
    this.discountAmount = this.coupon_list.reduce((accumulator, currentValue) => {
      return accumulator + currentValue['price'];
    }, 0);
    this.tempDiscountAmount = this.cc.CALC_WO_AC(this.discountAmount);
  }
  onGcAmtCalc() {
    this.discountAmount = this.coupon_list.reduce((accumulator, currentValue) => {
      return accumulator + currentValue['price'];
    }, 0);
    this.tempDiscountAmount = this.cc.CALC_WO_AC(this.discountAmount);
  }
  /* ##GIFTCARD COUPON## */

  /* ccAvenue payment encryption */
  getEncryptedData(orderResponse) {
    let userEmail = "";
    if(this.commonService.customer_token) userEmail = this.commonService.user_details.email;
    else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("guest_email")) userEmail = this.commonService.decryptData(sessionStorage.getItem("guest_email"));
    this.api.GET_ENCRYPTED_DATA(this.commonService.store_id, userEmail, orderResponse.amount, orderResponse.order_details, 'product').subscribe( result => {
      this.orderForm.submit = false;
      if(result.status) {
        this.encRequest = result.encryptData;
        if(this.encRequest) setTimeout(_ => this.ccAvenueForm.nativeElement.submit());
        else console.log("CCAvenue encryption error");
      }
      else console.log("response", result);
    });
  }
  /* ##ccAvenue payment encryption## */

  /* Square */
  createSquarePayment(paymentDetails, ysOrderId) {
    let payableAmt: any = (((this.tempSubTotal*1)+(this.shipping_method.tempShippingPrice*1))-((this.tempManualDiscAmount*1)+(this.tempDiscountAmount*1)+(this.tempOfferAmount*1)));
    payableAmt = (payableAmt).toFixed(2);
    this.squareForm = new SqPaymentForm({
      applicationId: paymentDetails.app_config.app_id,
      locationId: paymentDetails.app_config.location_id,
      inputClass: 'sq-input',
      autoBuild: false,
      inputStyles: [{ fontSize: '16px', lineHeight: '24px', padding: '16px', placeholderColor: '#a0a0a0', backgroundColor: 'transparent' }],
      cardNumber: { elementId: 'sq-card-number', placeholder: 'Card Number' },
      cvv: { elementId: 'sq-cvv', placeholder: 'CVV' },
      expirationDate: { elementId: 'sq-expiration-date', placeholder: 'MM/YY' },
      postalCode: { elementId: 'sq-postal-code', placeholder: 'Postal' },
      googlePay: { elementId: 'sq-google-pay' },
      applePay: { elementId: 'sq-apple-pay' },
      callbacks: {
        methodsSupported: (methods, unsupportedReason) => {
          // applePay
          let applePayBtn = document.getElementById('sq-apple-pay');
          if(methods.applePay === true) applePayBtn.style.display = 'inline-block';
          // goolePay
          let googlePayBtn = document.getElementById('sq-google-pay');
          if(methods.googlePay === true) googlePayBtn.style.display = 'inline-block';
        },
        cardNonceResponseReceived: (errors, nonce, cardData, billingContact, shippingContact) => {
          if(!errors && nonce) {
            this.document.getElementById("closeSquareModal").click();
            this.orderForm.submit = true;
            this.storeApi.SQUARE_PAYMENT({ nonce: nonce, order_type: 'product', order_id: ysOrderId }).subscribe(result => {
              if(result.status) this.router.navigate(["/checkout/order-summary/product/"+ysOrderId]);
              else this.router.navigate(['/checkout/payment-failure'], { queryParams: { response: result.msg } });
            });
          }
          else {
            this.squareFormErrors = errors;
            console.error('Encountered errors:', errors);
          }
        },
        createPaymentRequest: () => {
          let paymentRequestJson = {
            requestShippingAddress: true, requestBillingInfo: true,
            currencyCode: this.commonService.selected_currency.country_code, countryCode: "US",
            total: { label: paymentDetails.app_config.name, amount: payableAmt, pending: false }
          };
          return paymentRequestJson;
        }
      }
    });
    this.squareForm.build();
    this.orderForm.submit = false;
    this.document.getElementById("openSquareModal").click();
  }
  onGetCardNonce(event) {
    event.preventDefault();
    this.squareForm.requestCardNonce();
  }
  /* ## Square ## */

  /* Gpay */
  downloadQrcode(qrelement) {
    const parentElement = qrelement.el.nativeElement.querySelector("img").src;
    // converts base 64 encoded image to blobData
    let blobData = this.convertBase64ToBlob(parentElement);
    // saves as image
    if (window.navigator && window.navigator.msSaveOrOpenBlob) { //IE
      window.navigator.msSaveOrOpenBlob(blobData, 'gpay-qrcode');
    } else { // chrome
      const blob = new Blob([blobData], { type: "image/png" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gpay-qrcode';
      link.click();
    }
  }
  convertBase64ToBlob(Base64Image: any) {
    // SPLIT INTO TWO PARTS
    const parts = Base64Image.split(';base64,');
    // HOLD THE CONTENT TYPE
    const imageType = parts[0].split(':')[1];
    // DECODE BASE64 STRING
    const decodedData = window.atob(parts[1]);
    // CREATE UNIT8ARRAY OF SIZE SAME AS ROW DATA LENGTH
    const uInt8Array = new Uint8Array(decodedData.length);
    // INSERT ALL CHARACTER CODE INTO UINT8ARRAY
    for (let i = 0; i < decodedData.length; ++i) {
      uInt8Array[i] = decodedData.charCodeAt(i);
    }
    // RETURN BLOB IMAGE AFTER CONVERSION
    return new Blob([uInt8Array], { type: imageType });
  }
  /* ## Gpay ## */

  ngOnDestroy() {
    if(this.subscription) this.subscription.unsubscribe();
  }

}