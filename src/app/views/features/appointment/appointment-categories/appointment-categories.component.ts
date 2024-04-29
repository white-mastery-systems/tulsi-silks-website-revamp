import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { CommonService } from '../../../../services/common.service';
import { StoreApiService } from '../../../../services/store-api.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';

@Component({
  selector: 'app-appointment-categories',
  templateUrl: './appointment-categories.component.html',
  styleUrls: ['./appointment-categories.component.scss']
})

export class AppointmentCategoriesComponent implements OnInit {

  list: any = [];
  pageLoader: boolean; parmas: any;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;

  constructor(
    private router: Router, private storeApi: StoreApiService,
    public cc: CurrencyConversionService, public commonService: CommonService
  ) { }

  ngOnInit(): void {
    if(this.commonService.ys_features.indexOf('appointment_scheduler')!=-1) {
      if(Object.entries(this.commonService.appointment_cat_page_attr).length) {
        this.list = this.commonService.appointment_cat_page_attr.list;
        let scrollPos = this.commonService.appointment_cat_page_attr.scroll_y_pos;
        setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
        this.commonService.appointment_cat_page_attr.scroll_y_pos = 0;
      }
      else {
        this.pageLoader = true;
        this.storeApi.APPOINTMENT_CATEGORIES().subscribe(result => {
          if(result.status) this.list = result.list;
          else console.log("response", result);
          setTimeout(() => { this.pageLoader = false; }, 500);
        });
      }
    }
  }

  onSelect(x) {
    this.commonService.appointment_cat_page_attr = { name: x.name, list: this.list, scroll_y_pos: this.commonService.scroll_y_pos };
    this.router.navigate(["/services/"+x.page_url]);
  }

}