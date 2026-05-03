import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../../services/common.service';
import { StoreApiService } from '../../../services/store-api.service';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';

@Component({
    selector: 'app-order-review',
    templateUrl: './order-review.component.html',
    styleUrls: ['./order-review.component.scss'],
    standalone: false
})

export class OrderReviewComponent implements OnInit {

  orderDetails: any = {}; reviewForm: any = {};
  selected_product: any = {};
  pageLoader: boolean; params: any;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;

  constructor(
    public cc: CurrencyConversionService, private router: Router, private activeRoute: ActivatedRoute,
    private storeApi: StoreApiService, public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.params = params; this.pageLoader = true;
      this.storeApi.STORE_ORDER_DETAILS(this.params.id).subscribe(result => {
        setTimeout(() => { this.pageLoader = false; }, 500);
        if(result.status) {
          this.orderDetails = result.data;
          this.orderDetails.item_list.forEach(obj => {
            if(obj.review_details) {
              obj.rating = [{ selected: false }, { selected: false }, { selected: false }, { selected: false }, { selected: false }];
              for(let i=0; i<obj.review_details.rating; i++) {
                obj.rating[i].selected = true;
              }
            }
          });
        }
        else {
          console.log("response", result);
          this.router.navigate(['/']);
        }
      });
    });
  }

  getProductDetails(index, modalName) {
    this.storeApi.STORE_ORDER_DETAILS(this.params.id).subscribe(result => {
      this.orderDetails.item_list[index].submit = false;
      if(result.status) {
        this.selected_product = result.data.item_list[index];
        this.reviewForm = { store_id: this.commonService.store_id, order_id: result.data._id, product_id: this.selected_product.product_id, item_index: index, rating: 5 };
        modalName.show();
      }
      else console.log("response", result);
    });
  }

  getReviewDetails(productDetails, modalName) {
    this.selected_product = productDetails;
    this.reviewForm = productDetails.review_details;
    this.reviewForm.description = this.reviewForm.description.replace(new RegExp('\n', 'g'), "<br />");
    modalName.show();
  }

  onupdate(modalName) {
    this.reviewForm.submit = true;
    this.storeApi.ADD_REVIEW(this.reviewForm).subscribe(result => {
      this.reviewForm.submit = false;
      if(result.status) {
        modalName.hide();
        this.ngOnInit();
      }
      else {
        this.reviewForm.error_msg = result.message;
        console.log("response", result);
      }
    });
  }

}