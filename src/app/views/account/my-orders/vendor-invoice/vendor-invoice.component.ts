import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { StoreApiService } from '../../../../services/store-api.service';
import { CommonService } from '../../../../services/common.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';
import { environment } from '../../../../../environments/environment';
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";

@Component({
    selector: 'app-vendor-invoice',
    templateUrl: './vendor-invoice.component.html',
    styleUrls: ['./vendor-invoice.component.scss'],
    standalone: false
})

export class VendorInvoiceComponent implements OnInit {

  pageLoader: boolean;
  params: any; invoice_details: any = {};
  order_list: any = []; tax_rates: any = [];
  template_setting: any = environment.template_setting;
  imgBaseUrl: string = environment.img_baseurl;
  vendorInfo: any;

  constructor(
    private router: Router, private activeRoute: ActivatedRoute, private api: StoreApiService,
    @Inject(PLATFORM_ID) private platformId: Object, public commonService: CommonService, public cc: CurrencyConversionService
  ) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.params = params;
      if(isPlatformBrowser(this.platformId) && this.params.type=="order") {
        this.pageLoader = true;
        if(sessionStorage.getItem("t_rates")) {
          this.tax_rates = this.commonService.decryptData(sessionStorage.getItem("t_rates"));
          this.getOrderInfo();
        }
        else {
          this.api.TAX_RATES().subscribe(result => {
            if(result.status) {
              this.tax_rates =JSON.parse(result.list);
              sessionStorage.setItem("t_rates", this.commonService.encryptData(this.tax_rates));
              this.getOrderInfo();
            }
            else console.log("response", result);
          });
        }
      }
      else this.router.navigate(['/']);
    });
  }

  getOrderInfo() {
    this.api.INVOICE_ORDER_DETAILS(this.params).subscribe(result => {
      if(result.status && result.vendor_info) {
        let orderDetails = result.data;
        this.vendorInfo = result.vendor_info;
        let vIndex = orderDetails.vendor_list.findIndex(obj => obj.vendor_id==this.params.vendor_id);
        if(vIndex!=-1) {
          setTimeout(() => { this.pageLoader = false; }, 500);
          this.invoice_details = orderDetails.vendor_list[vIndex];
          this.invoice_details._id = orderDetails._id;
          this.invoice_details.created_on = orderDetails.created_on;
          this.invoice_details.currency_type = orderDetails.currency_type;
          this.invoice_details.payment_details = orderDetails.payment_details;
          this.invoice_details.billing_address = orderDetails.billing_address;
          this.invoice_details.shipping_address = orderDetails.shipping_address;
          this.invoice_details.item_list = orderDetails.item_list.filter(obj => obj.vendor_id==this.params.vendor_id);
          let countryInr = this.invoice_details.currency_type.country_inr_value;
          this.invoice_details.sub_total = (this.invoice_details.sub_total/countryInr).toFixed(2);
          this.invoice_details.gift_wrapper = (this.invoice_details.gift_wrapper/countryInr).toFixed(2);
          this.invoice_details.shipping_cost = (this.invoice_details.shipping_cost/countryInr).toFixed(2);
          this.invoice_details.discount_amount = (this.invoice_details.discount_amount/countryInr).toFixed(2);
          this.invoice_details.final_price = (this.invoice_details.final_price/countryInr).toFixed(2);
          this.processItemList(this.invoice_details.item_list, countryInr).then((respData) => {
            this.order_list = respData;
            for(let set of this.order_list) {
              if(set.tax_details) {
                set.temp_sub_total = (this.findBaseAmount(set.sub_total, set.tax_details)/countryInr).toFixed(2);
                set.temp_igst = (this.findTaxAmount( set.sub_total, set.tax_details.igst, set.tax_details.igst )/countryInr).toFixed(2);
                if(set.tax_details.sgst) set.temp_sgst = (this.findTaxAmount( set.sub_total, set.tax_details.sgst, ((set.tax_details.sgst*1)+(set.tax_details.cgst*1)) )/countryInr).toFixed(2);
                if(set.tax_details.cgst) set.temp_cgst = (this.findTaxAmount( set.sub_total, set.tax_details.cgst, ((set.tax_details.sgst*1)+(set.tax_details.cgst*1)) )/countryInr).toFixed(2);
              }
            }
          });
        }
        else console.log("Invalid order");
      }
      else console.log("response", result);
    });
  }

  processItemList(itemList, countryInr) {
    return new Promise((resolve, reject) => {
      let orderList: any = [];
      for(let item of itemList)
      {
        let itemFinalPrice = item.final_price * item.quantity;
        if(item.unit!="Pcs") { itemFinalPrice += item.addon_price; }
        // get tax info
        delete item.tax_details;
        let trIndex = this.tax_rates.findIndex(obj => obj._id==item.taxrate_id);
        if(trIndex!=-1) item.tax_details = this.tax_rates[trIndex];
        if(item.taxrate_id && item.tax_details) {
          // find tax exists in order list
          let taxIndex = orderList.findIndex(obj => obj.taxrate_id==item.taxrate_id);
          if(taxIndex!=-1) {
            let itemBaseAmt = this.findBaseAmount(itemFinalPrice, orderList[taxIndex].tax_details);
            item.temp_final_price = (itemBaseAmt/countryInr).toFixed(2);
            orderList[taxIndex].item_list.push(item);
            orderList[taxIndex].sub_total += itemFinalPrice;
          }
          else {
            let itemBaseAmt = this.findBaseAmount(itemFinalPrice, item.tax_details);
            item.temp_final_price = (itemBaseAmt/countryInr).toFixed(2);
            orderList.push({ taxrate_id: item.taxrate_id, tax_details: item.tax_details, item_list: [item], sub_total: itemFinalPrice });
          }
        }
        else {
          let itemBaseAmt = this.findBaseAmount(itemFinalPrice, null);
          item.temp_final_price = (itemBaseAmt/countryInr).toFixed(2);
          orderList.push({ item_list: [item], sub_total: itemFinalPrice });
        }
      }
      resolve(orderList);
    });
  }

  findBaseAmount(amount, taxDetails) {
    if(taxDetails) {
      if(this.invoice_details.billing_address.country==taxDetails.home_country && this.invoice_details.billing_address.state==taxDetails.home_state) {
        let totalPercentage = 100+parseFloat(taxDetails.sgst)+parseFloat(taxDetails.cgst);
        let onePercentAmount = amount/totalPercentage;
        return (onePercentAmount*100);
      }
      else {
        let totalPercentage = 100+parseFloat(taxDetails.igst);
        let onePercentAmount = amount/totalPercentage;
        return (onePercentAmount*100);
      }
    }
    else return amount;
  }

  findTaxAmount(amount, tax, totalTax) {
    let totalPercentage = 100+parseFloat(totalTax);
    let onePercentAmount = amount/totalPercentage;
    return (onePercentAmount*tax);
  }

  generatePDF() {
    let data = document.getElementById('contentToConvert');
    html2canvas(data).then(canvas => {
      let docWidth = 190;
      let docHeight = canvas.height*(docWidth/canvas.width);
      let top = 10; let left = 10;
      let contentDataURL = canvas.toDataURL('image/png');
      let doc = new jsPDF('p', 'mm', 'a4');
      doc.addImage(contentDataURL, 'PNG', left, top, docWidth, docHeight);
      doc.save(this.invoice_details.order_number+'.pdf');
    });
  }

}