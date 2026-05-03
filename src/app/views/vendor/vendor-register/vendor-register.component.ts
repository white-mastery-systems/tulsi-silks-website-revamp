import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';

@Component({
    selector: 'app-vendor-register',
    templateUrl: './vendor-register.component.html',
    styleUrls: ['./vendor-register.component.scss'],
    standalone: false
})

export class VendorRegisterComponent implements OnInit {

  vendorForm: any; alert_msg: string;
  success_alert: boolean; pageLoader: boolean;
  state_list: any = [];
  reg_address_fields: any = [];
  pick_address_fields: any = [];

  constructor(private router: Router, private storeApi: StoreApiService, public commonService: CommonService) { }

  ngOnInit(): void {
    delete this.alert_msg; this.pageLoader = true;
    this.vendorForm = {
      company_details: { made_in_home_country: '', shipping_type: 'free' },
      registered_address: { country: this.commonService.store_details?.country },
      pickup_address: { country: this.commonService.store_details?.country }, bank_details: {}
    };
    if(this.commonService.ys_features.indexOf('vendors')==-1) this.router.navigate(['/']);
    else {
      this.commonService.getCountryList().then(() => {
        this.onCountryChange(this.commonService.store_details?.country);
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    }
  }

  onCountryChange(x) {
    let index = this.commonService.country_list.findIndex(object => object.name==x);
    if(index!=-1) {
      let cDetails = this.commonService.country_list[index];
      this.state_list = cDetails.states;
      cDetails.address_fields.forEach(el => {
        this.reg_address_fields.push({ keyword: el.keyword, label: el.label });
        this.pick_address_fields.push({ keyword: el.keyword, label: el.label });
      });
    }
  }

  onSubmit() {
    this.vendorForm.submit = true; delete this.alert_msg;
    this.vendorForm.store_id = this.commonService.store_id;
    this.reg_address_fields.forEach(element => {
      if(element.value) this.vendorForm.registered_address[element.keyword] = element.value;
    });
    this.pick_address_fields.forEach(element => {
      if(element.value) this.vendorForm.pickup_address[element.keyword] = element.value;
    });
    this.storeApi.VENDOR_REGISTER(this.vendorForm).subscribe(result => {
      this.vendorForm.submit = false;
      this.success_alert = result.status;
      if(result.status) {
        this.vendorForm = {
          company_details: { made_in_home_country: '', shipping_type: 'free' },
          registered_address: { country: this.commonService.store_details?.country },
          pickup_address: { country: this.commonService.store_details?.country }, bank_details: {}
        };
        this.alert_msg = "Your request has been submitted successfully";
        setTimeout(() => { this.alert_msg = null; }, 3000);
      }
      else {
        this.alert_msg = result.message;
        console.log("response", result);
      }
    });
  }

}