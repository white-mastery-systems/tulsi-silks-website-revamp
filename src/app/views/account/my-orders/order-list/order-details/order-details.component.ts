import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ApiService } from '../../../../../services/api.service';
import { CommonService } from '../../../../../services/common.service';
import { CurrencyConversionService } from '../../../../../services/currency-conversion.service';
import { environment } from '../../../../../../environments/environment';

@Component({
    selector: 'app-order-details',
    templateUrl: './order-details.component.html',
    styleUrls: ['./order-details.component.scss'],
    standalone: false
})

export class OrderDetailsComponent implements OnInit {

  pageLoader: boolean;
  params: any; details: any = {};
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  cancelForm: any = {}; cancellationExist: boolean;
  itemInfo: any = {};

  constructor(
    private activeRoute: ActivatedRoute, private api: ApiService, private router: Router,
    public commonService: CommonService, public cc: CurrencyConversionService
  ) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.params = params; this.pageLoader = true;
      this.api.ORDER_DETAILS(this.params.order_id).subscribe(result => {
        if(result.status) {
          if(this.params.vendor_id) {
            let orderDetails = result.data;
            let vIndex = orderDetails.vendor_list.findIndex(obj => obj.vendor_id==this.params.vendor_id);
            if(vIndex!=-1) {
              this.details = orderDetails.vendor_list[vIndex];
              this.details._id = orderDetails._id;
              this.details.created_on = orderDetails.created_on;
              this.details.order_type = orderDetails.order_type;
              this.details.currency_type = orderDetails.currency_type;
              this.details.payment_details = orderDetails.payment_details;
              this.details.shipping_address = orderDetails.shipping_address;
              this.details.item_list = orderDetails.item_list.filter(obj => obj.vendor_id==this.params.vendor_id);
              this.processOrder();
            }
            else console.log("Invalid order");
          }
          else {
            this.details = result.data;
            this.processOrder();
          }
        }
        else console.log("response", result);
      });
    });
  }

  processOrder() {
    setTimeout(() => { this.pageLoader = false; }, 500);
    let countryInr = this.details.currency_type.country_inr_value;
    this.details.sub_total = (this.details.sub_total/countryInr).toFixed(2);
    this.details.gift_wrapper = (this.details.gift_wrapper/countryInr).toFixed(2);
    this.details.packaging_charges = (this.details.packaging_charges/countryInr).toFixed(2);
    this.details.shipping_cost = (this.details.shipping_cost/countryInr).toFixed(2);
    this.details.cod_charges = (this.details.cod_charges/countryInr).toFixed(2);
    this.details.discount_amount = (this.details.discount_amount/countryInr).toFixed(2);
    this.details.final_price = (this.details.final_price/countryInr).toFixed(2);
    for(let product of this.details.item_list) {
      if(!product.item_status) this.cancellationExist = true;
      if(product.unit!='Pcs') product.final_price = (((product.final_price*product.quantity)+product.addon_price)/countryInr).toFixed(2);
      else product.final_price = ((product.final_price*product.quantity)/countryInr).toFixed(2);
    }
  }

  onViewInvoice() {
    let routerUrl = '/account/my-orders/invoice/order/'+this.details._id;
    if(this.details.vendor_id) routerUrl = routerUrl+'/'+this.details.vendor_id;
    this.router.navigate([routerUrl]);
  }

  cancelOrder(modalName) {
    let cancelItems = [];
    this.details.item_list.forEach(obj => {
      if(obj.item_checked) cancelItems.push(obj._id);
    });
    if(cancelItems.length) {
      this.cancelForm.submit = true;
      let cancelInfo = { title: this.cancelForm.title, description: this.cancelForm.description, request_on: new Date() };
      this.api.CANCEL_ORDER({ _id: this.details._id, item_list: cancelItems, cancel_info: cancelInfo }).subscribe(result => {
        this.cancelForm.submit = false;
        if(result.status) {
          modalName.hide();
          this.ngOnInit();
        }
        else {
          console.log("response", result);
          this.cancelForm.error_msg = result.message;
        }
      });
    }
    else this.cancelForm.error_msg = "Please select minimum one item";
  }

}