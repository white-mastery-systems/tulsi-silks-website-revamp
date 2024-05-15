import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-stories',
  templateUrl: './stories.component.html',
  styleUrls: ['./stories.component.scss']
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
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

}