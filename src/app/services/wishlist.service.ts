import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})

export class WishlistService {

  wish_list: any = [];
  public observe_wishlist = new Subject<any>();

  constructor(private api: ApiService) { }

  checkProductExist(productId) {
    if(this.wish_list && this.wish_list.length) {
      return this.wish_list.some(x => x.product_id == productId);
    }
  }

  addToWishList(x) {
    x.product_id = x._id;
    x.image = x.image_list[0].image;
    if(!this.wish_list) this.wish_list = [];
    this.wish_list.push(x);
    this.updateWishList(this.wish_list);
  }

  removeFromWishList(productId) {
    if(this.wish_list) {
      let index = this.wish_list.findIndex(x => x.product_id == productId);
      if(index != -1) {
        this.wish_list.splice(index, 1);
        this.updateWishList(this.wish_list);
      }
    }
  }

  // this fn also call from wishlist page, so set wish_list again
  updateWishList(x) {
    this.wish_list = x;
    this.observe_wishlist.next(this.wish_list);
    this.api.USER_UPDATE({ wish_list: x }).subscribe(result => { });
  }

  // this fn call on login
  resetWishList(x) {
    this.wish_list = x;
    this.observe_wishlist.next(this.wish_list);
  }

}