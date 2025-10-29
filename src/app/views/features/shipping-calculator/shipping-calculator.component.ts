import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';

@Component({
  selector: 'app-shipping-calculator',
  templateUrl: './shipping-calculator.component.html',
  styleUrls: ['./shipping-calculator.component.scss']
})

export class ShippingCalculatorComponent implements OnInit {

  pageLoader: boolean;
  loginForm: any = {};
  template_setting: any = environment.template_setting;

  constructor(private storeApi: StoreApiService, public commonService: CommonService, public cc: CurrencyConversionService) { }

  ngOnInit(): void {
    this.loginForm = { shipping_type: "Domestic", shipping_method: "" };
    if(!this.commonService.shippingList?.length) {
      this.pageLoader = true;
      this.storeApi.SHIPPING_METHODS().subscribe(result => {
        if(result.status) this.commonService.shippingList = result.list;
        else console.log("response", result);
        console.log(this.commonService.shippingList)
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    }
    // country list
    this.commonService.getCountryList();
  }

  onCalculate() {
    this.loginForm.shipping_price = null;
    let sInd = this.commonService.shippingList.findIndex(el => el._id==this.loginForm.shipping_method._id && el.shipping_type==this.loginForm.shipping_type);
    if(sInd!=-1) {
      let selectedShipping = this.commonService.shippingList[sInd];
      if(this.loginForm.shipping_type=='Domestic') {
        if(!selectedShipping.domes_zone_status) {
          this.loginForm.shipping_price = selectedShipping.shipping_price;
          if(selectedShipping.free_shipping && selectedShipping.minimum_price <= this.loginForm.amount)
            this.loginForm.shipping_price = 0;
        }
      }
      else if(this.loginForm.shipping_type=='International') {
        if(!selectedShipping.inter_zone_status) {
          this.loginForm.shipping_price = selectedShipping.shipping_price;
          if(selectedShipping.free_shipping && this.loginForm.amount >= selectedShipping.minimum_price)
            this.loginForm.shipping_price = 0;
        }
        else {
          this.loginForm.shipping_price = this.findInternatioanlPrice(selectedShipping.inter_zones, this.loginForm.country, this.loginForm.weight);
          if(selectedShipping.free_shipping && this.loginForm.amount >= selectedShipping.minimum_price)
            this.loginForm.shipping_price = 0;
        }
      }
    }
  }

  findInternatioanlPrice(zones: any[], country: string, cartWeight: number) {
    // zone
    let zonePrice = 0;
    let filterZone = zones.filter(obj => obj.countries.findIndex(x => x == country)!=-1);
    if(filterZone.length && filterZone[0].rate_multiplier.length) {
      // multiplier
      let rateMultiplier = filterZone[0].rate_multiplier;
      rateMultiplier.sort((a, b) => 0 - (a.weight > b.weight ? -1 : 1));  // sort asc
      let shippingMultiplier = rateMultiplier[rateMultiplier.length - 1].multiplier;
      let filterMultiplier = rateMultiplier.filter(obj => obj.weight>=cartWeight);
      if(filterMultiplier.length) shippingMultiplier = filterMultiplier[0].multiplier;
      // find price
      zonePrice = Math.round(filterZone[0].price_per_kg*shippingMultiplier);
    }
    return zonePrice;
  }

}