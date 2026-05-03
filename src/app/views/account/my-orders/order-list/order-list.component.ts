import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { CommonService } from '../../../../services/common.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-order-list',
    templateUrl: './order-list.component.html',
    styleUrls: ['./order-list.component.scss'],
    standalone: false
})

export class OrderListComponent implements OnInit {

  pageLoader: boolean;
  params: any; list: any = [];
  page: number; pageSize: number;
  template_setting: any = environment.template_setting;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "My Account", position: 2, link: "/account" },
    { name: "My Orders", position: 3, link: "/account/my-orders" },
    { name: "", position: 4, link: this.router.url.split('?')[0] }
  ];

  constructor(
    private activeRoute: ActivatedRoute, private api: ApiService, public commonService: CommonService,
    public cc: CurrencyConversionService, private router: Router
  ) { }

  ngOnInit(): void {
    this.pageLoader = true;
    this.activeRoute.params.subscribe((params: Params) => {
      this.params = params; this.page = 1; this.pageSize = 10; this.list = [];
      this.api.ORDER_LIST(this.params.type).subscribe(result => {
        if(result.status) {
          for(let order of result.list) {
            if(order.vendor_list?.length) {
              for(let vendor of order.vendor_list) {
                vendor._id = order._id;
                vendor.created_on = order.created_on;
                vendor.order_type = order.order_type;
                vendor.currency_type = order.currency_type;
                vendor.payment_details = order.payment_details;
                vendor.shipping_address = order.shipping_address;
                vendor.item_list = order.item_list.filter(obj => obj.vendor_id==vendor.vendor_id);
                vendor.temp_final_price = (vendor.final_price/vendor.currency_type.country_inr_value).toFixed(2);
                if(this.params.type=='live') {
                  if(vendor.order_status!='delivered' && vendor.order_status!='cancelled') this.list.push(vendor);
                }
                else {
                  if(vendor.order_status==this.params.type) this.list.push(vendor);
                }
              }
            }
            else {
              order.temp_final_price = (order.final_price/order.currency_type.country_inr_value).toFixed(2);
              this.list.push(order);
            }
          }
        }
        else console.log("response", result);
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
      // schema
      this.commonService.breadCrumbList(this.bcList);
    });
  }

  onViewOrder(x) {
    let routerUrl = '/account/my-orders/order-list/'+this.params.type+'/'+x._id;
    if(x.vendor_id) routerUrl = routerUrl+'/'+x.vendor_id;
    this.router.navigate([routerUrl]);
  }

}