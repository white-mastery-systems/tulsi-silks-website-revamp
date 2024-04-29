import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-extra-page',
  templateUrl: './extra-page.component.html',
  styleUrls: ['./extra-page.component.scss']
})

export class ExtraPageComponent implements OnInit {

  pageLoader: boolean; details: any;
  template_setting: any = environment.template_setting;
  bcList: any = [];

  constructor(private router: Router, private activeRoute: ActivatedRoute, private storeApi: StoreApiService, private commonService: CommonService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      if(this.commonService.extra_pages[params['type']]) {
        this.details = this.commonService.extra_pages[params['type']];
        if(this.details.seo_status) this.commonService.setSiteMetaData(this.details.seo_details, null);
      }
      else if(this.commonService.ys_features.indexOf('extra_pages')!=-1) {
        this.pageLoader = true;
        this.storeApi.EXTRA_PAGE(params['type']).subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          if(result.status) {
            this.details = result.data;
            this.details.content = this.sanitizer.bypassSecurityTrustHtml(this.details.content);
            this.commonService.extra_pages[params['type']] = this.details;
            if(this.details.seo_status) this.commonService.setSiteMetaData(this.details.seo_details, null);
          }
          else {
            console.log("response", result);
            this.router.navigate(['/404']);
          }
        });
      }
      else this.router.navigate(['/']);
    });
    // schema
    this.bcList = [
      { name: "Home", position: 1, link: "/" },
      { name: this.details.name, position: 2, link: this.router.url.split('?')[0] }
    ];
    this.commonService.breadCrumbList(this.bcList);
  }

}