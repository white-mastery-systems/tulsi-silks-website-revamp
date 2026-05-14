import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-store-locator',
    templateUrl: './store-locator.component.html',
    styleUrls: ['./store-locator.component.scss'],
    standalone: false
})

export class StoreLocatorComponent implements OnInit, OnDestroy {

  pageLoader: boolean;
  template_setting: any = environment.template_setting;

  constructor(private sanitizer: DomSanitizer, private storeApi: StoreApiService, public commonService: CommonService) { }

  ngOnInit(): void {
    if(this.commonService.ys_features.indexOf('store_locator')!=-1 && !this.commonService.store_locations) {
      this.pageLoader = true;
      this.storeApi.LOCATIONS().subscribe(result => {
        setTimeout(() => { this.pageLoader = false; }, 500);
        if(result.status) {
          this.commonService.store_locations = result.data;
          this.commonService.store_locations.location_list.forEach((obj: any) => {
            obj.map_url = this.sanitizer.bypassSecurityTrustResourceUrl(obj.map_url);
            obj.address = this.commonService.transformHtml(obj.address);
          });
        }
        else {
          console.log("response", result);
          this.commonService.store_locations = {};
        }
      });
    }
    // LocalBusiness schema
    const locSchema = {
      "@context": "https://schema.org",
      "@type": "ClothingStore",
      "@id": this.commonService.origin + "/#localbusiness",
      "name": "Tulsi Silks",
      "url": this.commonService.origin,
      "telephone": "+918072444353",
      "email": "orders@tulsisilks.com",
      "image": this.commonService.origin + "/assets/images/logo.png",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "68, Luz Church Rd, CIT Colony, Mylapore",
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "postalCode": "600004",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 13.037926566822968,
        "longitude": 80.26039417116382
      },
      "hasMap": "https://maps.google.com/?q=13.037926566822968,80.26039417116382",
      "openingHoursSpecification": [{
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:30",
        "closes": "19:30"
      }],
      "sameAs": [
        "https://www.facebook.com/TulsiSilks/",
        "https://x.com/tulsisilks",
        "https://www.instagram.com/tulsisilks/?hl=en",
        "https://in.pinterest.com/tulsisilks0070/"
      ]
    };
    this.commonService.createJsonLD('store-locator-jsonld', locSchema);
    // Breadcrumb
    this.commonService.breadCrumbList([
      { name: "Home", position: 1, link: "/" },
      { name: "Store Locator", position: 2, link: "/store-locator" }
    ]);
  }

  ngOnDestroy(): void {
    this.commonService.removeElement('store-locator-jsonld');
  }

}