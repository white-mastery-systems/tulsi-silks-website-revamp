import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-policy',
    templateUrl: './policy.component.html',
    styleUrls: ['./policy.component.scss'],
    standalone: false
})

export class PolicyComponent implements OnInit {

  pageLoader: boolean; policy_details: any;
  template_setting: any = environment.template_setting;

  constructor(private router: Router, private commonService: CommonService, private storeApi: StoreApiService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    let pageName = "";
    if(this.router.url=="/privacy-policy") {
      pageName = "Privacy Policy";
      if(!this.commonService.privacy_policy) {
        this.pageLoader = true;
        this.storeApi.POLICY_DETAILS("privacy").subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) {
            this.commonService.privacy_policy = result.data;
            this.commonService.privacy_policy.content = this.sanitizer.bypassSecurityTrustHtml(this.commonService.privacy_policy.content);
          }
          else {
            console.log("response", result);
            this.commonService.privacy_policy = { title: "Privacy Policy", content: "" };
          }
          this.policy_details = this.commonService.privacy_policy;
        });
      }
      else this.policy_details = this.commonService.privacy_policy;
    }
    if(this.router.url=="/shipping-policy") {
      pageName = "Shipping Policy";
      if(!this.commonService.shipping_policy) {
        this.pageLoader = true;
        this.storeApi.POLICY_DETAILS("shipping").subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) {
            this.commonService.shipping_policy = result.data;
            this.commonService.shipping_policy.content = this.sanitizer.bypassSecurityTrustHtml(this.commonService.shipping_policy.content);
          }
          else {
            console.log("response", result);
            this.commonService.shipping_policy = { title: "Shipping Policy", content: "" };
          }
          this.policy_details = this.commonService.shipping_policy;
        });
      }
      else this.policy_details = this.commonService.shipping_policy;
    }
    else if(this.router.url=="/cancellation-policy") {
      pageName = "Cancellation Policy";
      if(!this.commonService.cancellation_policy) {
        this.pageLoader = true;
        this.storeApi.POLICY_DETAILS("cancellation").subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) {
            this.commonService.cancellation_policy = result.data;
            this.commonService.cancellation_policy.content = this.sanitizer.bypassSecurityTrustHtml(this.commonService.cancellation_policy.content);
          }
          else {
            console.log("response", result);
            this.commonService.cancellation_policy = { title: "Cancellation Policy", content: "" };
          }
          this.policy_details = this.commonService.cancellation_policy;
        });
      }
      else this.policy_details = this.commonService.cancellation_policy;
    }
    else if(this.router.url=="/terms-and-conditions") {
      pageName = "Terms and Conditions";
      if(!this.commonService.terms_conditions) {
        this.pageLoader = true;
        this.storeApi.POLICY_DETAILS("terms_conditions").subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) {
            this.commonService.terms_conditions = result.data;
            this.commonService.terms_conditions.content = this.sanitizer.bypassSecurityTrustHtml(this.commonService.terms_conditions.content);
          }
          else {
            console.log("response", result);
            this.commonService.terms_conditions = { title: "Terms & Conditions", content: "" };
          }
          this.policy_details = this.commonService.terms_conditions;
        });
      }
      else this.policy_details = this.commonService.terms_conditions;
    }
    // schema
    let bcList = [
      { name: "Home", position: 1, link: "/" },
      { name: pageName, position: 2, link: this.router.url.split('?')[0] }
    ];
    this.commonService.breadCrumbList(bcList);
  }

}