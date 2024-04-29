import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { StoreApiService } from '../../../../services/store-api.service';
import { CommonService } from '../../../../services/common.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-giftcard-details',
  templateUrl: './giftcard-details.component.html',
  styleUrls: ['./giftcard-details.component.scss']
})

export class GiftcardDetailsComponent implements OnInit {

  cardForm: any; pageLoader: boolean;
  card_details: any = {}; bcList: any = [];
  template_setting: any = environment.template_setting;

  constructor(
    public commonService: CommonService, private router: Router, public cc: CurrencyConversionService,
    private api: ApiService, private storeApi: StoreApiService, private activeRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.pageLoader = true; this.cardForm = {};
      this.storeApi.GIFT_CARD_DETAILS(params['id']).subscribe(result => {
        setTimeout(() => { this.pageLoader = false; }, 500);
        if(result.status) {
          this.card_details = result.data;
          if(this.card_details.price_type=='fixed') this.cardForm.custom_price = this.cc.CALC_ROUND_WO_AC(this.card_details.price);
          else {
            this.card_details.min_price = this.cc.CALC_ROUND_WO_AC(this.card_details.min_price);
            this.card_details.max_price = this.cc.CALC_ROUND_WO_AC(this.card_details.max_price);
          }
          // schema
          this.bcList = [
            { name: "Home", position: 1, link: "/" },
            { name: "Gift Cards", position: 2, link: "/gift-cards" },
            { name: this.card_details.name, position: 3, link: this.router.url.split('?')[0] }
          ];
          this.commonService.breadCrumbList(this.bcList);
        }
        else {
          console.log("response", result);
          this.router.navigate(['/gift-cards']);
        }
      });
    });
  }

  onSubmit() {
    this.cardForm.submit = true;
    this.cardForm.image = this.card_details.image;
    this.cardForm.card_name = this.card_details.name;
    this.cardForm.to_email = this.cardForm.to_email.trim();
    this.cardForm.price = this.cc.CONVERT_TO_INR(this.cardForm.custom_price);
    // get user address list
    this.api.USER_DETAILS().subscribe(result => {
      if(result.status) {
        let addressList = result.data.address_list;
        let addressIndex = addressList.findIndex(obj => obj.billing_address);
        if(addressIndex != -1) this.cardForm.billing_address = addressList[addressIndex];
        this.api.USER_UPDATE({ checkout_details: this.cardForm }).subscribe(result => {
          if(result.status) {
            if(addressIndex != -1) this.router.navigate(['/checkout/giftcard-order-details']);
            else this.router.navigate(['/checkout/address-list/giftcard']);
          }
          else {
            console.log("response", result);
            this.router.navigate(["/"]);
          }
        });
      }
      else {
        console.log("response", result);
        this.router.navigate(["/"]);
      }
    });
  }

}