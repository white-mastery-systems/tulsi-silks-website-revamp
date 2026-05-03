import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';

@Component({
    selector: 'app-collections',
    templateUrl: './collections.component.html',
    styleUrls: ['./collections.component.scss'],
    standalone: false
})

export class CollectionsComponent implements OnInit {

  pageLoader: boolean;
  searchField: string;
  selectedIndex: number = 0;
  template_setting: any = environment.template_setting;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "Brands", position: 2, link: "/brands" }
  ];
  
  constructor(private storeApi: StoreApiService, public commonService: CommonService, @Inject(DOCUMENT) private document) { }

  ngOnInit(): void {
    if(this.commonService.ys_features.indexOf('collections')!=-1 && !this.commonService.collection_list.length) {
      this.pageLoader = true;
      this.storeApi.COLLECTIONS().subscribe(result => {
        if(result.status) this.commonService.collection_list = result.list;
        else console.log("response", result);
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    }
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

  scroll(el: HTMLElement) {
    const element = this.document.querySelector('#heading-'+el);
    if (element) element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
  }

}