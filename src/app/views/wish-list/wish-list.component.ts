import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../services/wishlist.service';
import { environment } from './../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { CommonService } from '../../services/common.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';

@Component({
  selector: 'app-wish-list',
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.scss'],
  standalone: false
})
export class WishListComponent implements OnInit, OnDestroy {

  pageLoader: boolean;
  list: any[] = [];
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  subscription: Subscription;
  bcList: any = [
    { name: 'Home', position: 1, link: '/' },
    { name: 'My Account', position: 2, link: '/account' },
    { name: 'My Wishlist', position: 3, link: '/wishlist' }
  ];
  seoDetails: any = {
    h1_tag: 'Wishlist | Tulsi Silks',
    page_title: 'Tulsi Silks - My Wishlist',
    meta_desc: 'Create a list of your favourite products so you can shop it later.',
    meta_keywords: []
  };

  constructor(
    private wishService: WishlistService,
    public cc: CurrencyConversionService,
    private api: ApiService,
    public commonService: CommonService
  ) {
    this.subscription = this.commonService.currency_type.subscribe(() => {
      this.findCurrency();
    });
  }

  ngOnInit(): void {
    if (localStorage.getItem('customer_token')) {
      this.pageLoader = true;
      this.api.UPDATE_WISHLIST().subscribe(result => {
        if (result.status) {
          this.wishService.updateWishList(result.data.wish_list);
          this.list = this.commonService.wish_list || [];
          this.findCurrency();
        } else {
          console.log('response', result);
        }
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    } else {
      this.list = this.commonService.wish_list || [];
      this.findCurrency();
    }
    this.commonService.setSiteMetaData(this.seoDetails, null);
    this.commonService.breadCrumbList(this.bcList);
  }

  findCurrency(): void {
    for (const product of this.list) {
      product.temp_selling_price = this.cc.CALC(product.selling_price);
      product.temp_discounted_price = this.cc.CALC(product.discounted_price);
    }
  }

  productLink(item: any): string {
    if (item?.seo_status && item?.seo_details?.page_url) {
      return '/product/' + item.seo_details.page_url + '/1';
    }
    return '/product/' + (item?.product_id || item?._id) + '/1';
  }

  productSubtitle(item: any): string {
    const parts = [
      item?.sub_name,
      item?.short_description,
      item?.fabric,
      item?.weave,
      item?.category_name,
      item?.category
    ].filter((part: any) => typeof part === 'string' && part.trim().length);

    if (parts.length) return parts.slice(0, 2).join(' · ');

    if (Array.isArray(item?.attribute_list) && item.attribute_list.length) {
      return item.attribute_list
        .slice(0, 2)
        .map((attr: any) => attr?.option_list?.[0]?.name || attr?.name)
        .filter(Boolean)
        .join(' · ');
    }

    return '';
  }

  stockLabel(item: any): { text: string; low: boolean } | null {
    const stock = Number(item?.stock);
    if (!Number.isFinite(stock)) return null;

    const minQty = this.commonService?.min_qty?.[item?.unit] ?? 1;
    if (stock < minQty) {
      return { text: 'Sold Out', low: true };
    }

    const lowThreshold = this.commonService?.application_setting?.min_stock || 3;
    if (stock <= lowThreshold) {
      return { text: `Only ${stock} left in stock`, low: true };
    }

    return { text: 'In Stock · Ready to Dispatch', low: false };
  }

  removeFromWishList(index: number): void {
    this.list.splice(index, 1);
    this.wishService.updateWishList(this.list);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
