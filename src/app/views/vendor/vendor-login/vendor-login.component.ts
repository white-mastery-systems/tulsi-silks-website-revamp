import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-vendor-login',
  templateUrl: './vendor-login.component.html'
})

export class VendorLoginComponent implements OnInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private commonService: CommonService) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platformId)) {
      window.location.href = "https://yourstore.io/login/vendor/signin/"+this.commonService.store_id;
    }
  }

}