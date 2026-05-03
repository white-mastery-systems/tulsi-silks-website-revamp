import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { WishlistService } from '../../../../services/wishlist.service';
import { CartlistService } from '../../../../services/cartlist.service';
import { CommonService } from '../../../../services/common.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-user-info',
    templateUrl: './user-info.component.html',
    styleUrls: ['./user-info.component.scss'],
    standalone: false
})
export class UserInfoComponent implements OnInit {

  pageLoader: boolean;
  customer_details: any = {};
  pwdForm: any = {};
  template_setting: any = environment.template_setting;
  mobile_pattern: any; mobileno_length: any;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "My Account", position: 2, link: "/account" },
    { name: "My Profile", position: 3, link: "/account/profile" },
    { name: "Profile Info", position: 4, link: "/account/profile/info" }
  ];
  
  constructor(
    public commonService: CommonService, private api: ApiService, private router: Router,
    private wishService: WishlistService, private cartService: CartlistService
  ) { }

  ngOnInit(): void {
    this.pageLoader = true;
    this.api.USER_DETAILS().subscribe(result => {
      if(result.status) {
        this.customer_details = result.data;
        this.commonService.user_details = {
          name: result.data.name, email: result.data.email,
          dial_code: result.data.dial_code, mobile: result.data.mobile
        };
        if(result.data.gst) this.commonService.user_details.gst = result.data.gst;
        localStorage.setItem("user_details", this.commonService.encryptData(this.commonService.user_details));
      }
      else console.log("response", result);
      setTimeout(() => { this.pageLoader = false; }, 500);
    });
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

  onUpdateName(x) {
    this.customer_details.name_update = true;
    if(this.commonService.user_details.name!=x.name) {
      this.api.USER_UPDATE(x).subscribe((result) => {
        delete this.customer_details.name_change; this.customer_details.name_update = false;
        if(result.status) {
          this.customer_details = result.data;
          this.commonService.user_details = {
            name: result.data.name, email: result.data.email,
            dial_code: result.data.dial_code, mobile: result.data.mobile
          };
          if(result.data.gst) this.commonService.user_details.gst = result.data.gst;
          localStorage.setItem("user_details", this.commonService.encryptData(this.commonService.user_details));
        }
        else console.log("response", result);
      });
    }
    else {
      delete this.customer_details.name_change; this.customer_details.name_update = false;
    }
  }

  onEditMobile() {
    delete this.customer_details.errorMsg;
    this.customer_details.mobile_change = true;
    delete this.mobileno_length; delete this.mobile_pattern;
    this.commonService.getCountryList().then(() => {
      if(!this.customer_details.dial_code) {
        let index = this.commonService.country_list.findIndex(object => object.name==this.commonService.store_details.country);
        if(index!=-1) {
          this.customer_details.dial_code = this.commonService.country_list[index].dial_code;
          this.onDialCodeChange(this.customer_details.dial_code);
        }
      }
      else this.onDialCodeChange(this.customer_details.dial_code);
    });
  }
  onUpdateMobile(x) {
    this.customer_details.mobile_update = true;
    if(this.commonService.user_details.dial_code!=x.dial_code || this.commonService.user_details.mobile!=x.mobile) {
      this.api.UPDATE_USER_MOBILE(x).subscribe((result) => {
        delete this.customer_details.mobile_change; this.customer_details.mobile_update = false;
        if(result.status) {
          this.customer_details = result.data;
          this.commonService.user_details = {
            name: result.data.name, email: result.data.email,
            dial_code: result.data.dial_code, mobile: result.data.mobile
          };
          if(result.data.gst) this.commonService.user_details.gst = result.data.gst;
          localStorage.setItem("user_details", this.commonService.encryptData(this.commonService.user_details));
        }
        else {
          console.log("response", result);
          this.customer_details.errorMsg = result.message;
        }
      });
    }
    else {
      delete this.customer_details.mobile_change; this.customer_details.mobile_update = false;
    }
  }

  onChangePwd(modalName) {
    this.pwdForm.submit = true;
    this.api.CHANGE_PWD(this.pwdForm).subscribe((result) => {
      this.pwdForm.submit = false;
      if(result.status) {
        modalName.hide();
        localStorage.removeItem("customer_token");
        delete this.commonService.customer_token;
        this.wishService.resetWishList([]);
        this.cartService.resetCartList([]);
        this.router.navigate(['/account']);
      }
      else {
        this.pwdForm.errorMsg = result.message;
        console.log("response", result);
      }
    });
  }

  onDialCodeChange(x) {
    delete this.mobileno_length; delete this.mobile_pattern;
    let index = this.commonService.country_list.findIndex(object => object.dial_code==x);
    if(index!=-1) {
      let countryDetails = this.commonService.country_list[index];
      if(countryDetails.mobileno_length) {
        this.mobileno_length = countryDetails.mobileno_length;
        this.mobile_pattern = ".{"+countryDetails.mobileno_length+","+countryDetails.mobileno_length+"}";
      }
    }
  }

}