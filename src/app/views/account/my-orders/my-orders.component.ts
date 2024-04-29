import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})

export class MyOrdersComponent {

  template_setting: any = environment.template_setting;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "My Account", position: 2, link: "/account" },
    { name: "My Orders", position: 3, link: "/account/my-orders" }
  ];

  constructor(public commonService: CommonService) {
    delete this.commonService.order_search;
    delete this.commonService.coupon_search;
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

}