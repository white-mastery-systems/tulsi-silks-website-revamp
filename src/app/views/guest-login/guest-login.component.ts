import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonService } from '../../services/common.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-guest-login',
  templateUrl: './guest-login.component.html',
  styleUrls: ['./guest-login.component.scss']
})

export class GuestLoginComponent implements OnInit {

  guestForm: any;
  template_setting: any = environment.template_setting;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, public commonService: CommonService, private router: Router, private api: ApiService) { }

  ngOnInit(): void {
    this.guestForm = {};
     // schema
     let bcList = [
      { name: "Home", position: 1, link: "/" },
      { name: "Guest Login", position: 2, link: "/guest-login" }
    ];
    this.commonService.breadCrumbList(bcList);
  }

  onLogin() {
    if(isPlatformBrowser(this.platformId)) {
      let cart_list = []; let checkoutDetails: any = {};
      if(sessionStorage.getItem("checkout_details")) {
        checkoutDetails = this.commonService.decryptData(sessionStorage.getItem("checkout_details"));
        if(checkoutDetails.item_list && checkoutDetails.item_list.length) cart_list = checkoutDetails.item_list;
      }
      this.guestForm.submit = true;
      this.api.GUEST_LOGIN({ store_id: this.commonService.store_id, email: this.guestForm.email, cart_list: cart_list }).subscribe(result => {
        this.guestForm.submit = false;
        if(result.status) {
          this.commonService.guest_token = result.token;
          this.commonService.guest_email = this.guestForm.email.trim();
          sessionStorage.setItem("guest_email", this.commonService.encryptData(this.commonService.guest_email));
          sessionStorage.setItem("guest_token", this.commonService.guest_token);
          if(sessionStorage.getItem("checkout_details"))
            this.router.navigate(["/checkout/address-list/product"]);
          else this.router.navigate([this.commonService.previous_route]);
        }
        else {
          this.guestForm.errorMsg = result.message;
          console.log("response", result);
        }
      });
    }
  }

  onAccountPage(type) {
    if(isPlatformBrowser(this.platformId)) sessionStorage.setItem("account_type", type);
    this.router.navigate(["/account"]);
  }

}