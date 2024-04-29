import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CommonService } from '../../../../services/common.service';
import { StoreApiService } from '../../../../services/store-api.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';

@Component({
  selector: 'app-appointment-services',
  templateUrl: './appointment-services.component.html',
  styleUrls: ['./appointment-services.component.scss']
})

export class AppointmentServicesComponent implements OnInit {

  list: any = [];
  pageLoader: boolean; parmas: any;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  subscription: Subscription;

  constructor(
    private router: Router, private storeApi: StoreApiService, private activeRoute: ActivatedRoute,
    public cc: CurrencyConversionService, public commonService: CommonService
  ) {
    this.subscription = this.commonService.currency_type.subscribe(currency => {
      this.findCurrency();
    });
  }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.parmas = params;
      if(this.commonService.ys_features.indexOf('appointment_scheduler')!=-1) {
        if(Object.entries(this.commonService.appointment_page_attr).length && this.commonService.appointment_page_attr.page_url==this.parmas.category) {
          this.list = this.commonService.appointment_page_attr.list;
          this.findCurrency();
          let scrollPos = this.commonService.appointment_page_attr.scroll_y_pos;
          setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
          this.commonService.appointment_page_attr.scroll_y_pos = 0;
        }
        else {
          this.pageLoader = true;
          this.storeApi.APPOINTMENT_SERVICES(this.parmas.category).subscribe(result => {
            if(result.status) {
              this.list = result.list;
              this.commonService.appointment_page_attr = { list: this.list, page_url: this.parmas.category, scroll_y_pos: 0 };
              this.findCurrency();
            }
            else console.log("response", result);
            setTimeout(() => { this.pageLoader = false; }, 500);
          });
        }
      }
    });
  }

  onSelect(x) {
    if(this.commonService.customer_token) {
      // set page attributes
      this.commonService.appointment_page_attr = { list: this.list, page_url: this.parmas.category, scroll_y_pos: this.commonService.scroll_y_pos };
      this.router.navigate([this.router.url+"/"+x._id]);
    }
    else {
      this.commonService.after_login_event = { redirect: this.router.url+"/"+x._id };
      this.router.navigate(["/account"]);
    }
  }

  findCurrency() {
    for(let service of this.list) {
      service.temp_price = this.cc.CALC_WO_AC(service.price);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}