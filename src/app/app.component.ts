import { Component, Inject, PLATFORM_ID, DOCUMENT, AfterViewInit, OnDestroy, TransferState } from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { fromEvent, Subscription, interval, merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { ConnectionService } from 'ng-connection-service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { environment } from '../environments/environment';
import { ApiService } from './services/api.service';
import { CommonService } from './services/common.service';
import { SwiperService } from './services/swiper.service';
import { WishlistService } from './services/wishlist.service';
import { CartlistService } from './services/cartlist.service';
import { StoreApiService } from './services/store-api.service';
import { CurrencyConversionService } from './services/currency-conversion.service';
import { DynamicAssetLoaderService } from './services/dynamic-asset-loader.service';
import { SSR_STATE_KEY } from './services/ssr-state.keys';
import { slimMenuListForTransfer } from './services/ssr-home.config';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})

export class AppComponent implements AfterViewInit, OnDestroy {

  template_setting: any = environment.template_setting;
  tempAnnounceBar: string; private subscription: Subscription;
  imgBaseUrl: string = environment.img_baseurl;
  isConnected = true; chatLoaded: boolean;
  headroomInit: boolean; intracted: boolean;
  private headerScriptsPromise: Promise<void> | null = null;
  /** Desktop `/category/*` disables sticky hide/show — header stays unobstructed for filters. */
  private vanillaHeadroomRouteFrozen = false;
  /** Last scroll Y sampled when applying vanilla Headroom logic (outside tolerance). */
  private vanillaHeadroomLastY = 0;
  randomNum: any; currUrl: string;
  showTooltip = false;

  /** Auto-open newsletter: listeners removed after first interaction or when leaving `/`. */
  private newsletterOnFirstInteraction: (() => void) | null = null;

  // INP-critical: scroll/resize listeners are attached manually in `ngAfterViewInit` (not
  // via @HostListener) so we can pass `{ passive: true }` (unblocks the scroll thread on
  // touch devices) and throttle to one execution per animation frame. The previous
  // @HostListener decorators triggered the handler synchronously on every scroll/resize
  // event — measuring ~150 ms total scripting per long scroll on mobile. Throttling to
  // rAF (~16 ms cadence) plus passive flag cuts that by ~80 %.
  private scrollTicking = false;
  private resizeDebounce: any = null;
  private boundScrollHandler = () => {
    if (this.scrollTicking) return;
    this.scrollTicking = true;
    requestAnimationFrame(() => {
      this.onScrollEvent();
      this.scrollTicking = false;
    });
  };
  private wowRevealObserver: IntersectionObserver | null = null;
  private wowRevealBootstrapped = false;
  private wowRouteSub: Subscription | null = null;

  /**
   * Replaces WOW.js CDN: reveal `.wow.fadeInUp` sections with a single IntersectionObserver.
   * Sets `commonService.wowjsLoaded` so footer/chat gating keeps working.
   */
  private bootstrapWowReveal(): void {
    if (!isPlatformBrowser(this.platformId) || this.wowRevealBootstrapped) return;
    this.wowRevealBootstrapped = true;

    const finish = (): void => {
      this.commonService.wowjsLoaded = true;
    };

    if (typeof IntersectionObserver === 'undefined') {
      const revealAll = (): void => {
        this.document.querySelectorAll('.wow.fadeInUp').forEach((n) => n.classList.add('wow-in-view'));
        finish();
      };
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(revealAll, { timeout: 2200 });
      } else {
        setTimeout(revealAll, 400);
      }
      return;
    }

