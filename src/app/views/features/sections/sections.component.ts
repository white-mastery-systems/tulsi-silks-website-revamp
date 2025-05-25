import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { StoreApiService } from '../../../services/store-api.service';

@Component({
  selector: 'app-sections',
  templateUrl: './sections.component.html',
  styleUrls: ['./sections.component.scss']
})

export class SectionsComponent implements OnInit {

  constructor(private storeApi: StoreApiService, public commonService: CommonService) { }

  ngOnInit(): void {
    if(!this.commonService.search_category_list.length) {
        if(this.commonService.menu_list.length) {
          // this.createSearchCategoryList();
        }
        else {
          this.storeApi.STORE_DETAILS().subscribe(result => {
            if(result.status) {
              let storeDetails = JSON.parse(result.store_details);
              this.commonService.menu_list = storeDetails.menu_list;
              // this.createSearchCategoryList();
            }
          });
        }
      }
  }

}