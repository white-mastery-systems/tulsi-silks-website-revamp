import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})

export class ContactUsComponent implements OnInit {

  contactForm: any = {}; pageLoader: boolean;
  alert_msg: string; success_alert: boolean;
  template_setting: any = environment.template_setting;

  constructor(private sanitizer: DomSanitizer, private storeApi: StoreApiService, public commonService: CommonService) { }

  ngOnInit(): void {
    this.alert_msg = null; this.contactForm = {};
    if(!this.commonService.contact_page_info) {
      this.pageLoader = true;
      this.storeApi.CONTACT_PAGE_INFO().subscribe(result => {
        setTimeout(() => { this.pageLoader = false; }, 500);
        if(result.status) {
          this.commonService.contact_page_info = result.data;
          if(this.commonService.contact_page_info.map_url) {
            this.commonService.contact_page_info.map_url = this.sanitizer.bypassSecurityTrustResourceUrl(this.commonService.contact_page_info.map_url);
          }
        }
        else {
          console.log("response", result);
          this.commonService.contact_page_info = {};
        }
      });
    }
    // schema
    let bcList = [
      { name: "Home", position: 1, link: "/" },
      { name: "Contact Us", position: 2, link: "/contact-us" }
    ];
    this.commonService.breadCrumbList(bcList);
  }

  onSubmit() {
    this.contactForm.submit = true;
    this.contactForm.store_id = this.commonService.store_id;
    this.contactForm.subject = "New Enquiry";
    this.storeApi.CONTACT_US(this.contactForm).subscribe(result => {
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