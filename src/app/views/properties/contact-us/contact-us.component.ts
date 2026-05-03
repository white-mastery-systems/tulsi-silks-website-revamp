import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-contact-us',
    templateUrl: './contact-us.component.html',
    styleUrls: ['./contact-us.component.scss'],
    standalone: false
})

export class ContactUsComponent implements OnInit {

  contactForm: any = {}; pageLoader: boolean;
  alert_msg: string; success_alert: boolean;
  template_setting: any = environment.template_setting;
  seoDetails: any = {
    h1_tag: "Contact Tulsi Silks",
    page_title: "Contact -Tulsi Silks | Best Sarees for Wedding",
    meta_desc: "Elegance meets tradition at Tulsi Silks. Contact us for inquiries, collaborations, or shop online. Let's weave stories together",
    meta_keywords: []
  };
  businessSchema: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Tulsi Silks",
    "image": "https://yourstore.io/api/uploads/5d30013a5c83a702392c4c8b/logo.png?v=20241016221",
    "@id": "https://tulsisilks.co.in/",
    "url": "https://tulsisilks.co.in/",
    "telephone": "044 24991086",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "68, Luz Church Rd, Mylapore",
      "addressLocality": "Chennai",
      "postalCode": "600004",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 13.037742798998826,
      "longitude": 80.26028970552234
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:30",
      "closes": "19:30"
    },
    "sameAs": [
      "https://www.facebook.com/TulsiSilks/",
      "https://twitter.com/tulsisilks",
      "https://www.instagram.com/tulsisilks/",
      "https://in.pinterest.com/tulsisilks0070/"
    ] 
  };

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
    this.commonService.setSiteMetaData(this.seoDetails, null);
    // business schema
    this.commonService.createJsonLD("business-jsonld", this.businessSchema);
    // breadcrumb schema
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

  ngOnDestroy() {
    this.commonService.removeElement('business-jsonld');
  }

}