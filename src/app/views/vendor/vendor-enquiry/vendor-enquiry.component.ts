import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-vendor-enquiry',
  templateUrl: './vendor-enquiry.component.html',
  styleUrls: ['./vendor-enquiry.component.scss']
})

export class VendorEnquiryComponent implements OnInit {

  contactForm: any;
  alert_msg: string
  success_alert: boolean;

  constructor(private router: Router, private storeApi: StoreApiService, public commonService: CommonService) { }

  ngOnInit(): void {
    delete this.alert_msg;
    this.contactForm = {};
    if(this.commonService.ys_features.indexOf('vendors')==-1) this.router.navigate(['/']);
    // schema
    let bcList = [
      { name: "Home", position: 1, link: "/" },
      { name: "Vendor Enquiry", position: 2, link: "/vendor-enquiry" }
    ];
    this.commonService.breadCrumbList(bcList);
  }

  onSubmit() {
    this.contactForm.submit = true;
    this.contactForm.store_id = this.commonService.store_id;
    this.contactForm.subject = "New Vendor Enquiry";
    this.storeApi.VENDOR_ENQUIRY(this.contactForm).subscribe(result => {
      this.contactForm.submit = false;
      this.contactForm = {};
      this.success_alert = result.status;
      if(result.status) this.alert_msg = "Your enquiry submitted successfully";
      else {
        this.alert_msg = "Network error, try again later";
        console.log("response", result);
      }
      setTimeout(() => { this.alert_msg = null; }, 3000);
    });
  }

}