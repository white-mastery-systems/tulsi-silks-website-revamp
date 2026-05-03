import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-stories',
    templateUrl: './stories.component.html',
    styleUrls: ['./stories.component.scss'],
    standalone: false
})

export class StoriesComponent implements OnInit {

  page: number = 1; pageSize: number = 12;
  pageLoader: boolean; list: any = [];
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  tempList: any = [];
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "Web Stories", position: 2, link: "/web-stories" }
  ];
  seoDetails: any = {
    h1_tag: "Webstory Achieve | Tulsi Silks",
    page_title: "Tulsi Silks - Webstory Achieve",
    meta_desc: "Explore the elegance of Tulsa Silks with our curated web stories. Discover exquisite silk sarees, stunning designs, and timeless fashion for every occasion.",
    meta_keywords: []
  };

  constructor(private storeApi: StoreApiService, public commonService: CommonService) {}

  ngOnInit(): void {
    this.pageLoader = true; this.tempList = [];
    let skip = (this.page-1)*this.pageSize;
    this.storeApi.WEBSTORY_LIST(skip, this.pageSize).subscribe(result => {
      if(result.status) {
        this.list = result.list;
        for(let i=0; i<result.count; i++) {
          this.tempList.push("");
        }
      }
      else console.log("response", result);
      setTimeout(() => { this.pageLoader = false; }, 500);
    });
    this.commonService.setSiteMetaData(this.seoDetails, null);
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

}