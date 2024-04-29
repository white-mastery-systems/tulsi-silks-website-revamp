import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class CurrencyConversionService {

  currency: any;
  format: any = environment.template_setting.currency_format;

  constructor(private commonService: CommonService) { }

  CALC(price) {
    if(!price) price = 0;
    if(this.commonService.selected_currency) {
      this.currency = this.commonService.selected_currency;
      let additonalCost: any = 0;
      if(this.currency.additional_charges > 0) {
        let percentage = this.currency.additional_charges/100;
        additonalCost = price*percentage;
      }
      let totalPrice: any = parseFloat(price)+parseFloat(additonalCost);
      let finalPrice = (totalPrice/this.currency.country_inr_value).toFixed(2);
      return parseFloat(finalPrice);
    }
    else return 0;
  }

  CALC_INR_WITH_AC(price) {
    if(!price) price = 0;
    if(this.commonService.selected_currency) {
      this.currency = this.commonService.selected_currency;
      let additonalCost: any = 0;
      if(this.currency.additional_charges > 0) {
        let percentage = this.currency.additional_charges/100;
        additonalCost = price*percentage;
      }
      let totalPrice: any = parseFloat(price)+parseFloat(additonalCost);
      return parseFloat((totalPrice).toFixed(2));
    }
    else return 0;
  }

  CALC_WO_AC(price) {
    if(!price) price = 0;
    if(this.commonService.selected_currency) {
      this.currency = this.commonService.selected_currency;
      let finalPrice = (price/this.currency.country_inr_value).toFixed(2);
      return parseFloat(finalPrice);
    }
    else return 0;
  }

  CALC_ROUND_WO_AC(price) {
    if(!price) price = 0;
    if(this.commonService.selected_currency) {
      this.currency = this.commonService.selected_currency;
      let finalPrice = (price/this.currency.country_inr_value);
      return Math.ceil(finalPrice/10)*10;
    }
    else return 0;
  }

  CONVERT_TO_INR(price) {
    if(!price) price = 0;
    if(this.commonService.selected_currency) {
      this.currency = this.commonService.selected_currency;
      let finalPrice = Math.round(price*this.currency.country_inr_value);
      return finalPrice;
    }
    else return 0;
  }

}