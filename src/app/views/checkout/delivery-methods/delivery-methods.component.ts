import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-delivery-methods',
  templateUrl: './delivery-methods.component.html',
  styleUrls: ['./delivery-methods.component.scss']
})

export class DeliveryMethodsComponent implements OnInit {

  pageLoader: boolean; btnLoader: boolean;
  checkout_details: any = {};
  list: any = [];
  selected_day: any; selected_slot: any;
  dayIndex: number = -1;
  delivery_id: string;
  template_setting: any = environment.template_setting;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private api: ApiService, private storeApi: StoreApiService,
    private router: Router, public cc: CurrencyConversionService, public commonService: CommonService, private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    if(this.commonService.ys_features.indexOf('time_based_delivery')!=-1) {
      this.pageLoader = true; this.btnLoader = false;
      // delivery methods
      this.storeApi.DELIVERY_METHODS().subscribe(result => {
        setTimeout(() => { this.pageLoader = false; }, 500);
        if(result.status) {
          this.delivery_id = result.data._id;
          let availableWeekDays = result.data.available_days;
          let deliveryList = [];
          let filteredDeliveryMethods = result.data.list.filter(obj => obj.status=='active');
          filteredDeliveryMethods.forEach(list => {
            let daysCount = list.following_days+1;
            for(let i=0; i<daysCount; i++) {
              let newSlotList = [];
              let filteredGroups = list.groups.filter(obj => obj.status=='active');
              filteredGroups.forEach((group, index) => {
                let delayDays = 0; let delayHours = 0;
                if(group.delay_type=='hour') delayHours = group.delay_duration;
                if(group.delay_type=='day' && group.delay_duration>0) {
                  let orderTime = new Date().toLocaleString('en-US', { day: '2-digit', month: 'numeric', year: 'numeric' })+" "+group.order_time;
                  if(new Date() >= new Date(orderTime)) delayDays = group.delay_duration;
                  else delayDays = group.delay_duration - 1;
                }
                let filteredSlots = group.slots.filter(obj => obj.status=='active');
                if(i < delayDays) {
                  if(delayDays==0) {
                    if(group.status=='active') {
                      filteredSlots.forEach(slotData => {
                        slotData.delay_hrs = delayHours;
                        newSlotList.push(slotData);
                      });
                    }
                  }
                  else delayDays--;
                }
                else {
                  filteredSlots.forEach(slotData => {
                    slotData.delay_hrs = delayHours;
                    newSlotList.push(slotData);
                  });
                }
              });
              deliveryList.push({ name: list.name, slots: newSlotList });
            }
          });
          this.createList(deliveryList, availableWeekDays).then((resp) => {
            this.list = [];
            if(resp.findIndex(obj => obj.slots.length) != -1) this.list = resp;
            this.dayIndex = this.list.findIndex(obj => obj.slots.length && obj.available && obj.slots.findIndex(object => object.available)!=-1);
            if(this.dayIndex!=-1) {
              this.selected_day = this.list[this.dayIndex];
              let slotIndex = this.list[this.dayIndex].slots.findIndex(obj => obj.available);
              this.selected_slot = this.list[this.dayIndex].slots[slotIndex];
            }
          });
        }
        else console.log("response", result);
      });
      // user details
      if(this.commonService.customer_token) {
        this.api.USER_DETAILS().subscribe(result => {
          if(result.status && result.data.checkout_details) {
            this.checkout_details = result.data.checkout_details;
            if(!this.checkout_details.item_list || !this.checkout_details.shipping_address) this.router.navigate(["/"]);
          }
          else {
            console.log("response", result);
            this.router.navigate(["/"]);
          }
        });
      }
      else if(isPlatformBrowser(this.platformId) && sessionStorage.getItem("checkout_details")) {
        this.checkout_details = this.commonService.decryptData(sessionStorage.getItem("checkout_details"));
        if(!this.checkout_details.item_list || !this.checkout_details.shipping_address) this.router.navigate(["/"]);
      }
      else this.router.navigate(["/"]);
    }
    else this.router.navigate(["/"]);
  }

  dayChange(day) {
    this.selected_day = day;
    let slotIndex = this.selected_day.slots.findIndex(obj => obj.available);
    this.selected_slot = this.selected_day.slots[slotIndex];
  }

  onConfirm() {
    this.btnLoader = true;
    let deliveryDate = this.datePipe.transform(this.selected_day.date, 'dd MMM y')+" ("+this.selected_day.day+")";
    let deliveryTime = this.datePipe.transform(this.selected_slot.from, 'hh:mm a')+" - "+this.datePipe.transform(this.selected_slot.to, 'hh:mm a');
    let sendData: any = {
      sid: this.commonService.session_id, shipping_address: this.checkout_details.shipping_address._id,
      order_type: this.checkout_details.order_type, currency_type: this.commonService.selected_currency.country_code,
      shipping_method: {
        _id: this.delivery_id, delivery_date: deliveryDate, delivery_time: deliveryTime, shipping_price: this.selected_slot.price
      }
    };
    sendData.item_list = this.commonService.getItemList(this.checkout_details.item_list);
    if(this.checkout_details.quick_order_id) sendData.quick_order_id = this.checkout_details.quick_order_id;
    this.api.DELIVERY_DETAILS(sendData).subscribe(result => {
      if(result.status) {
        this.checkout_details.shipping_method = result.data.shipping_method;
        if(this.commonService.customer_token) {
          this.api.USER_UPDATE({ checkout_details: this.checkout_details }).subscribe(result => {
            if(result.status) this.router.navigate(["checkout/product-order-details"]);
            else {
              console.log("response", result);
              this.router.navigate(["/"]);
            }
          });
        }
        else {
          if(isPlatformBrowser(this.platformId)) sessionStorage.setItem("checkout_details", this.commonService.encryptData(this.checkout_details));
          this.router.navigate(["checkout/product-order-details"]);
        }
      }
      else {
        console.log("response", result);
        this.router.navigate(["/"]);
      }
    });
  }

  async createList(deliveryList, availableWeekDays) {
    let updatedList = [];
    for(let i=0; i<deliveryList.length; i++) {
      deliveryList[i].day_value = "";
      if(i==0) { deliveryList[i].day_value = "Today"; }
      if(i==1) { deliveryList[i].day_value = "Tomorrow"; }
      let deliveryDate = new Date().setDate(new Date().getDate()+i);
      let availableDayIndex = availableWeekDays.findIndex(obj => obj.code==new Date(deliveryDate).getDay());
      deliveryList[i].day = availableWeekDays[availableDayIndex].day;
      deliveryList[i].date = deliveryDate;
      deliveryList[i].slots = await this.processSlot(deliveryDate, deliveryList[i].slots);
      deliveryList[i].available = false;
      if(availableWeekDays[availableDayIndex].active && deliveryList[i].slots.findIndex(obj => obj.available)!=-1) deliveryList[i].available = true;
      updatedList.push(deliveryList[i]);
    }
    return updatedList;
  }

  processSlot(deliveryDate, slotList) {
    return new Promise((resolve, reject) => {
      let updatedSlotList = [];
      let bookingDay = new Date(deliveryDate).toLocaleString('en-US', { day: '2-digit', month: 'numeric', year: 'numeric' });
      for(let slot of slotList) {
        let restrictDate = new Date().setHours(new Date().getHours()+slot.delay_hrs);
        let fromTime: any = new Date(bookingDay+" "+slot.from_time).getTime();
        let toTime: any = new Date(bookingDay+" "+slot.to_time).getTime();
        let tempPrice = this.cc.CALC(slot.price);
        if(restrictDate <= fromTime) updatedSlotList.push({ from: fromTime, to: toTime, price: slot.price, temp_price: tempPrice, available: true });
        else updatedSlotList.push({ from: fromTime, to: toTime, price: slot.price, temp_price: tempPrice, available: false });
      }
      resolve(updatedSlotList);
    });
  }

}