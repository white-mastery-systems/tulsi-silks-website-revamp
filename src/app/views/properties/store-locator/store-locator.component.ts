import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-store-locator',
  templateUrl: './store-locator.component.html',
  styleUrls: ['./store-locator.component.scss']
})

export class StoreLocatorComponent implements OnInit {

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
          this.commonService.store_locations.location_list.forEach(obj => {
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
    // schema
    let bcList = [
      { name: "Home", position: 1, link: "/" },
      { name: "Store Locator", position: 2, link: "/store-locator" }
    ];
    this.commonService.breadCrumbList(bcList);
  }

}