import { Injectable, Inject, PLATFORM_ID, DOCUMENT, TransferState } from '@angular/core';
import { Location, isPlatformBrowser, PlatformLocation } from '@angular/common';
import { DomSanitizer, SafeHtml, Meta, Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { StoreApiService } from './store-api.service';
import { environment } from '../../environments/environment';
/** Narrow imports vs full `crypto-js` — trims ~half the library from the main bundle. */
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { buildHomePageJsonLd, HomeJsonLdInput } from '../seo/home-page-json-ld';
import { SSR_STATE_KEY, SsrStateSnapshot } from './ssr-state.keys';
declare const $: any;

const HOME_JSON_LD_DEFAULTS = {
  organizationName: 'Tulsi Silks',
  storeName: 'Tulsi Silks',
  email: 'orders@tulsisilks.com',
  telephone: '+918072444353',
  streetAddress: '68, Luz Church Rd, CIT Colony, Mylapore',
  addressLocality: 'Chennai',
  addressRegion: 'Tamil Nadu',
  postalCode: '600004',
  addressCountry: 'IN',
  latitude: 13.03798928035473,
  longitude: 80.26038344232762,
  sameAs: [
    'https://www.instagram.com/tulsisilks/',
    'https://x.com/TulsiSilks',
    'https://www.facebook.com/tulsisilks',
  ] as const,
};

@Injectable({
  providedIn: 'root'
})

export class CommonService {

  store_id: string = environment.store_id;
  footer: string = environment.footer;
  currDate: Date = new Date();
  storeLoaded: boolean;
  wowjsLoaded: boolean; jsLoaded: boolean;
  public storeDetailsReceived = new Subject<any>();

  storeDataLoaded: boolean;
  public storeDataListener = new Subject<any>();

  /**
   * Homepage (and partial async fills) binds layout blocks **after** the initial navigation.
   * `.wow.fadeInUp` stays `visibility:hidden` until {@link AppComponent.rescanWowRevealTargets} observes it.
   */
  public wowRevealDomChanged = new Subject<void>();

  seo_details: any;
  user_details: any = {};
  store_details: any = {};
  currency_types: any= [];
  temp_currency: any;
  application_setting: any = {
    max_shipping_weight: 0, min_checkout_value: 0, gift_wrapping_charges: 0
  };
  checkout_setting: any = {};
  ys_features: any = [];
  trial_features: any = [];
  country_list: any = [];
  store_properties: any = { pincodes: [], currency_list: [], pickup_locations: [], opening_days: [] };
  footer_config: any = {};
  extra_pages: any = {};
  giftcard_config: any = {};
  announcementBar: string;
  ipBasedCurrency: boolean;
  product_features: any;

  after_login_event: any;
  guest_email: string;
  guest_token: string;
  session_id: string;

  privacy_policy: any;
  shipping_policy: any;
  cancellation_policy: any;
  terms_conditions: any;
  
  contact_page_info: any;
  store_locations: any;
  discount_page: any;

  payment_methods: any = [];
  catalog_list: any = [];
  menu_list: any = [];
  wish_list: any = [];
  wishListIds: any = [];
  layout_list: any = [];
  /** True when SSR used a compact homepage layout; browser refetches full LAYOUT_LIST. */
  layoutSsrCompact = false;
  ai_styles: any = [];
  blog_list: any = [];
  search_category_list: any = [];
  collection_list: any = [];
  catalog_with_sub_list: any = [];
  catalog_sub_details_cache: Record<string, any> = {};
  footer_seo_links: any = [];
  shippingList: any = [];

  selected_model: any = {};
  selected_product: any;

  customView: boolean;
  measurementView: boolean;
  notesView: boolean;

  ios: boolean; window_loaded: boolean;
  scroll_x_pos: number; scroll_y_pos: number;
  screen_width: number; screen_height: number;
  desktop_device: boolean; IsBrowser: boolean;
  previous_route: string; customer_token: string;

  search_page_attr: any = {};
  category_page_attr: any = {};
  product_page_attr: any;
  blog_page_attr: any = {};
  giftcard_page_attr: any = {};
  appointment_cat_page_attr: any = {};
  appointment_page_attr: any = {};

  temp_offer_code: string;
  order_search: string;
  coupon_search: string;
  appointment_search: string;

  favicon: any; store_logo: any;
  social_logo: any; primary_main_slider: any = [];
  primary_highlights: any = [];

  selected_currency: any;
  public currency_type = new Subject<any>();
  cryptoSecretkey: string = "$eCReTYoUr065SToRE217KeY";
  origin: any = 'https://'+this.platformLocation.hostname;

  min_qty: any = { "Pcs": 1, "Mts": 1, "Kgs": 1 };
  step_qty: any = { "Pcs": 1, "Mts": 1, "Kgs": 1 };
  customize_name: any = { "Pcs": "CUSTOMIZE YOUR GARMENT", "Mts": "STITCH GARMENT", "Kgs": "CUSTOMIZE YOUR PRODUCT" };
  ip_urls: any = [
    "https://ipapi.co/json",
    "https://freegeoip.app/json/",
    "https://api.db-ip.com/v2/free/self"
  ];

  reviewerList = [
    { name: "Preethi", rating: 4 },
    { name: "Savitha Muralidhar", rating: 4 },
    { name: "Gautham Prabhu", rating: 5 },
    { name: "Hemanth Kumar", rating: 5 },
    { name: "Pragati", rating: 4 },
    { name: "Ajay Sreedharan", rating: 4 },
    { name: "Swathi", rating: 5 },
    { name: "Bhavana", rating: 5 },
    { name: "Dhiwakar", rating: 4 },
    { name: "Manimegalai", rating: 4 },
    { name: "Swetha", rating: 5 },
    { name: "Bhagya", rating: 5 },
    { name: "Swarnalatha", rating: 4 },
    { name: "Sivakumar", rating: 4 },
    { name: "Aishwarya", rating: 5 },
    { name: "Saravana Kumar", rating: 5 },
    { name: "Santhosh", rating: 5 },
    { name: "Sundar", rating: 4 },
    { name: "Archana", rating: 4 },
    { name: "Ashok Kumar", rating: 5 }
  ];
  ratingList = [
    { rating: 4.9, count: 220 },
    { rating: 4.8, count: 240 },
    { rating: 4.7, count: 270 },
    { rating: 4.9, count: 290 },
    { rating: 4.8, count: 210 },
    { rating: 4.7, count: 170 },
    { rating: 4.9, count: 120 },
    { rating: 4.8, count: 340 },
    { rating: 4.7, count: 225 },
    { rating: 4.9, count: 267 },
    { rating: 4.8, count: 204 },
    { rating: 4.7, count: 160 },
    { rating: 4.9, count: 180 },
    { rating: 4.8, count: 175 },
    { rating: 4.7, count: 312 },
    { rating: 4.9, count: 255 },
    { rating: 4.8, count: 278 },
    { rating: 4.7, count: 292 }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private location: Location, private router: Router, private storeApi: StoreApiService,
    private sanitizer: DomSanitizer, private meta: Meta, private title: Title, private http: HttpClient, @Inject(DOCUMENT) private document,
    private platformLocation: PlatformLocation, private transferState: TransferState
  ) {
    // Read SSR snapshot FIRST so menu_list / ys_features / currency_types etc. are
    // populated before Angular's view init runs. This is what allows MainHeader's
    // *ngFor over menu_list and *ngIf branches to match the SSR-rendered DOM at
    // hydration time. We MUST also block localStorage from overwriting these values
    // below: localStorage from a previous visit may have stale data (e.g., older
    // ys_features without 'currency_variation') that would cause *ngIf branches
    // to evaluate differently than they did during the current SSR render. That
    // mismatch is what produces the `hasAttribute is not a function` hydration
    // error and tears down the menu. See ssr-state.keys.ts for full rationale.
    let ssrProvided = new Set<string>();
    if (isPlatformBrowser(this.platformId) && this.transferState.hasKey(SSR_STATE_KEY)) {
      const snapshot = this.transferState.get(SSR_STATE_KEY, null as unknown as SsrStateSnapshot);
      this.transferState.remove(SSR_STATE_KEY);
      if (snapshot) {
        const apply = <K extends keyof SsrStateSnapshot>(k: K) => {
          if (snapshot[k] !== undefined) {
            (this as any)[k] = snapshot[k];
            ssrProvided.add(k as string);
          }
        };
        apply('menu_list'); apply('catalog_list'); apply('ys_features'); apply('currency_types');
        apply('application_setting'); apply('ipBasedCurrency'); apply('temp_currency'); apply('selected_currency');
        apply('primary_main_slider'); apply('store_details'); apply('store_properties'); apply('seo_details');
        apply('payment_methods');
        // checkout_setting and giftcard_config no longer in snapshot (see ssr-state.keys.ts).
        // They fall back to localStorage or the STORE_DETAILS HTTP transfer cache below.
        apply('footer_config'); apply('announcementBar'); apply('footer_seo_links');
        apply('storeLoaded'); apply('storeDataLoaded');
        // Derived state from application_setting that the original localStorage
        // path used to set — replicate it here so we don't lose them when we
        // skip the localStorage branch below.
        if (this.application_setting?.min_qty) this.min_qty = this.application_setting.min_qty;
        if (this.application_setting?.step_qty) this.step_qty = this.application_setting.step_qty;
        if (this.application_setting?.customize_name) this.customize_name = this.application_setting.customize_name;
      }
    }
    if(localStorage.getItem('customer_token')) this.customer_token = localStorage.getItem('customer_token');
    if(isPlatformBrowser(this.platformId)) {
      if(localStorage.getItem('user_details')) this.user_details = this.decryptData(localStorage.getItem("user_details"));
      // For each field below, only fall back to localStorage if the SSR snapshot
      // did NOT provide a value. This preserves hydration correctness on visits
      // where localStorage may be older / stale than the current SSR render.
      if(!ssrProvided.has('store_details') && localStorage.getItem('store_details')) this.store_details = this.decryptData(localStorage.getItem("store_details"));
      if(!ssrProvided.has('seo_details') && localStorage.getItem('seo_details')) this.seo_details = this.decryptData(localStorage.getItem("seo_details"));
      if(!ssrProvided.has('store_properties') && localStorage.getItem('store_properties')) this.store_properties = this.decryptData(localStorage.getItem("store_properties"));
      if(!ssrProvided.has('application_setting') && localStorage.getItem('application_setting')) {
        this.application_setting = this.decryptData(localStorage.getItem("application_setting"));
        if(this.application_setting.min_qty) this.min_qty = this.application_setting.min_qty;
        if(this.application_setting.step_qty) this.step_qty = this.application_setting.step_qty;
        if(this.application_setting.customize_name) this.customize_name = this.application_setting.customize_name;
      }
      if(!ssrProvided.has('checkout_setting') && localStorage.getItem('checkout_setting')) this.checkout_setting = this.decryptData(localStorage.getItem("checkout_setting"));
      if(!ssrProvided.has('footer_config') && localStorage.getItem('footer_config')) this.footer_config = this.decryptData(localStorage.getItem("footer_config"));
      if(!ssrProvided.has('payment_methods') && localStorage.getItem('payment_methods')) this.payment_methods = this.decryptData(localStorage.getItem("payment_methods"));
      if(!ssrProvided.has('ys_features') && localStorage.getItem('ys_features')) this.ys_features = this.decryptData(localStorage.getItem("ys_features"));
      if(!ssrProvided.has('selected_currency') && localStorage.getItem("selected_currency")) this.setCurrency(this.decryptData(localStorage.getItem("selected_currency")));
      if(sessionStorage.getItem('country_list')) this.country_list = this.decryptData(sessionStorage.getItem("country_list"));
      if(sessionStorage.getItem('guest_email')) this.guest_email = this.decryptData(sessionStorage.getItem("guest_email"));
      if(sessionStorage.getItem('guest_token')) this.guest_token = sessionStorage.getItem("guest_token");
      if(sessionStorage.getItem('sid')) this.session_id = sessionStorage.getItem("sid");
      if(this.ys_features?.indexOf('ip_based_4_currency')!=-1 || this.ys_features.indexOf('ip_based_10_currency')!=-1 || this.ys_features.indexOf('ip_based_25_plus_currency')!=-1) {
        this.ipBasedCurrency = true;
      }
    }
  }

  buildTags(prodTags) {
    let tagList = this.store_properties.img_tag_list;
    let newArr = [];
    if(prodTags?.length) {
      prodTags.forEach(el => {
        let tIndex = tagList.findIndex(obj => obj._id==el);
        if(tIndex!=-1) {
          newArr.push({ name: tagList[tIndex].name, rank: tagList[tIndex].rank });
        }
      });
    }
    return newArr;
  }

  // Bread Crumb List
  breadCrumbList(bcList) {
    if(bcList.length) {
      let bcSchema = {
        '@context': 'https://schema.org/',
        '@type': 'BreadcrumbList',
        itemListElement: [],
      };
      bcList.forEach((el) => {
        bcSchema['itemListElement'].push({
          '@type': 'ListItem',
          position: el.position,
          name: el.name,
          item: this.origin + el.link
        });
      });
      this.removeElement('bc-jsonld');
      this.createJsonLD('bc-jsonld', bcSchema);
    }
  }

  getItemList(list) {
    let updatedList = [];
    list.forEach(prod => {
      let newData: any = { product_id: prod.product_id, quantity: prod.quantity, unit: prod.unit, image: prod.image };
      if(prod.variant_status && prod.variant_types && prod.variant_types.length) {
        newData.variant_status = true;
        newData.variant_types = prod.variant_types;
      }
      if(prod.addon_status) {
        if(prod.selected_addon || prod.addon_id) {
          newData.addon_status = true;
          if(prod.addon_id) newData.addon_id = prod.addon_id;
          if(prod.selected_addon) newData.addon_id = prod.selected_addon._id;
          if(prod.customization_status && prod.customized_model) {
            newData.customization_status = true;
            newData.model_id = prod.customized_model.model_id;
          }
        }
      }
      if(prod.vendor_id) newData.vendor_id = prod.vendor_id;
      updatedList.push(newData);
    });
    return updatedList;
  }

  setCurrency(value) {
    this.selected_currency = value;
    this.currency_type.next(this.selected_currency);
  }

  encryptData(data) {
    try {
      if (isPlatformBrowser(this.platformId)) {
        return AES.encrypt(JSON.stringify(data), this.cryptoSecretkey).toString();
      }
    } catch (e) {
      console.log("encrypt err-----", e);
    }
  }
  decryptData(data) {
    try {
      if (isPlatformBrowser(this.platformId)) {
        const bytes = AES.decrypt(data, this.cryptoSecretkey);
        if (bytes.toString()) {
          return JSON.parse(bytes.toString(Utf8));
        }
        return data;
      }
    } catch (e) {
      console.log("decrypt err-----", e);
    }
  }

  /* JSON LD */
  createJsonLD(id, schema) {
    if(!this.document.getElementById(id)) {
      let script = this.document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      /** Keeps markup valid if JSON strings ever contain `</` (e.g. `</script>`). */
      script.text = JSON.stringify(schema).replace(/</g, "\\u003c");
      this.document.getElementsByTagName("head")[0].appendChild(script);
    }
  }
  removeElement(id) {
    if(this.document.getElementById(id)) this.document.getElementById(id).remove();
  }
  getSafeHTML(jsonLD: {[key: string]: any}): SafeHtml {
    const json = jsonLD ? JSON.stringify(jsonLD, null, 2).replace(/<\/script>/g, '<\\/script>') : ''; 
    const html = `<script type="application/ld+json">${json}</script>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
  currencyFormat(input) {
    let result = input.toString().split('.');
    let lastThree = result[0].slice(result[0].length - 3);
    let otherNumbers = result[0].slice(0, result[0].length - 3);
    if(otherNumbers != '') lastThree = ',' + lastThree;
    let output = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    if(result.length > 1) output += "." + result[1];
    return output+".00";
  }

  /**
   * Footer tap-to-call from store APIs.
   * Order: `footer_config.contact_config` → `store_details.company_details` → `application_setting.chat_config.mobile`.
   * Optional labels: `phone_display`, `phone_label`, `contact_display` on contact_config or company_details.
   */
  getFooterPrimaryPhone(): { telHref: string; display: string } | null {
    const fc = this.footer_config?.contact_config as Record<string, unknown> | undefined;
    const cd = this.store_details?.company_details as Record<string, unknown> | undefined;
    const chat = this.application_setting?.chat_config as Record<string, unknown> | undefined;

    const pick = (...vals: unknown[]): string => {
      for (const v of vals) {
        if (v != null && String(v).trim()) return String(v).trim();
      }
      return '';
    };

    let raw = pick(
      fc?.['mobile'],
      fc?.['contact_no'],
      fc?.['phone'],
      cd?.['mobile'],
      cd?.['contact_no'],
      cd?.['phone'],
    );
    const dialRaw = pick(fc?.['dial_code'], cd?.['dial_code']);

    if (!raw && chat?.['mobile']) {
      raw = String(chat['mobile']);
    }

    if (!raw) return null;

    const digitsOnly = (s: string) => s.replace(/\D/g, '').replace(/^0+/, '');
    const national = digitsOnly(raw);
    const dialDigits = dialRaw ? digitsOnly(dialRaw) : '';

    if (!national || national.length < 8) return null;

    let e164Digits = national;
    if (dialDigits.length && national.length <= 10 && !national.startsWith(dialDigits)) {
      e164Digits = dialDigits + national;
    } else if (!dialDigits.length && national.length === 10) {
      const country = String(this.store_details?.country ?? '');
      if (country === 'India' || country === 'IN') e164Digits = '91' + national;
    }

    const telHref = `tel:+${e164Digits}`;

    const displayOverride = pick(
      fc?.['phone_display'],
      fc?.['phone_label'],
      fc?.['contact_display'],
      cd?.['phone_display'],
      cd?.['contact_display'],
    );
    const display = displayOverride || this.formatIntlPhoneDisplay(e164Digits);

    return { telHref, display };
  }

  private formatIntlPhoneDisplay(e164Digits: string): string {
    if (e164Digits.startsWith('91') && e164Digits.length === 12) {
      const rest = e164Digits.slice(2);
      return `+91 ${rest.slice(0, 5)} ${rest.slice(5)}`;
    }
    return `+${e164Digits}`;
  }

  /** Strip HTML for plain-text schema fields (footer `address_config.content` is often HTML). */
  private stripHtmlForSchema(value: string): string {
    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private parseSameAs(raw: unknown): string[] {
    if (Array.isArray(raw)) {
      return raw
        .map((x) => {
          if (x == null) return '';
          if (typeof x === 'string') return x.trim();
          if (typeof x === 'object' && x !== null && 'url' in (x as object)) {
            return String((x as { url?: unknown }).url ?? '').trim();
          }
          return String(x).trim();
        })
        .filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  private collectSameAsForSchema(): string[] {
    const fc = this.footer_config?.contact_config as Record<string, unknown> | undefined;
    const foot = this.footer_config as Record<string, unknown> | undefined;
    const cd = this.store_details?.company_details as Record<string, unknown> | undefined;
    for (const raw of [fc?.['same_as'], fc?.['sameAs'], foot?.['same_as'], cd?.['same_as']]) {
      const list = this.parseSameAs(raw);
      if (list.length) return list;
    }
    return [...HOME_JSON_LD_DEFAULTS.sameAs];
  }

  getCanonicalOrigin(): string {
    const d = environment.domain;
    if (typeof d === 'string' && d.trim()) {
      const t = d.trim();
      if (t.startsWith('http://') || t.startsWith('https://')) {
        return t.replace(/\/$/, '');
      }
      return `https://${t.replace(/\/$/, '')}`;
    }
    if (typeof this.origin === 'string' && /^https?:\/\//.test(this.origin)) {
      return this.origin.replace(/\/$/, '');
    }
    return 'https://tulsisilks.co.in';
  }

  private getLogoUrlForSchema(): string {
    const path = this.store_logo || this.social_logo;
    const base = environment.img_baseurl || '';
    if (!path) {
      return `${base}uploads/${this.store_id}/logo.png`;
    }
    const p = String(path);
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `${base}${p.replace(/^\//, '')}`;
  }

  /** E.164 `+…` for JSON-LD `telephone`. Always returns the verified business number. */
  getSchemaTelephoneE164(): string {
    return HOME_JSON_LD_DEFAULTS.telephone;
  }

  buildHomeJsonLdInput(): HomeJsonLdInput {
    const origin = this.getCanonicalOrigin();
    const ac = this.footer_config?.address_config as Record<string, unknown> | undefined;
    const fc = this.footer_config?.contact_config as Record<string, unknown> | undefined;
    const cd = this.store_details?.company_details as Record<string, unknown> | undefined;
    const sd = this.store_details as Record<string, unknown> | undefined;
    const cpi = this.contact_page_info as Record<string, unknown> | undefined;

    const pickStr = (...vals: unknown[]): string => {
      for (const v of vals) {
        if (v == null) continue;
        const s = String(v).trim();
        if (s) return this.stripHtmlForSchema(s);
      }
      return '';
    };

    const pickNum = (...vals: unknown[]): number | null => {
      for (const v of vals) {
        if (v == null || v === '') continue;
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        if (Number.isFinite(n)) return n;
      }
      return null;
    };

    const orgName = pickStr(sd?.['name'], HOME_JSON_LD_DEFAULTS.organizationName) || HOME_JSON_LD_DEFAULTS.organizationName;
    const storeName =
      pickStr(cd?.['store_display_name'], cd?.['store_name'], `${orgName}`) || HOME_JSON_LD_DEFAULTS.storeName;

    const telephone = this.getSchemaTelephoneE164();
    const email =
      pickStr(fc?.['email'], cd?.['email'], cpi?.['email'], HOME_JSON_LD_DEFAULTS.email) || HOME_JSON_LD_DEFAULTS.email;

    const streetAddress =
      pickStr(
        ac?.['street_address'],
        ac?.['streetAddress'],
        ac?.['address_line_1'],
        ac?.['line1'],
        cd?.['street_address'],
        cd?.['streetAddress'],
        cd?.['address'],
        cpi?.['address'],
        cpi?.['streetAddress'],
        ac?.['content'],
        HOME_JSON_LD_DEFAULTS.streetAddress,
      ) || HOME_JSON_LD_DEFAULTS.streetAddress;

    const addressLocality =
      pickStr(
        ac?.['city'],
        ac?.['locality'],
        ac?.['addressLocality'],
        cd?.['city'],
        sd?.['city'],
        cpi?.['city'],
        HOME_JSON_LD_DEFAULTS.addressLocality,
      ) || HOME_JSON_LD_DEFAULTS.addressLocality;

    const addressRegion =
      pickStr(
        ac?.['state'],
        ac?.['region'],
        ac?.['addressRegion'],
        cd?.['state'],
        sd?.['state'],
        cpi?.['state'],
        HOME_JSON_LD_DEFAULTS.addressRegion,
      ) || HOME_JSON_LD_DEFAULTS.addressRegion;

    const postalCode =
      pickStr(
        ac?.['pincode'],
        ac?.['postal_code'],
        ac?.['postalCode'],
        ac?.['zip'],
        cd?.['pincode'],
        cd?.['postal_code'],
        cpi?.['pincode'],
        cpi?.['postal_code'],
        HOME_JSON_LD_DEFAULTS.postalCode,
      ) || HOME_JSON_LD_DEFAULTS.postalCode;

    const countryRaw = pickStr(
      ac?.['country'],
      cd?.['country'],
      sd?.['country'],
      HOME_JSON_LD_DEFAULTS.addressCountry,
    );
    let addressCountry = HOME_JSON_LD_DEFAULTS.addressCountry;
    if (countryRaw) {
      const u = countryRaw.toLowerCase();
      if (u === 'india' || u === 'in') addressCountry = 'IN';
      else if (countryRaw.length === 2) addressCountry = countryRaw.toUpperCase();
    }

    const latitude =
      pickNum(
        ac?.['latitude'],
        ac?.['lat'],
        cd?.['latitude'],
        cd?.['lat'],
        cpi?.['latitude'],
        cpi?.['lat'],
        sd?.['latitude'],
      ) ?? HOME_JSON_LD_DEFAULTS.latitude;
    const longitude =
      pickNum(
        ac?.['longitude'],
        ac?.['lng'],
        ac?.['lon'],
        cd?.['longitude'],
        cd?.['lng'],
        cpi?.['longitude'],
        cpi?.['lng'],
        sd?.['longitude'],
      ) ?? HOME_JSON_LD_DEFAULTS.longitude;

    return {
      origin,
      organizationName: orgName,
      storeName,
      logoUrl: this.getLogoUrlForSchema(),
      telephone,
      email,
      streetAddress,
      addressLocality,
      addressRegion,
      postalCode,
      addressCountry,
      latitude,
      longitude,
      sameAs: this.collectSameAsForSchema(),
    };
  }

  applyHomePageJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.removeElement('home-jsonld');
    this.createJsonLD('home-jsonld', buildHomePageJsonLd(this.buildHomeJsonLdInput()));
  }

  getCountryList() {
    return new Promise((resolve, reject) => {
      if(!this.country_list.length && isPlatformBrowser(this.platformId)) {
        this.storeApi.COUNTRY_LIST().subscribe(result => {
          if(result.status) this.country_list = result.list;
          sessionStorage.setItem("country_list", this.encryptData(this.country_list));
          resolve(true);
        });
      }
      else resolve(true);
    });
  }

  getStoreSeoDetails() {
    if(this.seo_details) {
      this.setSiteMetaData(this.seo_details, null);
    }
    else {
      this.http.get<any>(environment.ws_url+'/store_details/store?store_id='+this.store_id).subscribe(result => {
        if(result.status) {
          this.seo_details = result.details.seo_details;
          this.setSiteMetaData(this.seo_details, null);
        }
        else console.log("store response", result);
      });
    }
  }
  setSiteMetaData(seoDetails, image) {
    if (!seoDetails) {
      return;
    }
    if(this.seo_details) {
      this.meta.updateTag({ name: 'theme-color', content: this.seo_details.tile_color });
      this.meta.updateTag({ property: 'og:site_name', content: this.seo_details.page_title });
    }
    if(!image) image = environment.img_baseurl+this.social_logo;
    this.title.setTitle(seoDetails.page_title);
    this.meta.updateTag({ name: 'description', content: seoDetails.meta_desc ?? '' });
    this.meta.updateTag({ property: 'og:title', content: seoDetails.page_title });
    this.meta.updateTag({ property: 'og:description', content: seoDetails.meta_desc });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
  }

  transformHtml(content) {
    return content.replace(new RegExp('\n', 'g'), "<br />");
  }

  goBack() {
    this.location.back();
  }

  scrollModalTop(timer: number) {
    if(isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        $('.modal-body').each(function(index, element) {
          let className = 'modal-body'+(index+1);
          element.classList.add(className);
          $("."+className).scrollTop(0);
        });
      }, timer);
    }
  }

  pageScrollTop() {
    if(isPlatformBrowser(this.platformId)) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onViewModel(x) {
    this.selected_model = x;
    this.document.getElementById("openCustomizationDetailsModal").click();
    this.scrollModalTop(500);
  }

  /** Returns a router path for use as [routerLink] so anchor tags get a real href for crawlers.
   *  Returns null when no link applies (external links handled separately by onPageRedirect). */
  getRedirectPath(x: any): string | null {
    if (!x?.link_status) return null;
    switch (x.link_type) {
      case 'category': {
        if (!x.category_id) return null;
        const cat = this.catalog_list?.find((c: any) => c._id === x.category_id);
        if (cat?.seo_status && cat?.seo_details?.page_url) return '/category/' + cat.seo_details.page_url;
        return '/category/' + x.category_id;
      }
      case 'product':
        return x.product_id ? '/product/' + x.product_id : null;
      case 'internal':
        return x.link || null;
      default:
        return null;
    }
  }

  onPageRedirect(x) {
    if(x && x.link_status) {
      if(x.link_type == 'category')
      {
        let secIndex = this.catalog_list.findIndex(obj => obj._id==x.category_id);
        if(secIndex != -1) {
          let categoryDetails = this.catalog_list[secIndex];
          if(categoryDetails.seo_status) this.router.navigate(['/category/'+categoryDetails.seo_details.page_url]);
          else this.router.navigate(['/category/'+categoryDetails._id]);
        }
        else {
          this.storeApi.CATEGORY_DETAILS({ category_id: x.category_id }).subscribe(result => {
            if(result.status) {
              let categoryDetails = result.data;
              if(categoryDetails.seo_status) this.router.navigate(['/category/'+categoryDetails.seo_details.page_url]);
              else this.router.navigate(['/category/'+categoryDetails._id]);
            }
            else console.log("response", result);
          });
        }
      }
      else if(x.link_type == 'product')
      {
        this.storeApi.PRODUCT_DETAILS({ product_id: x.product_id }).subscribe(result => {
          if(result.status) {
            let productDetails = result.data;
            if(productDetails.seo_status) this.router.navigate(['/product/'+productDetails.seo_details.page_url]);
            else this.router.navigate(['/product/'+productDetails._id]);
          }
          else console.log("response", result);
        });
      }
      else if(x.link_type == 'internal') {
        this.router.navigate([x.link]);
      }
      else if(isPlatformBrowser(this.platformId) && x.link_type == 'external') {
        window.open(x.link, "_blank");
      }
    }
    this.resetMegaMenu();
  }

  resetMegaMenu() {
    this.document.getElementById('reset-menu')?.click();
  }

  loadGoogleAnalytics(trackingIDs: string, timer: number): void {
    let trackId = trackingIDs.split(", ");
    if(isPlatformBrowser(this.platformId) && !this.document.getElementById("gtm-1")) {
      setTimeout(() => {
        let gaScript1 = this.document.createElement('script');
        gaScript1.id = "gtm-1";
        gaScript1.setAttribute('async', 'true');
        gaScript1.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${ trackId[0] }`);

        let gaScript2 = this.document.createElement('script');
        gaScript2.id = "gtm-2";
        gaScript2.innerText = "window.dataLayer = window.dataLayer || []; function gtag() { dataLayer.push(arguments); } gtag('js', new Date());";
        for(let x of trackId) {
          gaScript2.innerText += `gtag(\'config\', \'${ x }\');`;
        }
        this.document.documentElement.firstChild.appendChild(gaScript1);
        this.document.documentElement.firstChild.appendChild(gaScript2);
      }, timer);
    }
  }

  getIpInfo(ipIndex) {
    return new Promise((resolve, reject) => {
      this.storeApi.IP_INFO(this.ip_urls[Number(ipIndex)]).subscribe(result => {
        localStorage.setItem("ip_index", ipIndex);
        if(ipIndex==="0" || ipIndex==="1") {
          if(result.country_name && result.country_code) {
            let ipInfo = { country_name: result.country_name, country_code: result.country_code };
            resolve(ipInfo);
          }
          else resolve(null);
        }
        else if(ipIndex==="2") {
          if(result.countryName && result.countryCode) {
            let ipInfo = { country_name: result.countryName, country_code: result.countryCode };
            resolve(ipInfo);
          }
          else resolve(null);
        }
        else resolve(null);
      },
      (error) => { reject(error); });
    });
  }

}