    this.wowRevealObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).classList.add('wow-in-view');
          this.wowRevealObserver?.unobserve(e.target);
        }
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );

    finish();

    // Immediate rescan: initial route can finish (and lazy chunks render `.wow` nodes) before
    // idle runs; without this, home sections stay `visibility:hidden` indefinitely on ng serve / CSR.
    requestAnimationFrame(() => this.rescanWowRevealTargets());

    const startObserving = (): void => this.rescanWowRevealTargets();

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(startObserving, { timeout: 2200 });
    } else {
      setTimeout(startObserving, 400);
    }
  }

  private rescanWowRevealTargets(): void {
    if (!isPlatformBrowser(this.platformId) || !this.wowRevealObserver) return;
    this.document.querySelectorAll('.wow.fadeInUp:not(.wow-in-view)').forEach((n) => {
      this.wowRevealObserver!.observe(n);
    });
  }

  private clearVanillaHeadroomAnimationClasses(): void {
    const el = this.document.querySelector('#headroom-head');
    el?.classList.remove('slideUp', 'slideDown');
  }

  /** Mirrors Headroom.js (offset 150, tolerance 5) without a CDN script — uses `headroom.css` keyframes. */
  private applyVanillaHeadroom(scrollY: number): void {
    const el = this.document.querySelector('#headroom-head') as HTMLElement | null;
    if (!el || this.vanillaHeadroomRouteFrozen) return;

    const OFFSET = 150;
    const TOLERANCE = 5;

    if (scrollY <= OFFSET) {
      el.classList.remove('slideUp', 'slideDown');
      el.classList.add('animated');
      this.vanillaHeadroomLastY = scrollY;
      return;
    }

    const delta = scrollY - this.vanillaHeadroomLastY;
    if (Math.abs(delta) < TOLERANCE) {
      return;
    }
    this.vanillaHeadroomLastY = scrollY;

    if (delta > 0) {
      el.classList.remove('slideDown');
      el.classList.add('animated', 'slideUp');
    } else {
      el.classList.remove('slideUp');
      el.classList.add('animated', 'slideDown');
    }
  }

  private boundResizeHandler = () => {
    if (this.resizeDebounce) clearTimeout(this.resizeDebounce);
    this.resizeDebounce = setTimeout(() => this.onResizeEvent(), 150);
  };

  onScrollEvent() {
    if (isPlatformBrowser(this.platformId)) {
      this.commonService.scroll_x_pos = window.pageXOffset;
      this.commonService.scroll_y_pos = window.pageYOffset;
      // for scroll-top icon
      let scrollElem = this.document.getElementById('scrollup');
      if (scrollElem) {
        if (window.pageYOffset > 100) scrollElem.style.display = 'block';
        else scrollElem.style.display = 'none';
      }
      if (!this.vanillaHeadroomRouteFrozen && window.pageYOffset > 150 && !this.headroomInit) {
        this.headroomInit = true;
        this.vanillaHeadroomLastY = window.pageYOffset;
      }
      if (this.headroomInit && !this.vanillaHeadroomRouteFrozen) {
        this.applyVanillaHeadroom(window.pageYOffset);
      }
    }
  }
  onResizeEvent() {
    if (isPlatformBrowser(this.platformId)) {
      this.commonService.screen_height = window.innerHeight;
      this.commonService.screen_width = window.innerWidth;
      // for mega menu
      if (!window.requestAnimationFrame) setTimeout(() => { this.moveNavigation(); }, 300);
      else window.requestAnimationFrame(() => { this.moveNavigation(); });
    }
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private deviceService: DeviceDetectorService, @Inject(DOCUMENT) private document,
    private storeApi: StoreApiService, private api: ApiService, public router: Router, public commonService: CommonService,
    public wishService: WishlistService, public cartService: CartlistService, public cc: CurrencyConversionService,
    private swiperService: SwiperService, private location: Location, private connectionService: ConnectionService,
    private assetLoader: DynamicAssetLoaderService, private transferState: TransferState
  ) {
    // this.randomNum = localStorage.setItem("random_num", "654TRTYR654")
    // device type
    if (this.deviceService.isDesktop()) {
      this.commonService.desktop_device = true;
    }
    else {
      let iosPlatforms = ["iPad", "iPhone", "iPod", "iPod touch"];
      if (isPlatformBrowser(this.platformId) && iosPlatforms.indexOf(navigator.platform) != -1) {
        this.commonService.ios = true;
      }
    }
    // window properties
    this.onScrollEvent();
    this.onResizeEvent();
    if (isPlatformBrowser(this.platformId)) {
      this.commonService.IsBrowser = true;
    } else {
      // SSR fallback: window is undefined on the server, so onResizeEvent() is a no-op
      // and screen_width stays `undefined`. That breaks hydration for any template using
      // `*ngIf="screen_width<=991"` — SSR evaluates `undefined<=991` as false (mobile
      // branch hidden) while the client computes `window.innerWidth<=991` as true
      // (mobile branch shown). The structural mismatch causes Angular to render a fresh
      // copy of the affected components alongside the SSR one — visible as duplicate
      // header icons (search/cart shown twice) on production. Seeding the same value
      // the client will resolve to keeps SSR and client render identical so hydration
      // claims the DOM cleanly. Values mirror typical viewports: 1440 for desktop UAs
      // (Lighthouse desktop = 1350, real desktops 1280+) and 360 for mobile UAs
      // (Lighthouse mobile = 412, common phones 360-414). Both sides resolve to the
      // same `<=991` / `>=992` outcome.
      if (this.deviceService.isDesktop()) {
        this.commonService.screen_width = 1440;
        this.commonService.screen_height = 900;
      } else {
        this.commonService.screen_width = 360;
        this.commonService.screen_height = 740;
      }
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Capture hamburger before lazy scripts exist so first tap opens the drawer
    this.document.addEventListener('click', this.onHamburgerCapture, true);

    // Passive + rAF-throttled scroll listener: replaces @HostListener('window:scroll').
    // `passive: true` tells the browser we won't preventDefault(), so it can scroll
    // without waiting for our JS — critical for INP on touch devices.
    window.addEventListener('scroll', this.boundScrollHandler, { passive: true });
    // Debounced resize listener: replaces @HostListener('window:resize').
    window.addEventListener('resize', this.boundResizeHandler, { passive: true });

    /** Reveal `.wow` sections via native IntersectionObserver (replaces WOW.js CDN). */
    this.bootstrapWowReveal();
    this.wowRouteSub = merge(
      this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
      this.commonService.wowRevealDomChanged,
    ).subscribe(() => requestAnimationFrame(() => this.rescanWowRevealTargets()));

    const idle: (cb: () => void) => void =
      (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    // Load quill-core.css after first render — used for ql-editor blocks in product/blog/policy pages.
    // Not needed for LCP so defer it out of the critical path.
    idle(() => this.assetLoader.load('quill-css').catch(() => {}));
    idle(() => {
      // network status
      this.connectionService.monitor().subscribe(isConnected => {
        this.isConnected = isConnected;
      });
      // interaction listeners — deferred so they don't block bootstrap TBT
      fromEvent(document, 'mousemove').subscribe(() => this.onInteract());
      fromEvent(document, 'touchmove').subscribe(() => this.onInteract());
      fromEvent(document, 'scroll').subscribe(() => this.onInteract());
      fromEvent(document, 'click').subscribe((event: Event) => this.onInteract(event));
      // check guest address
      if (sessionStorage.getItem("checkout_address")) {
        const checkoutAddress = this.commonService.decryptData(sessionStorage.getItem("checkout_address"));
        if (!checkoutAddress?.shipping?.country) {
          sessionStorage.removeItem("checkout_address");
          window.location.reload();
        }
      }
    });
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.removeEventListener('click', this.onHamburgerCapture, true);
    this.detachPendingNewsletterAutoOpen();
    window.removeEventListener('scroll', this.boundScrollHandler);
    window.removeEventListener('resize', this.boundResizeHandler);
    if (this.resizeDebounce) clearTimeout(this.resizeDebounce);
    this.wowRouteSub?.unsubscribe();
    this.wowRevealObserver?.disconnect();
    this.wowRevealObserver = null;
  }

  /** True only for storefront root `/` (ignore query/hash). Newsletter popup must not arm on deep links. */
  private isStorefrontHomePath(url?: string): boolean {
    const raw = (url ?? this.router.url ?? '').split(/[?#]/)[0];
    return raw === '/' || raw === '';
  }

  private detachPendingNewsletterAutoOpen(): void {
    const fn = this.newsletterOnFirstInteraction;
    if (!fn || !isPlatformBrowser(this.platformId)) return;
    document.removeEventListener('scroll', fn);
    document.removeEventListener('mousemove', fn);
    document.removeEventListener('touchstart', fn);
    document.removeEventListener('keydown', fn);
    this.newsletterOnFirstInteraction = null;
  }

  onInteract(event?: Event) {
    if (this.commonService.storeDataLoaded && !this.intracted) {
      this.intracted = true;
      this.ensureHeaderScripts().catch(error => console.log("err", error));
    }
  }

  /** Lazy-load header/nav scripts once; shared by general interact + first hamburger tap. */
  private ensureHeaderScripts(): Promise<void> {
    if (!this.headerScriptsPromise) {
      this.headerScriptsPromise = this.assetLoader
        .load('jquery')
        .then(() => {
          this.commonService.jsLoaded = true;
          this.intracted = true;
          return this.assetLoader.load('script-js');
        })
        .then(() => undefined);
    }
    return this.headerScriptsPromise;
  }

  /**
   * First hamburger tap often happens before jquery/script.js are loaded.
   * Capture it, load scripts, then open the drawer so the user doesn't need a 2nd tap.
   */
  private onHamburgerCapture = (event: Event): void => {
    const trigger = (event.target as Element | null)?.closest?.('.cd-nav-trigger') as HTMLElement | null;
    if (!trigger) {
      return;
    }

    // Scripts already bound — allow the jQuery handler to run normally
    if (typeof (window as any).__ysOpenMobileNav === 'function') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.ensureHeaderScripts()
      .then(() => {
        const open = (window as any).__ysOpenMobileNav;
        if (typeof open === 'function') {
          open(trigger);
        }
      })
      .catch(() => {});
  };

  ngOnInit() {
    if (this.commonService.store_id) {
      // this.randomNum = localStorage.getItem("random_num");
      // if(!this.randomNum) {
      let cd = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      this.randomNum = cd.getFullYear() + '' + cd.getMonth() + '' + cd.getDate() + '' + cd.getHours() + '' + cd.getMinutes();
      // }
      // site images
      this.commonService.favicon = "uploads/" + this.commonService.store_id + "/favicon.png?v=" + this.randomNum;
      this.commonService.store_logo = "uploads/" + this.commonService.store_id + "/logo.png?v=" + this.randomNum;
      this.commonService.social_logo = "uploads/" + this.commonService.store_id + "/social_logo.jpg?v=" + this.randomNum;
      // primary slider placeholder — uses the SAME `.webp` URLs that:
      //   1. <link rel="preload" as="image"> on `/` injects into index.html
      //   2. SSR's <picture> in home.component.html renders
      //   3. The layout API ultimately returns
      // Keep URLs aligned so preload + `<img>` share one download without an LCP rescan.
      // The previous version used `_s.jpg` URLs mismatched vs preload (~10 s LCP). Don't revert
      // to `_s.jpg` without updating the injected preload URLs in index.html too.
      const mobileHero =
        environment.staticMobileHeroWebpUrl?.trim() ||
        "uploads/" + this.commonService.store_id + "/layouts/mobile_primary_slider.webp";
      this.commonService.primary_main_slider = [{
        "desktop_img": "uploads/" + this.commonService.store_id + "/layouts/desktop_primary_slider.webp",
        "mobile_img": mobileHero
      }];
      // primary highlights
      this.commonService.primary_highlights = [];
      if (this.template_setting.highlights) {
        for (let i = 0; i < this.swiperService.highlights.card_count; i++) {
          this.commonService.primary_highlights.push({ desktop_img: "uploads/yourstore/placeholder.jpg" });
        }
      }
    }
    if (isPlatformBrowser(this.platformId) && !sessionStorage.getItem('sid')) {
      this.commonService.session_id = this.randomString(8) + new Date().valueOf() + this.randomString(8);
      sessionStorage.setItem('sid', this.commonService.session_id);
    }
  }

  ngAfterContentInit() {
    this.commonService.window_loaded = true;
    if (this.commonService.store_id) {
      // favicon
      this.document.getElementById('appFavicon').setAttribute('href', this.imgBaseUrl + this.commonService.favicon);
      /* STORE DETAILS */
      this.storeApi.STORE_DETAILS().subscribe(result => {
        if (result.status) {
          let storeDetails = result.store_details;
          if (storeDetails.status == 'active') {
            let liveCurrencies = result.live_currencies;
            let storeProperties = storeDetails.store_properties[0];
            // ys features
            this.commonService.ys_features = result.ys_features;
            // ip-based currency
            this.commonService.ipBasedCurrency = false;
            if (this.commonService.ys_features.indexOf('ip_based_4_currency') != -1 || this.commonService.ys_features.indexOf('ip_based_10_currency') != -1 || this.commonService.ys_features.indexOf('ip_based_25_plus_currency') != -1) {
              this.commonService.ipBasedCurrency = true;
            }
            // store details
            this.commonService.store_details = {
              name: storeDetails.name, company_details: storeDetails.company_details, country: storeDetails.country,
              additional_features: storeDetails.additional_features, package_details: storeDetails.package_details
            };
            if (storeDetails.gst_no) this.commonService.store_details.gst_no = storeDetails.gst_no;
            if (storeDetails.tax_config) this.commonService.store_details.tax_config = storeDetails.tax_config;
            if (storeDetails.packaging_charges) this.commonService.store_details.packaging_charges = storeDetails.packaging_charges;
            // seo details — update document title + meta as soon as API returns (SSR view-source + first paint)
            this.commonService.seo_details = storeDetails.seo_details;
            if (this.commonService.seo_details) {
              this.commonService.setSiteMetaData(this.commonService.seo_details, null);
            }
            // store properties
            this.commonService.store_properties = {
              pincodes: storeProperties.pincodes, currency_list: storeProperties.currency_list, opening_days: storeProperties.opening_days,
              pickup_locations: [], img_tag_list: [], auto_tags: {}
            };
            if (storeProperties.auto_tags) {
              storeProperties.auto_tags.filter(obj => obj.status == 'active').forEach(el => {
                this.commonService.store_properties.auto_tags[el.type] = el.name;
              });
            }
            if (storeProperties.img_tag_list?.length) {
              this.commonService.store_properties.img_tag_list = storeProperties.img_tag_list.filter(el => el.status == 'active');
            }
            if (this.commonService.ys_features.indexOf('store_pickup') != -1) {
              this.commonService.store_properties.pickup_locations = storeProperties.branches.filter(obj => obj.pickup_location && obj.status == 'active');
            }
            // payment methods
            this.commonService.payment_methods = storeDetails.payment_types;
            // application setting
            if (storeProperties.application_setting) {
              this.commonService.application_setting = storeProperties.application_setting;
              if (this.commonService.application_setting.min_qty) this.commonService.min_qty = this.commonService.application_setting.min_qty;
              if (this.commonService.application_setting.step_qty) this.commonService.step_qty = this.commonService.application_setting.step_qty;
              if (this.commonService.application_setting.customize_name) this.commonService.customize_name = this.commonService.application_setting.customize_name;
            }
            // checkout setting
            if (storeProperties.checkout_setting) this.commonService.checkout_setting = storeProperties.checkout_setting;
            // footer config
            if (storeProperties.footer_config) this.commonService.footer_config = storeProperties.footer_config;
            // giftcard config
            if (storeProperties.giftcard_config) this.commonService.giftcard_config = storeProperties.giftcard_config;
            // Defer all CryptoJS-based localStorage writes to a separate task so they don't block
            // rendering — these are purely cache updates for the next page load, data is in memory.
            setTimeout(() => {
              localStorage.setItem("ys_features", this.commonService.encryptData(this.commonService.ys_features));
              localStorage.setItem("store_details", this.commonService.encryptData(this.commonService.store_details));
              localStorage.setItem("seo_details", this.commonService.encryptData(this.commonService.seo_details));
              localStorage.setItem("store_properties", this.commonService.encryptData(this.commonService.store_properties));
              localStorage.setItem("payment_methods", this.commonService.encryptData(this.commonService.payment_methods));
              localStorage.setItem("application_setting", this.commonService.encryptData(this.commonService.application_setting));
              localStorage.setItem("checkout_setting", this.commonService.encryptData(this.commonService.checkout_setting));
              localStorage.setItem("footer_config", this.commonService.encryptData(this.commonService.footer_config));
              localStorage.setItem("giftcard_config", this.commonService.encryptData(this.commonService.giftcard_config));
            }, 0);
            this.commonService.storeDataLoaded = true;
            this.commonService.storeDataListener.next(true);
            // catalogs
            this.commonService.catalog_list = storeDetails.section_list;
            this.commonService.storeDetailsReceived.next(true);
            this.commonService.storeLoaded = true;
            // menus
            this.commonService.menu_list = storeDetails.menu_list;
            // Build a single O(1) Map before the 4-level menu loop.
            // The previous code called catalog_list.findIndex / .find at every
            // node: ~15 menus × 4 sections × 8 categories × 4 sub-categories ×
            // 300–600 catalog entries ≈ 0.5–2 M comparisons per SSR render.
            // Map lookup collapses that to O(catalog_list.length) once.
            const catalogMap = new Map<string, any>(
              (this.commonService.catalog_list as any[]).map(el => [String(el._id), el])
            );
            this.commonService.menu_list.forEach(menu => {
              menu.sec_count = menu.sections.length + menu.menu_images.length;
              if (menu.sections.length) {
                let secIndex = menu.sections.findIndex(sec => sec.categories.length);
                if (secIndex == -1) {
                  menu.sections_in_one_col = true;
                  menu.sec_count = 1 + menu.menu_images.length;
                }
              }
              if (menu.link_status && menu.link_type == 'category') {
                const c = catalogMap.get(String(menu.category_id));
                if (c) {
                  menu.link_type = 'internal';
                  menu.link = c.seo_status ? '/category/' + c.seo_details?.page_url : '/category/' + c._id;
                }
              }
              // section
              if (menu.sections?.length) {
                menu.sections.forEach(sec => {
                  if (sec.link_status && sec.link_type == 'category') {
                    const c = catalogMap.get(String(sec.category_id));
                    if (c) {
                      sec.link_type = 'internal';
                      sec.link = c.seo_status ? '/category/' + c.seo_details?.page_url : '/category/' + c._id;
                    }
                  }
                  // category
                  if (sec.categories?.length) {
                    sec.categories.forEach(cat => {
                      if (cat.link_status && cat.link_type == 'category') {
                        const c = catalogMap.get(String(cat.category_id));
                        if (c) {
                          cat.link_type = 'internal';
                          cat.link = c.seo_status ? '/category/' + c.seo_details?.page_url : '/category/' + c._id;
                          if (c.image) cat.image = c.image;
                        }
                      }
                      // sub category
                      if (cat.sub_categories?.length) {
                        cat.sub_categories.forEach(subCat => {
                          if (subCat.link_status && subCat.link_type == 'category') {
                            const c = catalogMap.get(String(subCat.category_id));
                            if (c) {
                              subCat.link_type = 'internal';
                              subCat.link = c.seo_status ? '/category/' + c.seo_details?.page_url : '/category/' + c._id;
                              if (c.image) subCat.image = c.image;
                            }
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
            // footer seo links
            this.storeApi.FOOTER_SEO_LINKS().subscribe(result => {
              this.commonService.footer_seo_links = [];
              if (result.status) {
                this.commonService.footer_seo_links = result.list;
                this.commonService.footer_seo_links.forEach(obj => {
                  obj.links.forEach(el => {
                    if (el.link_type == 'category') {
                      // Use the catalogMap already built above — O(1) vs linear scan
                      const c = catalogMap.get(String(el.category_id));
                      if (c) {
                        el.link_type = 'internal';
                        el.link = c.seo_status ? '/category/' + c.seo_details?.page_url : '/category/' + c._id;
                      }
                    }
                  });
                });
              }
              else console.log("fsl response", result);
              // Save SSR state snapshot for client-side hydration.
              // This callback fires AFTER the other sync mutations in the outer
              // STORE_DETAILS handler (announcement bar setup, updateCurrencyValue,
              // newsletter setup) have completed, so all the relevant data fields
              // are populated by the time we serialize. Without this, CommonService
              // on the client starts with empty arrays, the *ngFor over menu_list
              // claims 0 items at hydration, and the 6 SSR-rendered menu items
              // become orphaned DOM → "hasAttribute is not a function" throw.
              if (!isPlatformBrowser(this.platformId)) {
                // Slim snapshot: only include fields that must be present at hydration
                // time so the SSR-rendered DOM matches the client's initial state.
                //
                // Omitted intentionally (save ~20–50 KB of inline JSON):
                //   checkout_setting — only needed on /checkout, not on homepage
                //   giftcard_config  — only needed on /gift-cards
                //
                // payment_methods IS kept: the footer renders payment-badge icons in SSR,
                // so the client needs the same list at hydration time to avoid a structural
                // mismatch. It falls back to localStorage on return visits.
                //
                // catalog_list is trimmed to navigation-only fields (_id, name,
                // seo_status, seo_details.page_url, section_id, parent_id). Dropping
                // banner images, descriptions, and display fields saves ~50–150 KB
                // while keeping all routing and menu-building logic intact.
                const catalogSlim = (this.commonService.catalog_list ?? []).map((c: any) => ({
                  _id: c._id,
                  name: c.name,
                  seo_status: c.seo_status,
                  seo_details: c.seo_details ? { page_url: c.seo_details.page_url } : undefined,
                  section_id: c.section_id,
                  parent_id: c.parent_id,
                }));
                this.transferState.set(SSR_STATE_KEY, {
                  menu_list: slimMenuListForTransfer(this.commonService.menu_list),
                  catalog_list: catalogSlim,
                  ys_features: this.commonService.ys_features,
                  currency_types: this.commonService.currency_types,
                  application_setting: this.commonService.application_setting,
                  ipBasedCurrency: this.commonService.ipBasedCurrency,
                  temp_currency: this.commonService.temp_currency,
                  selected_currency: this.commonService.selected_currency,
                  primary_main_slider: this.commonService.primary_main_slider,
                  store_details: this.commonService.store_details,
                  store_properties: this.commonService.store_properties,
                  seo_details: this.commonService.seo_details,
                  payment_methods: this.commonService.payment_methods,
                  footer_config: this.commonService.footer_config,
                  announcementBar: this.commonService.announcementBar,
                  footer_seo_links: this.commonService.footer_seo_links,
                  storeLoaded: this.commonService.storeLoaded,
                  storeDataLoaded: this.commonService.storeDataLoaded,
                });
              }
            });
            // announcement bar
            if (this.commonService.application_setting.announcebar_status) {
              let abConfig = this.commonService.application_setting.announcebar_config;
              if (abConfig && abConfig.timer && abConfig.timer_date) {
                // TIMER
                const countDownDate = new Date(abConfig.timer_date).getTime();
                if (isPlatformBrowser(this.platformId) && countDownDate > new Date().getTime()) {
                  this.tempAnnounceBar = abConfig.content;
                  this.subscription = interval(1000).subscribe(x => { this.startAnnounceInterval(countDownDate); });
                }
                this.setBodyMarginTop(1100);
              }
              else this.commonService.announcementBar = abConfig.content;
            }
            this.setBodyMarginTop(100);
            // newsletter — only on `/`; one shared handler removes all listeners so navigation
            // away before interact does not leave mousemove/keydown firing the modal on /blogs etc.
            if (this.commonService.application_setting.newsletter_status) {
              let nlConfig = this.commonService.application_setting.newsletter_config;
              nlConfig.sub_heading = nlConfig.sub_heading.replace(new RegExp('\n', 'g'), "<br />");
              if (
                isPlatformBrowser(this.platformId) &&
                nlConfig.open_onload &&
                this.commonService.ys_features.indexOf('newsletter') != -1 &&
                this.isStorefrontHomePath() &&
                !sessionStorage.getItem('newsletter_dismissed')
              ) {
                this.detachPendingNewsletterAutoOpen();
                const onFirstInteraction = (): void => {
                  document.removeEventListener('scroll', onFirstInteraction);
                  document.removeEventListener('mousemove', onFirstInteraction);
                  document.removeEventListener('touchstart', onFirstInteraction);
                  document.removeEventListener('keydown', onFirstInteraction);
                  this.newsletterOnFirstInteraction = null;
                  if (!this.isStorefrontHomePath()) {
                    return;
                  }
                  setTimeout(() => {
                    if (!this.isStorefrontHomePath()) {
                      return;
                    }
                    this.document.getElementById('openSubscribeModal')?.click();
                  }, 500);
                };
                this.newsletterOnFirstInteraction = onFirstInteraction;
                document.addEventListener('scroll', onFirstInteraction, { passive: true });
                document.addEventListener('mousemove', onFirstInteraction);
                document.addEventListener('touchstart', onFirstInteraction, { passive: true });
                document.addEventListener('keydown', onFirstInteraction);
              }
            }
            // chat
            // if(isPlatformBrowser(this.platformId) && this.commonService.ys_features.indexOf('messenger')!=-1 && this.commonService.application_setting.chat_status && this.commonService.application_setting.chat_config.type=='third_party' && this.router.url=='/') {
            //   this.loadChat(this.commonService.application_setting.chat_config.url);
            // }
            // currency types
            this.updateCurrencyValue(storeDetails.currency_types, liveCurrencies);
            // update customer details
            if (this.commonService.customer_token) {
              this.api.USER_DETAILS().subscribe(result => {
                if (result.status) {
                  this.wishService.resetWishList(result.data.wish_list);
                  this.cartService.resetCartList(result.data.cart_list);
                  this.commonService.user_details = {
                    name: result.data.name, email: result.data.email,
                    dial_code: result.data.dial_code, mobile: result.data.mobile
                  };
                  if (result.data.gst) this.commonService.user_details.gst = result.data.gst;
                  localStorage.setItem("user_details", this.commonService.encryptData(this.commonService.user_details));
                }
                else {
                  console.log("user response", result);
                  localStorage.removeItem("customer_token");
                  delete this.commonService.customer_token;
                  localStorage.removeItem("user_details");
                  this.commonService.user_details = {};
                  this.wishService.resetWishList([]);
                  this.cartService.resetCartList([]);
                  this.router.navigate(["/account"]);
                }
              });
            }
          }
          else this.router.navigate(['/others/service-unavailable']);
        }
        else console.log("store response", result);
      });
      /* ROUTER EVENT */
      let currentUrl = this.router.url;
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {

          if (isPlatformBrowser(this.platformId)) {
            const navPath = (event.urlAfterRedirects || event.url || '').split(/[?#]/)[0];
            if (navPath !== '/' && navPath !== '') {
              this.detachPendingNewsletterAutoOpen();
            }
            const isCatalogListingPage = navPath.startsWith('/category/')
              || [
                '/all-products',
                '/new-arrivals',
                '/on-sale',
                '/featured-products',
                '/best-sellers',
                '/recommended-products'
              ].includes(navPath);
            if (this.commonService.desktop_device && isCatalogListingPage) {
              this.vanillaHeadroomRouteFrozen = true;
              this.clearVanillaHeadroomAnimationClasses();
            } else {
              this.vanillaHeadroomRouteFrozen = false;
              this.vanillaHeadroomLastY = window.pageYOffset;
              if (!this.headroomInit && window.pageYOffset > 150) {
                this.headroomInit = true;
              }
              this.applyVanillaHeadroom(window.pageYOffset);
            }
          }

          this.commonService.removeElement('bc-jsonld');
          // SEO
          let routeName = this.location.path();
          let catPages = ['/all-products', '/new-arrivals', '/on-sale', '/featured-products']
          if (catPages.indexOf(routeName) == -1 && routeName.indexOf("/category/") == -1 && routeName.indexOf("/product/") == -1 && routeName.indexOf("/blogs") == -1 && routeName.indexOf("/account") == -1 && routeName.indexOf("/wishlist") == -1 && routeName.indexOf("/contact-us") == -1 && routeName.indexOf("/404") == -1 && routeName.indexOf("/web-stories") == -1) {
            this.commonService.getStoreSeoDetails();
          }
          if (this.router.url != '/') this.setBodyMarginTop(100);
          if (routeName.indexOf("/order-summary/") == -1) {
            /* Tag Manager competes with LCP on Slow 4G — run only when idle (or fallback timeout). */
            const runGa = (): void =>
              this.commonService.loadGoogleAnalytics('UA-102000599-1, AW-847341911', 0);
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
              window.requestIdleCallback(runGa, { timeout: 10000 });
            } else {
              setTimeout(runGa, 8000);
            }
          }
          // chat
          // let appSetting = this.commonService.application_setting;
          // if(this.commonService.ys_features.indexOf('messenger')!=-1 && appSetting.chat_status && appSetting.chat_config.only_on_home && appSetting.chat_config.type=='third_party') {
          //   if(isPlatformBrowser(this.platformId) && this.document.getElementById("third_party_chat")) {
          //     if(event.url=='/') $("#third_party_chat").nextAll("div").attr('style', 'display: block !important; z-index: 1000 !important;');
          //     else $("#third_party_chat").nextAll("div").attr('style', 'display: none !important; z-index: 1000 !important;');
          //   }
          //   else if(event.url=='/') this.loadChat(appSetting.chat_config.url);
          // }
          // prev route
          this.commonService.previous_route = currentUrl;
          currentUrl = event.url.split('?')[0];
          this.currUrl = currentUrl;
          // canonical
          if (this.document.getElementById('ccLink')) this.document.getElementById('ccLink').href = this.commonService.origin + currentUrl;
          //NOTE: This Function Will trigger close event in menu
          this.commonService.resetMegaMenu();
          setTimeout(() => { this.moveNavigation(); }, 0);
        }
      });
    }
  }

  findUrl(menu) {
    let catList = this.commonService.catalog_list;
    let cInd = catList.findIndex(el => el._id == menu.category_id);
    if (cInd != -1) {
      menu.link_type = 'internal';
      menu.link = '/category/' + catList[cInd]._id;
      if (catList[cInd].seo_status) menu.link = '/category/' + catList[cInd].seo_details?.page_url;
    }
    return menu;
  }

  updateCurrencyValue(currencyTypes, liveList) {
    let currencyIndex = currencyTypes.findIndex(obj => obj.default_currency);
    this.commonService.store_details.currency = currencyTypes[currencyIndex].country_code;
    // defer cache write — data already in memory, localStorage is only for next-load caching
    setTimeout(() => localStorage.setItem("store_details", this.commonService.encryptData(this.commonService.store_details)), 0);
    // run in browser side(for overcome ssr country_code unefined error)
    if (isPlatformBrowser(this.platformId)) {
      currencyTypes.forEach(element => {
        let liveIndex = liveList.findIndex(obj => obj.name == element.country_code);
        element.country_inr_value = parseFloat(liveList[liveIndex].rates[this.commonService.store_details.currency].toFixed(2));
      });
      this.commonService.currency_types = currencyTypes;
      // ip based
      if (this.commonService.ipBasedCurrency && this.commonService.store_properties.currency_list.length) {
        let ipIndex = "0"; let ipIndexList = [];
        this.commonService.ip_urls.forEach((element, index) => {
          ipIndexList.push(index.toString());
        });
        if (localStorage.getItem("ip_index")) ipIndex = localStorage.getItem("ip_index");
        ipIndexList.splice(ipIndexList.indexOf(ipIndex), 1);
        // call api(1)
        this.commonService.getIpInfo(ipIndex)
          .then((ipInfo) => { this.getCurrencyType(ipInfo, currencyIndex); })
          .catch((err) => {
            ipIndex = ipIndexList[0]; ipIndexList.splice(0, 1);
            // call api(2)
            this.commonService.getIpInfo(ipIndex)
              .then((ipInfo) => { this.getCurrencyType(ipInfo, currencyIndex); })
              .catch((err) => {
                ipIndex = ipIndexList[0]; ipIndexList.splice(0, 1);
                // call api(3)
                this.commonService.getIpInfo(ipIndex)
                  .then((ipInfo) => { this.getCurrencyType(ipInfo, currencyIndex); })
                  .catch((err) => {
                    console.log("-----err", err);
                    this.commonService.ipBasedCurrency = false;
                    this.setStoreCurrency(currencyIndex);
                  });
              });
          });
      }
      else {
        if (localStorage.getItem("selected_currency")) {
          let selectedCurrency = this.commonService.decryptData(localStorage.getItem("selected_currency"));
          let localIndex = this.commonService.currency_types.findIndex(obj => obj.country_code == selectedCurrency.country_code);
          if (localIndex != -1) { currencyIndex = localIndex; }
          this.setStoreCurrency(currencyIndex);
        }
        else this.setStoreCurrency(currencyIndex);
      }
    }
  }
  getCurrencyType(ipInfo, currencyIndex) {
    if (ipInfo) {
      let countryCurrency = this.commonService.store_properties.currency_list.filter(obj => obj.country_list.findIndex(el => this.optString(el.code) == this.optString(ipInfo.country_code) || this.optString(el.name) == this.optString(ipInfo.country_name)) != -1);
      if (countryCurrency.length) {
        let ipIndex = this.commonService.currency_types.findIndex(obj => obj.country_code == countryCurrency[0].currency_code);
        if (ipIndex != -1) { currencyIndex = ipIndex; }
        this.setStoreCurrency(currencyIndex);
      }
      else this.setStoreCurrency(currencyIndex);
    }
    else this.setStoreCurrency(currencyIndex);
  }
  setStoreCurrency(index) {
    this.commonService.temp_currency = this.commonService.currency_types[index];
    this.commonService.setCurrency(this.commonService.temp_currency);
    setTimeout(() => localStorage.setItem("selected_currency", this.commonService.encryptData(this.commonService.temp_currency)), 0);
  }
  optString(str) {
    return str.replace(/[^A-Z0-9]/ig, "").toLowerCase();
  }

  startAnnounceInterval(tillDate) {
    let distance = tillDate - new Date().getTime();
    if (distance >= 0) {
      let days = Math.floor(distance / (1000 * 60 * 60 * 24));
      let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((distance % (1000 * 60)) / 1000);
      let timer = String(hours).padStart(2, '0') + "h:" + String(minutes).padStart(2, '0') + "m:" + String(seconds).padStart(2, '0') + "s";
      if (days > 0) { timer = String(days).padStart(2, '0') + "d:" + timer; }
      if (this.document.getElementById("announceBar")) {
        if (this.tempAnnounceBar.includes("TIMER")) this.document.getElementById("announceBar").innerHTML = this.tempAnnounceBar.replace("TIMER", timer);
        else this.document.getElementById("announceBar").innerHTML = this.tempAnnounceBar + ' ' + timer;
      }
    }
    else {
      this.commonService.announcementBar = "";
      this.subscription.unsubscribe();
    }
  }

  moveNavigation() {
    let navigation = this.document.querySelector(".cd-nav");
    if (navigation) {
      if (this.commonService.screen_width >= 992) {
        navigation.parentElement.removeChild(navigation);
        this.document.querySelector(".cd-header-buttons")?.after(navigation);
      } else {
        navigation.parentElement.removeChild(navigation);
        this.document.querySelector(".cd-main-content")?.after(navigation);
      }
    }
  }

  // loadChat(src) {
  //   if(isPlatformBrowser(this.platformId) && !this.chatLoaded) {
  //     let script = this.document.createElement("script");
  //     script.type = "text/javascript";
  //     script.id = "third_party_chat";
  //     this.document.getElementsByTagName("body")[0].appendChild(script);
  //     script.src = src;
  //     script.onload = () => {
  //       setTimeout(() => {
  //         // $("#third_party_chat").nextAll("div").attr('style', 'display: block !important; z-index: 1000 !important;');
  //       }, 5000);
  //     }
  //     this.chatLoaded = true;
  //   }
  // }

  setBodyMarginTop(timer: number) {
    setTimeout(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const mastHeight = this.document.getElementById('headroom-head')?.offsetHeight ?? 0;
      // Compare against computed style (picks up the CSS fallback in index.html) so
      // we skip the write — and avoid CLS — when the height hasn't actually changed.
      const computed = parseInt(window.getComputedStyle(this.document.body).marginTop || '0', 10);
      if (mastHeight !== computed) {
        this.document.body.style.marginTop = mastHeight + 'px';
      }
    }, timer);
  }

  randomString(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

}