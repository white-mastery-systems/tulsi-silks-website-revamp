import { Injectable, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonService } from './common.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class WishlistService {

  public observe_wishlist = new Subject<any>();

  constructor(
    private http: HttpClient, private cs: CommonService, @Inject(DOCUMENT) private document, private router: Router
  ) { }

  UPDATE_WISHLIST() {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.get<any>(environment.ws_url+'/user/update_wish_list', httpOptions);
  }
  USER_UPDATE(x) {
    let httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer '+localStorage.getItem('customer_token') }) };
    return this.http.put<any>(environment.ws_url+'/user/customer', x, httpOptions);
  }

  checkProductExist(productId) {
    if(this.cs.wish_list && this.cs.wish_list.length) {
      return this.cs.wish_list.some(x => x.product_id == productId);
    }
  }

  addToWishList(x) {
    x.product_id = x._id;
    x.image = x.image_list[0].image;
    if(!this.cs.wish_list) this.cs.wish_list = [];
    if(this.cs.wish_list.findIndex(el => el.product_id == x.product_id)==-1) {
      this.cs.wish_list.push(x);
      this.updateWishList(this.cs.wish_list);
    }
  }

  removeFromWishList(productId) {
    let index = this.cs.wish_list.findIndex(x => x.product_id == productId);
    if(index != -1) {
      this.cs.wish_list.splice(index, 1);
      this.updateWishList(this.cs.wish_list);
    }
  }

  modifyWishList(x, pageUrl) {
    if(this.cs.customer_token) {
      if(this.cs.wish_list.some(obj => obj.product_id === x._id)) this.removeFromWishList(x._id);
      else this.addToWishList(x);
    }
    else {
      this.cs.after_login_event = { type: 'add_product_to_wishlist', product: x, redirect: pageUrl };
      this.router.navigate(["/account"]);
    }
  }

  // this fn also call from wishlist page, so set wish_list again
  updateWishList(x) {
    this.cs.wish_list = x;
    this.cs.wishListIds = x.map(el => el.product_id);
    this.observe_wishlist.next(this.cs.wish_list);
    this.USER_UPDATE({ wish_list: x }).subscribe(() => { });
    // show header
    let el = this.document.getElementById("headroom-head");
    if(el) {
      el.classList.remove("slideUp");
      el.classList.add("slideDown");
    }
  }

  // this fn call on login
  resetWishList(x) {
    this.cs.wish_list = x;
    this.cs.wishListIds = x.map(el => el.product_id);
    this.observe_wishlist.next(this.cs.wish_list);
  }

}