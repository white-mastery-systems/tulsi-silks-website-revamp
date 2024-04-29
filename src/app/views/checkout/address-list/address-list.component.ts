import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { CommonService } from '../../../services/common.service';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-address-list',
  templateUrl: './address-list.component.html',
  styleUrls: ['./address-list.component.scss']
})

export class AddressListComponent implements OnInit {

  pageLoader: boolean; btnLoader: boolean;
  list: any = []; params: any;
  state_list: any = []; guestForm: any = {};
  addressForm: any = {}; checkout_details: any = {};
  template_setting: any = environment.template_setting;
  country_details: any; address_fields: any = []; mobile_pattern: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
    private activeRoute: ActivatedRoute, private api: ApiService, private router: Router,
    public commonService: CommonService, private cc: CurrencyConversionService
  ) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.params = params; this.addressForm = {}; this.btnLoader = false;
      if(this.commonService.customer_token) {
        this.pageLoader = true;
        this.api.USER_DETAILS().subscribe(result => {
          if(result.status && result.data.checkout_details) {
            this.list = result.data.address_list;
            this.checkout_details = result.data.checkout_details;
            if(this.router.url.indexOf('product')!=-1) {
              if(!this.checkout_details.item_list)
                this.router.navigate(["/"]);
              if(this.checkout_details.order_type=='pickup' && this.list.length)
                this.router.navigate(["/checkout/pickup-methods"]);
            }
          }
          else {
            console.log("response", result);
            this.router.navigate(["/"]);
          }
          setTimeout(() => { this.pageLoader = false; }, 500);
        });
      }
      else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("guest_email") && sessionStorage.getItem("checkout_details")) {
        this.guestForm = { email: this.commonService.guest_email };
        this.checkout_details = this.commonService.decryptData(sessionStorage.getItem("checkout_details"));
        if(!this.checkout_details.item_list) this.router.navigate(["/"]);
        // address details
        if(sessionStorage.getItem("checkout_address")) {
          this.addressForm = this.commonService.decryptData(sessionStorage.getItem("checkout_address"));
        }
        else {
          this.addressForm.type = 'home';
          this.addressForm.country = this.commonService.store_details.country;
        }
      }
      else this.router.navigate(["/"]);
      // country list
      this.commonService.getCountryList().then(() => {
        // update address form
        if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("guest_email") && sessionStorage.getItem("checkout_details")) {
          this.onCountryChange(this.addressForm.country);
          if(sessionStorage.getItem("checkout_address")) {
            this.address_fields.forEach(element => {
              element.value = this.addressForm[element.keyword];
            });
          }
        }
      });
    });
  }

  // for product (valid users)
  onSelectForProduct(x, index) {
    this.checkout_details.shipping_address = x;
    // set default shipping address (if not exist)
    let updatedAddressList = null;
    if(this.list.findIndex(obj => obj.shipping_address) == -1) {
      this.list[index].shipping_address = true;
      updatedAddressList = this.list;
    }
    // shipping
    if(this.commonService.ys_features.indexOf('time_based_delivery')!=-1) {
      // redirect to delivery methods
      this.checkoutNavigation(updatedAddressList, this.checkout_details, '/checkout/delivery-methods');
    }
    else {
      let sendData: any = {
        sid: this.commonService.session_id, store_id: this.commonService.store_id, shipping_address: this.checkout_details.shipping_address._id,
        order_type: this.checkout_details.order_type, currency_type: this.commonService.selected_currency.country_code
      };
      sendData.item_list = this.commonService.getItemList(this.checkout_details.item_list);
      if(this.checkout_details.quick_order_id) sendData.quick_order_id = this.checkout_details.quick_order_id;
      this.api.SHIPPING_DETAILS(sendData).subscribe(result => {
        if(result.status) {
          this.checkout_details.shipping_method = result.data.shipping_method;
          this.checkoutNavigation(updatedAddressList, this.checkout_details, '/checkout/product-order-details');
        }
        else {
          // redirect to shipping page
          this.checkoutNavigation(updatedAddressList, this.checkout_details, '/checkout/shipping-methods');
        }
      });
    }
  }
  checkoutNavigation(addressList, checkoutDetails, redirect) {
    let jsonData: any = { checkout_details: checkoutDetails };
    if(addressList) jsonData.address_list = addressList;
    this.api.USER_UPDATE(jsonData).subscribe(result => {
      if(result.status) this.router.navigate([redirect]);
      else {
        console.log("response", result);
        this.router.navigate(["/"]);
      }
    });
  }

  // for product (guest users)
  onDeliver() {
    this.address_fields.forEach(element => {
      if(element.value) this.addressForm[element.keyword] = element.value;
    });
    if(this.commonService.ys_features.indexOf('pincode_service')!=-1 && this.commonService.store_properties.pincodes.length && this.commonService.store_properties.pincodes.indexOf(this.addressForm.pincode)==-1) {
      this.addressForm.error_msg = "Service not available for this pincode.";
    }
    else if(isPlatformBrowser(this.platformId)) {
      this.btnLoader = true;
      this.api.GUEST_USER_UPDATE({ address_list: [this.addressForm] }).subscribe(result => {
        this.btnLoader = false;
        if(result.status) {
          if(this.checkout_details.order_type!='pickup') this.checkout_details.shipping_address = result.data.address_list[0];
          sessionStorage.setItem("checkout_address", this.commonService.encryptData(result.data.address_list[0]));
          sessionStorage.setItem("checkout_details", this.commonService.encryptData(this.checkout_details));
          // pickup
          if(this.checkout_details.order_type=='pickup') {
            this.router.navigate(['/checkout/pickup-methods']);
          }
          // shipping
          else if(this.commonService.ys_features.indexOf('time_based_delivery')!=-1) {
            this.router.navigate(['/checkout/delivery-methods']);
          }
          else {
            let sendData: any = {
              sid: this.commonService.session_id, store_id: this.commonService.store_id, shipping_address: this.checkout_details.shipping_address._id,
              order_type: this.checkout_details.order_type, currency_type: this.commonService.selected_currency.country_code
            };
            sendData.item_list = this.commonService.getItemList(this.checkout_details.item_list);
            if(this.checkout_details.quick_order_id) sendData.quick_order_id = this.checkout_details.quick_order_id;
            this.api.SHIPPING_DETAILS(sendData).subscribe(result => {
              if(result.status) {
                this.checkout_details.shipping_method = result.data.shipping_method;
                if(isPlatformBrowser(this.platformId)) sessionStorage.setItem("checkout_details", this.commonService.encryptData(this.checkout_details));
                this.router.navigate(['/checkout/product-order-details']);
              }
              else {
                // redirect to shipping page
                this.router.navigate(['/checkout/shipping-methods']);
              }
            });
          }
        }
        else {
          this.addressForm.error_msg = result.message;
          console.log("response", result);
        }
      });
    }
  }

  onChangeGuest() {
    if(isPlatformBrowser(this.platformId) && this.commonService.guest_email!=this.guestForm.email.trim()) {
      let cart_list = [];
      if(sessionStorage.getItem("checkout_details")) {
        let checkoutDetails = this.commonService.decryptData(sessionStorage.getItem("checkout_details"));
        if(checkoutDetails.item_list && checkoutDetails.item_list.length) cart_list = checkoutDetails.item_list;
      }
      this.guestForm.submit = true;
      this.api.GUEST_LOGIN({ store_id: this.commonService.store_id, email: this.guestForm.email, cart_list: cart_list }).subscribe(result => {
        this.guestForm.submit = false;
        if(result.status) {
          this.addressForm = { type: 'home', country: this.commonService.store_details.country };
          this.onCountryChange(this.addressForm.country);
          this.address_fields.forEach(elem => {
            delete elem.value;
          });
          sessionStorage.removeItem("checkout_address");
          delete this.guestForm.email_change;
          this.commonService.guest_token = result.token;
          this.commonService.guest_email = this.guestForm.email.trim();
          sessionStorage.setItem("guest_email", this.commonService.encryptData(this.commonService.guest_email));
          sessionStorage.setItem("guest_token", this.commonService.guest_token);
        }
        else {
          this.guestForm.errorMsg = result.message;
          console.log("response", result);
        }
      });
    }
    else delete this.guestForm.email_change;
  }

  // for gift card
  onSelectForGiftcard(x) {
    this.checkout_details.billing_address = x;
    this.api.USER_UPDATE({ checkout_details: this.checkout_details }).subscribe(result => {
      if(result.status) this.router.navigate(['/checkout/giftcard-order-details']);
      else {
        console.log("response", result);
        this.router.navigate(["/"]);
      }
    });
  }

  onOpenAddressModal(modalName) {
    this.addressForm = { type: 'home', country: this.commonService.store_details.country };
    if(!this.list.length) {
      this.addressForm.billing_address = true;
      this.addressForm.shipping_address = true;
    }
    this.onCountryChange(this.addressForm.country);
    modalName.show();
    this.commonService.scrollModalTop(500);
  }
  onAddAddress(modalName) {
    this.address_fields.forEach(element => {
      if(element.value) this.addressForm[element.keyword] = element.value;
    });
    if(this.commonService.ys_features.indexOf('pincode_service')!=-1 && this.commonService.store_properties.pincodes.length && this.commonService.store_properties.pincodes.indexOf(this.addressForm.pincode)==-1) {
      this.addressForm.error_msg = "Service not available for this pincode.";
    }
    else {
      this.addressForm.submit = true;
      this.api.ADD_ADDRESS(this.addressForm).subscribe(result => {
        if(result.status) {
          modalName.hide();
          this.list = result.data.address_list;
          if(this.checkout_details.order_type=='pickup' && this.list.length)
            this.router.navigate(["/checkout/pickup-methods"]);
        }
        else {
          this.addressForm.error_msg = result.message;
          console.log("response", result);
        }
      });
    }
  }

  onCountryChange(x) {
    this.state_list = []; this.address_fields = [];
    delete this.country_details; delete this.mobile_pattern;
    let index = this.commonService.country_list.findIndex(object => object.name==x);
    if(index!=-1) {
      this.country_details = this.commonService.country_list[index];
      this.state_list = this.country_details.states;
      this.addressForm.dial_code = this.country_details.dial_code;
      this.address_fields = this.country_details.address_fields;
      if(this.country_details.mobileno_length) this.mobile_pattern = ".{"+this.country_details.mobileno_length+","+this.country_details.mobileno_length+"}";
    }
  }

}