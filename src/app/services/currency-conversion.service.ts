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

  /**
   * ISO code for Angular CurrencyPipe, always from the store selection.
   * Defaults to INR when currency is not ready (SSR / first paint) so the pipe
   * does not fall back to USD.
   */
  get pipeCurrencyCode(): string {
    return this.commonService.selected_currency?.country_code ?? 'INR';
  }

  /** Locale for CurrencyPipe (Indian grouping and ₹ for INR). */
  get pipeLocale(): string {
    return this.localeForIsoCode(this.pipeCurrencyCode);
  }

  /** ISO code from order/invoice/coupon payload; INR if missing (avoids USD fallback in the pipe). */
  savedCurrencyCode(ct: { country_code?: string } | null | undefined): string {
    return ct?.country_code ?? 'INR';
  }

  /** Locale for a saved ISO code (order summary, invoices, coupons). */
  savedCurrencyLocale(ct: { country_code?: string } | null | undefined): string {
    return this.localeForIsoCode(this.savedCurrencyCode(ct));
  }

  private localeForIsoCode(code: string): string {
    return code === 'INR' ? 'en-IN' : 'en-US';
  }

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