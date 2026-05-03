import { Component, OnInit, Inject, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { StoreApiService } from '../../../services/store-api.service';
import { environment } from '../../../../environments/environment';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';
import { CommonService } from '../../../services/common.service';
import { DynamicAssetLoaderService } from '../../../services/dynamic-asset-loader.service';
declare var SqPaymentForm : any;
declare var Foloosipay: any;

@Component({
    selector: 'app-giftcard-order-details',
    templateUrl: './giftcard-order-details.component.html',
    styleUrls: ['./giftcard-order-details.component.scss'],
    standalone: false
})
export class GiftcardOrderDetailsComponent implements OnInit {

  @ViewChild('ccAvenueForm', {static: false}) ccAvenueForm: ElementRef;
  @ViewChild('razorpayForm', {static: false}) razorpayForm: ElementRef;

  pageLoader: boolean;
  orderForm: any = {};
  checkout_details: any = {};
  environment: any = environment;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;

  encRequest: String; accessCode: String;
  ccavenue_redirect: string = environment.ccavenue_payment_url;
  razorpayOptions: any = { my_order_type: "giftcard" };
  squareForm: any; squareFormErrors: any = [];
  fatoorahPaymentMethods: any = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private api: ApiService, private router: Router, public commonService: CommonService,
    @Inject(DOCUMENT) private document, public cc: CurrencyConversionService, private storeApi: StoreApiService, private assetLoader: DynamicAssetLoaderService
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
  }

  ngOnInit(): void {
    this.pageLoader = true;
    this.api.USER_DETAILS().subscribe(result => {
      if(result.status && result.data.checkout_details) {
        this.checkout_details = result.data.checkout_details;
        if(this.checkout_details.card_name && this.checkout_details.billing_address) {
          this.orderForm = {
            card_name: this.checkout_details.card_name,
            image: this.checkout_details.image,
            from_name: this.checkout_details.from_name,
            to_name: this.checkout_details.to_name,
            to_email: this.checkout_details.to_email,
            message: this.checkout_details.message,
            temp_message: this.commonService.transformHtml(this.checkout_details.message),
            price: this.checkout_details.price,
            temp_price: this.cc.CALC_WO_AC(this.checkout_details.price),
            currency_type: this.commonService.decryptData(localStorage.getItem("selected_currency")),
            billing_address: this.checkout_details.billing_address,
            coupon_type: this.commonService.store_details.additional_features.giftcard_type
          };
          this.razorpayOptions.customer_mobile = this.checkout_details.billing_address.mobile;
        }
        else this.router.navigate(["/"]);
      }
      else {
        console.log("response", result);
        this.router.navigate(["/"]);
      }
      setTimeout(() => { this.pageLoader = false; }, 500);
    });
    // razorpay user details
    this.razorpayOptions.customer_name = this.commonService.user_details.name;
    this.razorpayOptions.customer_email = this.commonService.user_details.email;
  }

  onMakePayment(paymentDetails) {
    this.orderForm.submit = true;
    this.orderForm.payment_details = { name: paymentDetails.name };
    if(paymentDetails.name=="Fatoorah") {
      this.storeApi.FATOORAH_INITIATE_PAY({ currency_type: this.orderForm.currency_type, price: this.orderForm.price }).subscribe(result => {
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
      this.api.BUY_COUPON(this.orderForm).subscribe(result => {
        if(isPlatformBrowser(this.platformId) && result.status) {
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
              this.razorpayOptions.key = paymentDetails.app_config.key;
              this.razorpayOptions.store_name = paymentDetails.app_config.name;
              this.razorpayOptions.description = paymentDetails.app_config.description;
              setTimeout(_ => this.razorpayForm.nativeElement.submit());
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
          else if(paymentDetails.name=="PayPal" || paymentDetails.name=="Flutterwave" || paymentDetails.name=="Billbox") {
            window.location.href = result.data.payment_url;
          }
          else if(paymentDetails.name=="Telr") window.location.href = result.data.url;
          else if(paymentDetails.name=="Square") this.createSquarePayment(paymentDetails, result.data.order_id);
          else console.log("Invalid payment method");
        }
        else {
          this.orderForm.submit = false;
          console.log("response", result);
        }
      });
    }
  }

  confirmFatoorah(payId) {
    this.orderForm.fatoorah_pay_id = payId;
    this.document.getElementById("closeFatoorahModal").click();
    this.orderForm.submit = true;
    this.api.BUY_COUPON(this.orderForm).subscribe(result => {
      if(result.status && isPlatformBrowser(this.platformId)) window.location.href = result.data.PaymentURL;
      else {
        console.log("response", result);
        this.orderForm.submit = false;
      }
    });
  }

  /* ccAvenue payment encryption */
  getEncryptedData(orderResponse) {
    orderResponse.order_details.shipping_address = {};
    this.api.GET_ENCRYPTED_DATA(this.commonService.store_id, this.commonService.user_details.email, orderResponse.amount, orderResponse.order_details, 'giftcard').subscribe( result => {
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
            total: { label: paymentDetails.app_config.name, amount: this.orderForm.temp_price, pending: false }
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

}