import { makeStateKey } from '@angular/core';

// SSR state preserved across the server → client boundary so the client
// constructor of CommonService can populate its data fields BEFORE Angular's
// view init / hydration. This is what allows MainHeaderComponent's *ngFor over
// commonService.menu_list (and other *ngIf branches that depend on async API
// data) to match the SSR-rendered DOM at hydration time — without this, the
// client sees empty arrays at hydration → Angular bails with
// `hasAttribute is not a function` and the layout tree destroy+recreates.
//
// The HTTP transfer cache (configured via withHttpTransferCacheOptions) already
// stores the raw STORE_DETAILS response, but it only replays during the
// subscribe in ngAfterContentInit — which fires AFTER hydration. This explicit
// snapshot delivers the *processed* state at the right lifecycle moment.
export interface SsrStateSnapshot {
  menu_list?: any[];
  catalog_list?: any[];
  ys_features?: any[];
  currency_types?: any[];
  application_setting?: any;
  ipBasedCurrency?: boolean;
  temp_currency?: any;
  selected_currency?: any;
  primary_main_slider?: any[];
  store_details?: any;
  store_properties?: any;
  seo_details?: any;
  payment_methods?: any[];
  checkout_setting?: any;
  footer_config?: any;
  giftcard_config?: any;
  announcementBar?: string;
  footer_seo_links?: any[];
  storeLoaded?: boolean;
  storeDataLoaded?: boolean;
}

export const SSR_STATE_KEY = makeStateKey<SsrStateSnapshot>('ys.ssr.snapshot.v1');
