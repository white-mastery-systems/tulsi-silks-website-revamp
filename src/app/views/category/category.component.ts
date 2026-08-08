import { Component, OnInit, OnDestroy, AfterViewChecked, Inject, PLATFORM_ID, ViewChild, ElementRef, DOCUMENT, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser, DecimalPipe, CurrencyPipe } from '@angular/common';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { environment } from './../../../environments/environment';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';
import { WishlistService } from '../../services/wishlist.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Options, ChangeContext } from '@angular-slider/ngx-slider';
import {
  isStandardCategoryPage,
  mapAvailableFiltersToTagList,
  buildFiltersPayload,
  buildListV4Payload,
  hasCheckedFilters,
  activeFilterChips,
  buildFilterQueryParamsFromTagList,
  filterParamName,
  categoryRobotsContent,
  isPriceRangeFiltered,
  shouldEmitCategoryItemListSchema
} from './category-api.helpers';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html',
    styleUrls: ['./category.component.scss'],
    standalone: false
})

export class CategoryComponent implements OnInit, OnDestroy, AfterViewChecked {

  tag_list: any = []; params: any = {};
  category_details: any = {};
  parent_list: any = []; list: any = [];
  pageLoader: boolean; tagSelected: boolean;
  imgBaseUrl: string = environment.img_baseurl;
  sort_value: string; current_url: string;
  template_setting: any = environment.template_setting;
  collapseIndex: number; showMore: boolean;
  heroDescExpanded = false;
  heroDescNeedsToggle = false;
  sort_list: any = [
    { name: "Latest", value: "latest" },
    // { name: "Discounted", value: "discounted" },
    { name: "Price: Low to High", value: "price_asc" },
    { name: "Price: High to Low", value: "price_desc" }
  ];
  subscription: Subscription;
  store_tags: any = []; gridType: string = "six";
  rangeMin: number; rangeMax: number;
  sliderMin: number; sliderMax: number;
  priceDisplayMin = '';
  priceDisplayMax = '';
  range_disp: Options = { floor: 0, ceil: 0, animate: false };
  randomProducts: any = []; page: number = 1;
  pageSize: number = this.template_setting.products_per_page;
  bcList: any = []; pageUrl: string;
  IsBrowser: boolean;
  navigationImageList = [];
  showNavigationButtons: boolean = false;
  isKanjivaram: boolean; isBanarasi: boolean; isOrganza: boolean;
  selectedOptions: any = {}; qParams: any = {};

  useV4Catalog = false;
  filtersFromApi = false;
  listLoader = false;
  total = 0;
  totalPages = 0;
  catalog_page_segments: any[] = [];
  blog_list: any[] = [];
  priceRangeBase = { min: 0, max: 0 };
  private priceChange$ = new Subject<void>();
  private priceRangeDirty = false;
  private priceDebounceSub: Subscription;

  get displayProductCount(): number {
    return this.useV4Catalog ? this.total : this.list.length;
  }

  get filterChips() {
    const tagSource = this.filtersDrawerOpen && this.appliedTagListSnapshot
      ? this.appliedTagListSnapshot
      : this.tag_list;
    return activeFilterChips(tagSource);
  }

  get activeFilterCount(): number {
    let count = this.filterChips.length;
    if (this.useV4Catalog) {
      const priceFiltered = this.filtersDrawerOpen && this.filterDraftSnapshot
        ? this.filterDraftSnapshot.priceFiltered
        : this.isPriceFiltered();
      if (priceFiltered) count++;
    }
    return count;
  }

  filtersDrawerOpen = false;
  priceFilterOpen = true;
  showScrollTop = false;
  catalogToolbarPinned = false;
  catalogToolbarHeight = 0;
  catalogToolbarLeft = 0;
  catalogToolbarWidth = 0;
  catalogToolbarRightInset = 0;
  catalogHeaderOffset = 0;

  @ViewChild('catalogToolbarAnchor') catalogToolbarAnchor?: ElementRef<HTMLElement>;
  @ViewChild('catalogToolbarBlock') catalogToolbarBlock?: ElementRef<HTMLElement>;
  @ViewChild('catalogToolbarSentinel') catalogToolbarSentinel?: ElementRef<HTMLElement>;
  @ViewChild('catalogPagination') catalogPagination?: ElementRef<HTMLElement>;
  @ViewChild('heroDescEl') heroDescEl?: ElementRef<HTMLElement>;
  private catalogToolbarScrollHandler?: () => void;
  private catalogToolbarResizeHandler?: () => void;
  private catalogToolbarRafId = 0;
  private catalogToolbarPinInitialized = false;
  private readonly catalogToolbarPinReleaseBufferPx = 12;
  private filterDraftSnapshot: {
    tagList: any[];
    selectedOptions: Record<string, string[]>;
    rangeMin: number;
    rangeMax: number;
    sliderMin: number;
    sliderMax: number;
    priceFiltered: boolean;
  } | null = null;
  private appliedTagListSnapshot: any[] | null = null;
  private filterApplyCommitted = false;
  private readonly scrollTopThresholdPx = 500;
  private scrollTopRafScheduled = false;
  private scrollTopScrollHandler?: () => void;
  private readonly boundScrollTopHandler = (): void => {
    if (!isPlatformBrowser(this.platformId) || this.scrollTopRafScheduled) return;
    this.scrollTopRafScheduled = true;
    requestAnimationFrame(() => {
      this.scrollTopRafScheduled = false;
      this.updateScrollTopVisibility();
    });
  };

  get catalogProductCountLabel(): string {
    const count = this.displayProductCount;
    return `${count} ${count === 1 ? 'product' : 'products'}`;
  }

  get currentSortLabel(): string {
    const match = this.sort_list.find(item => item.value === this.sort_value);
    return match?.name || 'Latest';
  }

  readonly filterModalConfig = { backdrop: true, ignoreBackdropClick: false, keyboard: true };
  readonly sortModalConfig = { backdrop: true, ignoreBackdropClick: false, keyboard: true };

  openFilters() {
    this.captureFilterDraftSnapshot();
    this.appliedTagListSnapshot = this.cloneTagListSnapshot(this.tag_list);
    this.syncSliderFromRange();
    this.priceRangeDirty = false;
    this.priceFilterOpen = true;
    this.collapseIndex = -1;
    this.filterApplyCommitted = false;
    this.filtersDrawerOpen = true;
    this.filterModal?.show();
    if (this.commonService.screen_width < 992) {
      this.commonService.scrollModalTop(500);
    }
  }

  applyFilters() {
    this.filterApplyCommitted = true;
    this.filtersDrawerOpen = false;
    this.filterModal?.hide();

    if (!this.useV4Catalog) {
      return;
    }

    if (this.priceRangeDirty) {
      this.rangeMin = this.sliderMin;
      this.rangeMax = this.sliderMax;
      this.priceRangeDirty = false;
    }

    const tempParams = buildFilterQueryParamsFromTagList(this.tag_list);
    this.selectedOptions = {};
    for (const key in tempParams) {
      if (Object.prototype.hasOwnProperty.call(tempParams, key)) {
        this.selectedOptions[key] = tempParams[key].split('-');
      }
    }

    this.page = 1;
    this.tagSelected = hasCheckedFilters(this.tag_list);
    this.appliedTagListSnapshot = null;
    this.filterDraftSnapshot = null;
    this.navigateCatalogQuery(tempParams);
    this.applyCategoryIndexing();
    this.fetchProductList(1);
  }

  cancelFilters() {
    this.filterApplyCommitted = false;
    this.filtersDrawerOpen = false;
    this.restoreFilterDraftSnapshot();
    this.appliedTagListSnapshot = null;
    this.filterModal?.hide();
  }

  onFiltersHidden() {
    if (!this.filterApplyCommitted) {
      this.restoreFilterDraftSnapshot();
    }
    this.filtersDrawerOpen = false;
    this.filterApplyCommitted = false;
    this.appliedTagListSnapshot = null;
    this.filterDraftSnapshot = null;
  }

  /** Update URL filters without Angular's scroll-to-top restoration. */
  private navigateCatalogQuery(queryParams: Record<string, string>): Promise<boolean> {
    const path = this.router.url.split('?')[0];
    const merged: Record<string, string | null> = { ...queryParams };
    const currentParams = this.activeRoute.snapshot.queryParams;
    const filterKeys = new Set((this.tag_list || []).map(tag => filterParamName(tag.name)));

    for (const key of Object.keys(currentParams)) {
      if (filterKeys.has(key) && !(key in queryParams)) {
        merged[key] = null;
      }
    }

    this.qParams = Object.fromEntries(
      Object.entries(merged).filter(([, value]) => value != null && value !== '')
    ) as Record<string, string>;

    const scrollY = this.getWindowScrollY();
    return this.router.navigate([path], {
      queryParams: merged,
      replaceUrl: true,
      queryParamsHandling: ''
    }).then((success) => {
      this.restoreWindowScrollY(scrollY);
      setTimeout(() => this.restoreWindowScrollY(scrollY), 50);
      setTimeout(() => this.restoreWindowScrollY(scrollY), 200);
      return success;
    });
  }

  trackFilterChip(_index: number, chip: { tagId: string; name: string; value: string }): string {
    return `${chip.tagId}|${chip.name}|${chip.value}`;
  }

  private uncheckFilterOption(
    chip: { tagId: string; name: string; value: string },
    tagLists: any[][]
  ): boolean {
    let changed = false;
    for (const list of tagLists) {
      if (!list?.length) continue;
      const tag = list.find((t: any) => String(t._id) === String(chip.tagId))
        ?? list.find((t: any) => t.name === chip.name);
      const opt = tag?.option_list?.find((o: any) => o.name === chip.value);
      if (opt) {
        opt.checked = false;
        changed = true;
      }
    }
    return changed;
  }

  private getWindowScrollY(): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    return window.scrollY || this.document.documentElement?.scrollTop || this.document.body?.scrollTop || 0;
  }

  private restoreWindowScrollY(scrollY: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const restore = () => {
      try {
        window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, scrollY);
      }
    };
    restore();
    requestAnimationFrame(restore);
    setTimeout(restore, 0);
  }

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  private captureFilterDraftSnapshot(): void {
    this.filterDraftSnapshot = {
      tagList: this.cloneTagListSnapshot(this.tag_list),
      selectedOptions: JSON.parse(JSON.stringify(this.selectedOptions || {})),
      rangeMin: this.rangeMin,
      rangeMax: this.rangeMax,
      sliderMin: this.sliderMin,
      sliderMax: this.sliderMax,
      priceFiltered: this.isPriceFiltered()
    };
  }

  private restoreFilterDraftSnapshot(): void {
    const snap = this.filterDraftSnapshot;
    if (!snap) return;

    this.tag_list = this.cloneTagListSnapshot(snap.tagList);
    this.selectedOptions = JSON.parse(JSON.stringify(snap.selectedOptions || {}));
    this.rangeMin = snap.rangeMin;
    this.rangeMax = snap.rangeMax;
    this.sliderMin = snap.sliderMin;
    this.sliderMax = snap.sliderMax;
    this.syncPriceDisplay();
    this.priceRangeDirty = false;
    this.tagSelected = hasCheckedFilters(this.tag_list);
    this.filterDraftSnapshot = null;
  }

  private cloneTagListSnapshot(tagList: any[]): any[] {
    return (tagList || []).map(tag => ({
      ...tag,
      option_list: (tag.option_list || []).map((opt: any) => ({ ...opt }))
    }));
  }

  private updateScrollTopVisibility(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const y =
      window.scrollY ||
      this.document.documentElement?.scrollTop ||
      this.document.body?.scrollTop ||
      0;
    const next = y > this.scrollTopThresholdPx;
    if (next === this.showScrollTop) return;
    this.showScrollTop = next;
    this.cdr.markForCheck();
  }

  private initScrollTopButton(): void {
    if (!isPlatformBrowser(this.platformId) || this.scrollTopScrollHandler) return;
    this.updateScrollTopVisibility();
    this.scrollTopScrollHandler = this.boundScrollTopHandler;
    this.document.addEventListener('scroll', this.scrollTopScrollHandler, { passive: true, capture: true });
    window.addEventListener('scroll', this.scrollTopScrollHandler, { passive: true });
  }

  private teardownScrollTopButton(): void {
    if (!this.scrollTopScrollHandler || !isPlatformBrowser(this.platformId)) return;
    this.document.removeEventListener('scroll', this.scrollTopScrollHandler, true);
    window.removeEventListener('scroll', this.scrollTopScrollHandler);
    this.scrollTopScrollHandler = undefined;
    this.showScrollTop = false;
  }

  togglePriceFilterSection() {
    this.priceFilterOpen = !this.priceFilterOpen;
    if (this.priceFilterOpen) this.collapseIndex = -1;
  }

  openSortOptions() {
    if (this.commonService.screen_width < 992) {
      this.sortModal.show();
    }
  }

  panelHasFilters(): boolean {
    return hasCheckedFilters(this.tag_list) || this.priceRangeDirty || this.tagSelected;
  }

  categorySchema: any = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://tulsisilks.co.in/#organization",
        "name": "Tulsi Silks",
        "url": "https://tulsisilks.co.in/",
        "logo": "https://tulsisilks.co.in/assets/images/logo.png",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "telephone": "+918072444353",
            "availableLanguage": [
              "en",
              "ta",
              "hi",
              "te",
              "mwr"
            ]
          }
        ],
        "sameAs": [
          "https://www.instagram.com/tulsisilks/",
          "https://x.com/TulsiSilks",
          "https://www.facebook.com/tulsisilks"
        ]
      },
      {
        "@type": "BreadcrumbList"
      },
      {
        "@type": "CollectionPage",
        "inLanguage": "en-IN",
        "isPartOf": { "@id": "https://tulsisilks.co.in/#website" },
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": []
        }
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://tulsisilks.co.in/#localbusiness",
        "name": "Tulsi Silks",
        "url": "https://tulsisilks.co.in/",
        "logo": "https://tulsisilks.co.in/assets/images/logo.png",
        "telephone": "+918072444353",
        "email": "orders@tulsisilks.com",
        "sameAs": [
          "https://www.instagram.com/tulsisilks/",
          "https://x.com/TulsiSilks",
          "https://www.facebook.com/tulsisilks/",
          "https://www.google.com/maps?cid=5155564344403189918",
          "https://www.google.com/m/storepages?q=tulsisilks.co.in&c=IN&hl=en-IN"
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "68, Luz Church Rd, CIT Colony, Mylapore",
          "addressLocality": "Chennai",
          "addressRegion": "Tamil Nadu",
          "postalCode": "600004",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 13.03798928035473,
          "longitude": 80.26038344232762
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "opens": "09:30",
            "closes": "19:30"
          }
        ],
        "hasMap": "https://www.google.com/maps/search/?api=1&query=13.03798928035473,80.26038344232762",
        "areaServed": [
          {
            "@type": "Country",
            "name": "India"
          },
          {
            "@type": "Country",
            "name": "United States"
          },
          {
            "@type": "Country",
            "name": "United Kingdom"
          },
          {
            "@type": "Country",
            "name": "United Arab Emirates"
          }
        ],
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "internationalShipping",
            "value": true
          }
        ],
        "description": "Free delivery within India. Estimated delivery: 4 business days — Free Delivery by Friday. International shipping available (charges apply)."
      }
    ]
  };
  colorCodes: any = {
    "Beige": "#F5F5DC",
    "Black": "#000000",
    "Blue": "#0000FF",
    "Brown": "#A52A2A",
    "Cream": "#FFFDD0",
    "Gold": "#FFD700",
    "Green": "#008000",
    "Grey": "#808080",
    "Lavender": "#E6E6FA",
    "Maroon": "#800000",
    "Magenta": "#FF00FF",
    "Multicolour": null,
    "Orange": "#FFA500",
    "Peach": "#FFDAB9",
    "Pink": "#FFC0CB",
    "Purple": "#800080",
    "Red": "#FF0000",
    "Rust": "#B7410E",
    "Silver": "#C0C0C0",
    "Violet": "#EE82EE",
    "White": "#FFFFFF",
    "Yellow": "#FFFF00",
    "Off White": "#FAF9F6",
    "Burgundy": "#800020",
    "Mustard": "#FFDB58",
    "Lime Green": "#32CD32",
    "Coffee Brown": "#4B3621",
    "Navy Blue": "#000080",
    "Sea Green": "#2E8B57",
    "Turquoise Blue": "#00FFEF"
  };

  categoryFAQSchema: any = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": []
  };

  @ViewChild('navigationScroller') navigationScroller!: ElementRef;
  @ViewChild('imageScroller') imageScroller!: ElementRef;
  @ViewChild('filterModal') filterModal!: ModalDirective;
  @ViewChild('sortModal') sortModal!: ModalDirective;
  isAtStart: boolean = true;
  isAtEnd: boolean = false;
  isImageAtStart: boolean = true;
  isImageAtEnd: boolean = false;
  activeSlideIndex: number = 0;
  /** Bumped on tab change so navigation Swiper re-inits with fresh slides. */
  navSwiperKey = 0;
  expiryData: string = new Date().getFullYear()+1+"-06-30";

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private router: Router, private activeRoute: ActivatedRoute,
    private storeApi: StoreApiService, public cc: CurrencyConversionService, public commonService: CommonService,
    @Inject(DOCUMENT) private document, private decimalPipe: DecimalPipe, private currencyPipe: CurrencyPipe, public ws: WishlistService,
    private cdr: ChangeDetectorRef
  ) {
    this.subscription = this.commonService.currency_type.subscribe(currency => {
      this.findCurrency();
    });
    if (isPlatformBrowser(this.platformId)) this.IsBrowser = true;
    this.priceDebounceSub = this.priceChange$.pipe(debounceTime(300)).subscribe(() => {
      if (this.useV4Catalog && !this.filtersDrawerOpen) {
        this.priceRangeDirty = false;
        this.onPriceRangeApply();
      }
    });
  }

  // Update your ngAfterViewInit method
  ngAfterViewInit() {
    // Initialize button visibility
    setTimeout(() => {
      this.checkNavigationOverflow();
      this.updateNavigationButtonVisibility();
      this.updateImageButtonVisibility();

      // Listen to scroll events
      if (this.navigationScroller) {
        this.navigationScroller.nativeElement.addEventListener('scroll', () => {
          this.updateNavigationButtonVisibility();
        });
      }

      if (this.imageScroller) {
        this.imageScroller.nativeElement.addEventListener('scroll', () => {
          this.updateImageButtonVisibility();
        });
      }

      // Listen to window resize events
      if(isPlatformBrowser(this.platformId)) {
        window.addEventListener('resize', () => {
          this.checkNavigationOverflow();
          this.updateNavigationButtonVisibility();
          this.scheduleHeroDescOverflowCheck();
        });
      }

      this.scheduleCatalogToolbarSticky();
      this.initScrollTopButton();
      this.scheduleHeroDescOverflowCheck();
    }, 100);
  }

  ngAfterViewChecked(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.catalogToolbarAnchor?.nativeElement) {
      this.catalogToolbarPinInitialized = false;
      return;
    }
    if (!this.catalogToolbarPinInitialized) {
      this.catalogToolbarPinInitialized = true;
      this.initCatalogToolbarPin();
    }
  }

  private scheduleCatalogToolbarSticky(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      this.cdr.detectChanges();
      if (this.catalogToolbarAnchor?.nativeElement) {
        this.initCatalogToolbarPin();
      }
    }, 0);
  }

  private initCatalogToolbarPin(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const anchor = this.catalogToolbarAnchor?.nativeElement;
    const block = this.catalogToolbarBlock?.nativeElement;
    if (!anchor || !block) return;

    this.teardownCatalogToolbarScrollListener();
    this.updateCatalogToolbarPin();

    const onScrollOrResize = () => {
      if (this.catalogToolbarRafId) return;
      this.catalogToolbarRafId = requestAnimationFrame(() => {
        this.catalogToolbarRafId = 0;
        this.updateCatalogToolbarPin();
      });
    };

    this.catalogToolbarScrollHandler = onScrollOrResize;
    this.document.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
    window.addEventListener('scroll', onScrollOrResize, { passive: true });

    if (!this.catalogToolbarResizeHandler) {
      this.catalogToolbarResizeHandler = onScrollOrResize;
      window.addEventListener('resize', onScrollOrResize);
    }
  }

  private updateCatalogToolbarPin(): void {
    const anchor = this.catalogToolbarAnchor?.nativeElement;
    const block = this.catalogToolbarBlock?.nativeElement;
    if (!anchor || !block) return;

    const nextOffset = this.getCatalogHeaderOffsetPx();
    const offsetChanged = this.catalogHeaderOffset !== nextOffset;
    this.catalogHeaderOffset = nextOffset;

    const blockHeight = block.offsetHeight || this.catalogToolbarHeight || 0;
    const pagination = this.catalogPagination?.nativeElement;
    // Release sticky filter once pagination reaches the sticky bar area.
    const nearPagination = !!pagination &&
      pagination.getBoundingClientRect().top <= this.catalogHeaderOffset + blockHeight + 16;

    const anchorTop = anchor.getBoundingClientRect().top;
    const pinThreshold = this.catalogHeaderOffset;
    const releaseThreshold = pinThreshold + this.catalogToolbarPinReleaseBufferPx;
    const shouldPin = !nearPagination && (
      this.catalogToolbarPinned
        ? anchorTop <= releaseThreshold
        : anchorTop <= pinThreshold
    );

    if (shouldPin) {
      const anchorRect = anchor.getBoundingClientRect();
      // Match unpinned content insets (Bootstrap col padding), not the column border box.
      const anchorStyles = window.getComputedStyle(anchor);
      const padLeft = parseFloat(anchorStyles.paddingLeft) || 0;
      const padRight = parseFloat(anchorStyles.paddingRight) || 0;
      const leftInset = Math.max(0, Math.round(anchorRect.left + padLeft));
      const rightInset = Math.max(0, Math.round(window.innerWidth - anchorRect.right + padRight));
      const heightChanged = Math.abs(this.catalogToolbarHeight - blockHeight) > 1;
      const changed = !this.catalogToolbarPinned
        || heightChanged
        || offsetChanged
        || this.catalogToolbarLeft !== leftInset
        || this.catalogToolbarRightInset !== rightInset;
      this.catalogToolbarPinned = true;
      this.catalogToolbarHeight = blockHeight;
      this.catalogToolbarLeft = leftInset;
      this.catalogToolbarWidth = Math.round(anchorRect.width);
      this.catalogToolbarRightInset = rightInset;
      if (changed) this.cdr.markForCheck();
      return;
    }

    if (this.catalogToolbarPinned) {
      this.catalogToolbarPinned = false;
      this.catalogToolbarHeight = 0;
      this.catalogToolbarLeft = 0;
      this.catalogToolbarRightInset = 0;
      this.cdr.markForCheck();
    } else if (offsetChanged) {
      this.cdr.markForCheck();
    }
  }

  /**
   * Visible bottom of the site header for sticky catalog toolbar placement.
   * On catalog pages headroom is frozen so the header stays in view.
   */
  private getCatalogHeaderOffsetPx(): number {
    const head = this.document.getElementById('headroom-head') as HTMLElement | null;
    if (!head) {
      return this.commonService.screen_width < 992 ? 129 : 168;
    }
    return Math.max(0, Math.round(head.getBoundingClientRect().bottom));
  }

  private teardownCatalogToolbarScrollListener(): void {
    if (this.catalogToolbarRafId) {
      cancelAnimationFrame(this.catalogToolbarRafId);
      this.catalogToolbarRafId = 0;
    }
    if (this.catalogToolbarScrollHandler && isPlatformBrowser(this.platformId)) {
      this.document.removeEventListener('scroll', this.catalogToolbarScrollHandler, true);
      window.removeEventListener('scroll', this.catalogToolbarScrollHandler);
      this.catalogToolbarScrollHandler = undefined;
    }
  }

  private teardownCatalogToolbarSticky(): void {
    this.teardownCatalogToolbarScrollListener();
    if (this.catalogToolbarResizeHandler && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.catalogToolbarResizeHandler);
      this.catalogToolbarResizeHandler = undefined;
    }
    this.catalogToolbarPinInitialized = false;
    this.catalogToolbarPinned = false;
    this.catalogToolbarHeight = 0;
    this.catalogToolbarLeft = 0;
    this.catalogToolbarWidth = 0;
    this.catalogToolbarRightInset = 0;
  }

  checkNavigationOverflow() {
    if (this.navigationScroller) {
      const scrollWrapper = this.navigationScroller.nativeElement;
      this.showNavigationButtons = scrollWrapper.scrollWidth > scrollWrapper.clientWidth;
    }
  }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((qParams: Params) => {
      this.qParams = Object.assign({}, qParams);
      this.selectedOptions = {};
      for(let key in this.qParams) {
        this.selectedOptions[key] = this.qParams[key].split("-");
      }
      for(let tagData of this.tag_list)
      {
        let paramName = tagData.name.trim().toLowerCase().replace(/ /g, "_");
        if(this.selectedOptions[paramName]) {
          const selected = new Set(
            this.selectedOptions[paramName].map((element: string) =>
              element.trim().toLowerCase().replace(/ /g, '_')
            )
          );
          tagData.option_list.forEach(element => {
            const paramElem = element.name.trim().toLowerCase().replace(/ /g, '_');
            element.checked = selected.has(paramElem);
          });
        }
        else {
          tagData.option_list.forEach(element => {
            element.checked = false;
          });
        }
      }
    });
    this.activeRoute.params.subscribe((params: Params) => {
      this.pageUrl = this.router.url.split('?')[0];
      this.isKanjivaram = false; this.isBanarasi = false; this.isOrganza = false;
      const kanjivaramList: any = [
        "Kanjivaram Silk Sarees",
        "Kanjivaram Tissue Silk Sarees",
        "Kanjivaram Pure Silk Sarees"
      ];
      const banarasiList: any = [
        "Banarasi Silk Sarees"
      ];
      const organzaList: any = [
        "Organza Sarees"
      ];
      this.showMore = false;
      this.heroDescExpanded = false;
      this.heroDescNeedsToggle = false;
      this.params = params; this.tag_list = []; this.randomProducts = [];
      this.navigationImageList = [];
      this.activeSlideIndex = 0;
      if (this.pageUrl == '/recommended-products' || this.pageUrl == '/all-products' || this.pageUrl == '/new-arrivals' || this.pageUrl == '/on-sale' || this.pageUrl == '/featured-products' || this.pageUrl == '/best-sellers') {
        this.params = { category_id: this.pageUrl };
        if (this.commonService.category_page_attr.category_id == this.pageUrl) {
          this.page = this.commonService.category_page_attr.page;
          this.gridType = this.commonService.category_page_attr.grid_type;
          this.sort_value = this.commonService.category_page_attr.sort_value;
          this.collapseIndex = this.commonService.category_page_attr.collapse_index;
          this.category_details = this.commonService.category_page_attr.category_details;
          this.rangeMin = this.commonService.category_page_attr.range_min;
          this.rangeMax = this.commonService.category_page_attr.range_max;
          this.range_disp = this.commonService.category_page_attr.range_disp;
          this.syncSliderFromRange();
          // seo
          this.updateMetaData();
          this.parent_list = this.commonService.category_page_attr.parent_list;
          this.list = this.parent_list;
          this.findCurrency();
          // tag filter
          this.tag_list = this.commonService.category_page_attr.tag_list;
          this.onTagFilter(false);
          let scrollPos = this.commonService.category_page_attr.scroll_y_pos;
          if(isPlatformBrowser(this.platformId)) {
            setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
          }
          this.commonService.category_page_attr = {};
        }
        else {
          this.page = 1; this.sort_value = "latest";
          this.pageLoader = true; this.collapseIndex = 0;
          if (this.pageUrl == '/recommended-products') {
            this.category_details = { name: "Specially curated for you", route: this.pageUrl };
            if (isPlatformBrowser(this.platformId) && sessionStorage.getItem("ai_styles")) {
              let filterList = this.commonService.decryptData(sessionStorage.getItem("ai_styles"));
              this.storeApi.AI_STYLES_FILTER({ styles: filterList }).subscribe(result => {
                setTimeout(() => { this.pageLoader = false; }, 500);
                if (result.status) this.filterProducts(result.list);
                else console.log("c1-response", result, this.pageUrl);
              });
            }
            else this.pageLoader = false;
          }
          else {
            let categoryName = ""; let filterType = "";
            if (this.pageUrl == "/all-products") {
              categoryName = "All Products"; filterType = "all";
            }
            else if (this.pageUrl == "/new-arrivals") {
              categoryName = "New Arrivals"; filterType = "new_arrivals";
            }
            else if (this.pageUrl == "/on-sale") {
              categoryName = "On Sale"; filterType = "discount";
            }
            else if (this.pageUrl == "/featured-products") {
              categoryName = "Featured Products"; filterType = "featured";
            }
            else if (this.pageUrl == "/best-sellers") {
              categoryName = "Best Sellers"; filterType = "best_sellers";
            }
            this.category_details = { name: categoryName, route: this.pageUrl };
            // seo details
            let metaInfo = {
              "all": {
                h1_tag: "All Products - " + this.commonService.store_details?.name,
                page_title: "All Products - Extensive Collection for Every Need | " + this.commonService.store_details?.name,
                meta_desc: "Browse our extensive collection of products at " + this.commonService.store_details?.name + ", catering to a wide range of needs. You can find everything you're looking for here. Start exploring now.",
                meta_keywords: []
              },
              "new_arrivals": {
                h1_tag: "New Arrivals from Tulsi Silks",
                page_title: "Shop the Latest New Arrivals Collections from Tulsi Silks",
                meta_desc: "Explore the latest arrivals at Tulsi Silks and stay ahead of the trends with our newest saree collections. From exquisite sarees to timeless weaves, find the perfect blend of tradition and style. Elevate your wardrobe with premium silk craftsmanship and unmatched elegance. Shop now and experience luxury!",
                meta_keywords: []
              },
              "discount": {
                h1_tag: "On Sale - " + this.commonService.store_details?.name,
                page_title: "On Sale - Great Deals and Discounts | " + this.commonService.store_details?.name,
                meta_desc: "Explore the on-sale items at " + this.commonService.store_details?.name + " and enjoy great deals and discounts. Find high-quality products at affordable prices and make the most of your shopping experience.",
                meta_keywords: []
              },
              "featured": {
                h1_tag: "Featured Products - " + this.commonService.store_details?.name,
                page_title: "Featured Products - Handpicked Selection of Must-Haves | " + this.commonService.store_details?.name,
                meta_desc: "Check out our handpicked selection of featured products at " + this.commonService.store_details?.name + ". Discover the trending and highly recommended must-haves from " + this.commonService.store_details?.name + ".",
                meta_keywords: []
              },
              "best_sellers": {
                h1_tag: "Featured Products - " + this.commonService.store_details?.name,
                page_title: "Featured Products - Handpicked Selection of Must-Haves | " + this.commonService.store_details?.name,
                meta_desc: "Check out our handpicked selection of featured products at " + this.commonService.store_details?.name + ". Discover the trending and highly recommended must-haves from " + this.commonService.store_details?.name + ".",
                meta_keywords: []
              }
            };
            if (metaInfo[filterType]) {
              this.category_details.seo_status = true;
              this.category_details.seo_details = metaInfo[filterType];
            }
            // seo
            this.updateMetaData();
            this.storeApi.FILTERED_PRODUCT_LIST({ type: filterType }).subscribe(result => {
              setTimeout(() => { this.pageLoader = false; }, 500);
              if (result.status) this.filterProducts(result.list);
              else console.log("c2-response", result, this.pageUrl);
            });
          }
          // seo
          this.updateMetaData();
        }
      }
      else if (this.params.category_id) {
        // product list
        if (this.commonService.category_page_attr.category_id == this.params.category_id) {
          const cached = this.commonService.category_page_attr;
          if (isStandardCategoryPage(this.pageUrl) && !cached.use_v4_catalog) {
            this.commonService.category_page_attr = {};
            this.loadStandardCategoryPage();
            return;
          }
          this.page = cached.page;
          this.gridType = cached.grid_type;
          if (cached.use_v4_catalog && !this.template_setting?.category_grid_options && this.gridType !== 'six') {
            this.gridType = 'six';
          }
          this.sort_value = cached.sort_value;
          this.collapseIndex = cached.collapse_index;

          this.category_details = cached.category_details;
          this.isKanjivaram = kanjivaramList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
          if(this.isKanjivaram && this.category_details.name=='Kanjivaram Silk Sarees') this.isKanjivaram = false;
          this.isBanarasi = banarasiList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
          if(this.isBanarasi && this.category_details.name=='Banarasi Silk Sarees') this.isBanarasi = false;
          this.isOrganza = organzaList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
          if(this.isOrganza && this.category_details.name=='Organza Sarees') this.isOrganza = false;

          this.rangeMin = this.commonService.category_page_attr.range_min;
          this.rangeMax = this.commonService.category_page_attr.range_max;
          this.range_disp = this.commonService.category_page_attr.range_disp;
          this.syncSliderFromRange();
          this.randomProducts = this.commonService.category_page_attr.random_products;
          if (this.category_details?.faqs?.length) this.buildFAQSchema();
          // seo
          this.updateMetaData();
          this.parent_list = this.commonService.category_page_attr.parent_list;
          this.list = this.parent_list;
          this.findCurrency();
          this.tag_list = this.commonService.category_page_attr.tag_list;
          this.useV4Catalog = !!this.commonService.category_page_attr.use_v4_catalog;
          this.filtersFromApi = !!this.commonService.category_page_attr.filters_from_api;
          this.total = this.commonService.category_page_attr.total || this.list.length;
          this.catalog_page_segments = this.commonService.category_page_attr.catalog_page_segments || [];
          this.priceRangeBase = this.commonService.category_page_attr.price_range_base || this.priceRangeBase;
          if (this.useV4Catalog) {
            this.tagSelected = hasCheckedFilters(this.tag_list);
          } else {
            this.onTagFilter(false);
          }
          let scrollPos = this.commonService.category_page_attr.scroll_y_pos;
          if (this.category_details.navigationList?.length) {
            this.onSelectNav(this.activeSlideIndex);
          }
          if(isPlatformBrowser(this.platformId)) {
            setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
          }
          this.commonService.category_page_attr = {};
        }
        else {
          this.loadStandardCategoryPage();
        }
      }
    });
  }

  /** Resolve navigation card image — API may use `image` or nested `images[0].image`. */
  navigationImageSrc(item: any): string {
    if (!item) return '';
    const path =
      item.image ||
      item.images?.[0]?.image ||
      this.lookupCatalogListImage(item) ||
      '';
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return path;
    return this.imgBaseUrl + path;
  }

  private lookupCatalogListImage(item: any): string | null {
    const id = item?.category_id || item?._id;
    const cat = this.commonService.catalog_list?.find((c: any) =>
      (id && c._id === id) ||
      (item?.page_url && c.seo_details?.page_url === item.page_url)
    );
    return cat?.image || null;
  }

  /** True when tab uses the avatar/group layout (explicit flag or items carry `images[]`). */
  navigationTabIsMultiImages(index: number): boolean {
    const navList = [...(this.category_details?.navigationList || [])].sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
    );
    return this.navigationTabIsMultiImagesForTab(navList[index]);
  }

  /** Card layout for the active navigation tab — driven by tab name, not tab index. */
  navigationTabLayout(index: number): 'group' | 'material' | 'card' | 'pair' {
    const navList = [...(this.category_details?.navigationList || [])].sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
    );
    const tab = navList[index];
    if (!tab) return 'card';
    if (this.navigationTabIsMultiImagesForTab(tab)) return 'group';
    const count = this.navigationTabImageCount(tab);
    if (count >= 2 && count <= 4) return 'pair';
    const name = (tab.name || '').toLowerCase();
    if (name.includes('material')) return 'material';
    // Weave / Region / Occasion / Colour etc. use the standard image + heading card
    return 'card';
  }

  private navigationTabImageCount(tab: any): number {
    return (tab?.image_list || []).filter((el: any) => el.isActive !== false).length;
  }

  navigationSectionStyle(): Record<string, string> {
    const layout = this.navigationTabLayout(this.activeSlideIndex);
    if (layout === 'pair') {
      return {
        'min-height': this.commonService.desktop_device ? '300px' : '220px',
        'max-height': this.commonService.desktop_device ? '300px' : 'none'
      };
    }
    return {
      'min-height': this.commonService.desktop_device ? '350px' : '240px',
      'max-height': this.commonService.desktop_device ? '350px' : 'none'
    };
  }

  private navigationTabIsMultiImagesForTab(tab: any): boolean {
    if (!tab) return false;
    if (tab.isMultiImages) return true;
    const list = tab.image_list || [];
    return list.some((item: any) => item?.isActive !== false && !item?.image && item?.images?.length);
  }

  navigationSwiperClass(index: number): string {
    const layout = this.navigationTabLayout(index);
    const desktop = this.commonService.desktop_device;
    switch (layout) {
      case 'group': return desktop ? 'desktop_ghls' : 'ghls';
      case 'material': return desktop ? 'desktop_mhls' : 'mhls';
      case 'pair': return 'pair_hls';
      default: return desktop ? 'desktop_phls' : 'phls';
    }
  }

  onSelectNav(index: number) {
    this.activeSlideIndex = index;
    const navList = [...(this.category_details?.navigationList || [])].sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
    );
    const tab = navList[index];
    if (!tab?.image_list?.length) {
      this.navigationImageList = [];
      return;
    }
    this.navigationImageList = tab.image_list.filter((el: any) => el.isActive !== false);
    this.navSwiperKey++;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.checkNavigationOverflow();
      this.scrollToSelectedNav(index);
      this.updateNavigationButtonVisibility();
    }, 0);
  }

  // Add these new methods
  scrollNav(direction: string) {
    const scrollWrapper = this.navigationScroller.nativeElement;
    const scrollAmount = 200;

    if (direction === 'left') {
      scrollWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      scrollWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    setTimeout(() => this.updateNavigationButtonVisibility(), 300);
  }

  scrollImages(direction: string) {
    const scrollWrapper = this.imageScroller.nativeElement;
    const scrollAmount = 270; // Slightly more than image width

    if (direction === 'left') {
      scrollWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      scrollWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    setTimeout(() => this.updateImageButtonVisibility(), 300);
  }

  scrollToSelectedNav(index: number) {
    if (this.navigationScroller?.nativeElement) {
      const scrollWrapper = this.navigationScroller.nativeElement as HTMLElement;
      const selectedItem = scrollWrapper.children.item(index);

      if (selectedItem instanceof HTMLElement) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }

  updateNavigationButtonVisibility() {
    if (this.navigationScroller && this.showNavigationButtons) {
      const scrollWrapper = this.navigationScroller.nativeElement;
      this.isAtStart = scrollWrapper.scrollLeft <= 5;
      this.isAtEnd = scrollWrapper.scrollLeft >= (scrollWrapper.scrollWidth - scrollWrapper.clientWidth - 5);
    }
  }


  updateImageButtonVisibility() {
    if (this.imageScroller) {
      const scrollWrapper = this.imageScroller.nativeElement;
      this.isImageAtStart = scrollWrapper.scrollLeft <= 5;
      this.isImageAtEnd = scrollWrapper.scrollLeft >= (scrollWrapper.scrollWidth - scrollWrapper.clientWidth - 5);
    }
  }

  loadCategoryArticles() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!(this.commonService.ys_features?.indexOf('blogs') > -1)) return;
    this.storeApi.HOME_PAGE_BLOG_LIST(4).subscribe(result => {
      if (result.status) this.blog_list = (result.list || []).slice(0, 4);
      else console.log('category blog list response', result);
    });
  }

  hasCatalogBlogsSegment(): boolean {
    return this.hasCatalogSegment('blogs');
  }

  hasCatalogSegment(type: string): boolean {
    return (this.catalog_page_segments || []).some(
      s => s.type === type && s.active_status !== false
    );
  }

  internalLinksColumns(links: any[], columnCount = 3): any[][] {
    const items = links || [];
    if (!items.length) return [];
    const perCol = Math.ceil(items.length / columnCount);
    const columns: any[][] = [];
    for (let i = 0; i < columnCount; i++) {
      const chunk = items.slice(i * perCol, (i + 1) * perCol);
      if (chunk.length) columns.push(chunk);
    }
    return columns;
  }

  onInternalLinkClick(item: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!item) return;
    if (item.link_type === 'internal' && item.link) {
      const path = item.link.startsWith('/') ? item.link : '/' + item.link;
      this.router.navigateByUrl(path);
      return;
    }
    this.commonService.onPageRedirect({
      ...item,
      link_status: item.link_status !== false
    });
  }

  trackInternalLink(index: number, item: any): string {
    return `${item?.link || item?.name || index}`;
  }

  categoryHeroImage(): string | null {
    const d = this.category_details;
    if (!d) return null;
    return d.banner_image || d.image || null;
  }

  hasCategoryHero(): boolean {
    return !!this.categoryHeroImage();
  }

  toggleHeroDesc(): void {
    this.heroDescExpanded = !this.heroDescExpanded;
    this.cdr.markForCheck();
  }

  private evaluateHeroDescToggle(fromDom = false): void {
    const html = this.category_details?.description || '';
    if (!html) {
      this.heroDescNeedsToggle = false;
      return;
    }

    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    // Mobile ~4 lines; show toggle when description is longer than a short blurb.
    let needs = text.length > 140;

    if (fromDom && isPlatformBrowser(this.platformId) && !this.heroDescExpanded) {
      const el = this.heroDescEl?.nativeElement;
      if (el) {
        needs = el.scrollHeight > el.clientHeight + 2 || text.length > 140;
      }
    }

    if (needs !== this.heroDescNeedsToggle) {
      this.heroDescNeedsToggle = needs;
      this.cdr.markForCheck();
    }
  }

  private scheduleHeroDescOverflowCheck(): void {
    this.evaluateHeroDescToggle(false);
    if (!isPlatformBrowser(this.platformId)) return;
    // Hero is inside *ngIf="!pageLoader" — re-check after it mounts.
    setTimeout(() => this.evaluateHeroDescToggle(true), 0);
    setTimeout(() => this.evaluateHeroDescToggle(true), 200);
    setTimeout(() => this.evaluateHeroDescToggle(true), 600);
    setTimeout(() => this.evaluateHeroDescToggle(true), 900);
  }

  private updateHeroDescToggleNeed(): void {
    this.evaluateHeroDescToggle(true);
  }

  productGridColClass(): Record<string, boolean> {
    return {
      'col-md-6': this.gridType === 'two',
      'col-md-4': this.gridType === 'three',
      'col-md-3': this.gridType === 'four',
      'col-grid-six': this.gridType === 'six',
    };
  }

  buildFAQSchema() {
    this.categoryFAQSchema.mainEntity = [];
    this.category_details.faqs.forEach(el => {
      this.categoryFAQSchema.mainEntity.push({
        "@type": "Question",
        "name": el.ques,
        "acceptedAnswer": { "@type": "Answer", "text": el.answer }
      });
    });
    this.commonService.removeElement('category-faq-jsonld');
    this.commonService.createJsonLD("category-faq-jsonld", this.categoryFAQSchema);
  }

  private applyCategoryFlags(kanjivaramList: string[], banarasiList: string[], organzaList: string[]) {
    this.isKanjivaram = kanjivaramList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
    if (this.isKanjivaram && this.category_details.name == 'Kanjivaram Silk Sarees') this.isKanjivaram = false;
    this.isBanarasi = banarasiList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
    if (this.isBanarasi && this.category_details.name == 'Banarasi Silk Sarees') this.isBanarasi = false;
    this.isOrganza = organzaList.some(item => this.category_details.name.toLowerCase().includes(item.toLowerCase()));
    if (this.isOrganza && this.category_details.name == 'Organza Sarees') this.isOrganza = false;
  }

  loadStandardCategoryPage() {
    const kanjivaramList = ['Kanjivaram Silk Sarees', 'Kanjivaram Tissue Silk Sarees', 'Kanjivaram Pure Silk Sarees'];
    const banarasiList = ['Banarasi Silk Sarees'];
    const organzaList = ['Organza Sarees'];

    this.loadCategoryArticles();

    this.page = 1;
    this.sort_value = 'latest';
    this.pageLoader = true;
    this.collapseIndex = -1;
    this.priceFilterOpen = true;
    this.useV4Catalog = true;
    this.catalog_page_segments = [];

    this.storeApi.AVAILABLE_FILTERS({ category_id: this.params.category_id }).subscribe(afResult => {
      if (afResult.status) {
        this.filtersFromApi = true;
        this.applyAvailableFiltersResponse(afResult);
      } else {
        console.log('available_filters response', afResult);
        this.tag_list = [];
        this.filtersFromApi = true;
      }
      this.fetchProductList(1, true, kanjivaramList, banarasiList, organzaList, true);
    });
  }

  applyAvailableFiltersResponse(result: any) {
    this.tag_list = mapAvailableFiltersToTagList(result.available_filters, this.qParams);
    if (result.price_range) {
      this.priceRangeBase = { min: result.price_range.min, max: result.price_range.max };
      const min = this.cc.CALC(result.price_range.min);
      const max = this.cc.CALC(result.price_range.max);
      if (!isNaN(min) && !isNaN(max) && max > 0) {
        this.setPriceRange(min, max);
      }
    }
    this.tagSelected = hasCheckedFilters(this.tag_list);
  }

  fetchProductList(
    page = this.page,
    initialLoad = false,
    kanjivaramList?: string[],
    banarasiList?: string[],
    organzaList?: string[],
    includeMetadata = false
  ) {
    if (!this.useV4Catalog) return;
    this.listLoader = true;

    const minInr = this.rangeMin ? this.cc.CONVERT_TO_INR(this.rangeMin) : this.priceRangeBase.min;
    const maxInr = this.rangeMax ? this.cc.CONVERT_TO_INR(this.rangeMax) : this.priceRangeBase.max;
    const payload = buildListV4Payload({
      categoryId: this.params.category_id,
      page,
      limit: this.pageSize,
      sortBy: this.sort_value || 'latest',
      minPriceInr: minInr || this.priceRangeBase.min || 0,
      maxPriceInr: maxInr || this.priceRangeBase.max || 0,
      filters: buildFiltersPayload(this.tag_list),
      includeMetadata
    });

    this.storeApi.PRODUCT_LIST_V4(payload).subscribe(result => {
      if (initialLoad) setTimeout(() => {
        this.pageLoader = false;
        this.scheduleHeroDescOverflowCheck();
      }, 500);
      this.listLoader = false;
      this.scheduleCatalogToolbarSticky();
      if (result.status) {
        this.applyListV4Response(result, page, kanjivaramList, banarasiList, organzaList, includeMetadata);
      } else {
        console.log('list_v4 response', result, this.pageUrl);
        if (initialLoad) this.router.navigate(['/']);
      }
    });
  }

  applyListV4Response(
    result: any,
    page: number,
    kanjivaramList?: string[],
    banarasiList?: string[],
    organzaList?: string[],
    includeMetadata = false
  ) {
    this.page = page;
    this.total = result.total || 0;
    this.totalPages = result.total_pages || 1;

    if (includeMetadata) {
      this.catalog_page_segments = result.catalog_page_segments || [];
      this.category_details = result.category_details || {};

      if (kanjivaramList && banarasiList && organzaList) {
        this.applyCategoryFlags(kanjivaramList, banarasiList, organzaList);
      }

      if (this.category_details.navigationList?.length) {
        this.category_details.navigationList = this.category_details.navigationList.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
        this.onSelectNav(0);
      } else {
        this.navigationImageList = [];
      }
      if (this.category_details?.faqs?.length) this.buildFAQSchema();
      this.updateMetaData();
      this.scheduleHeroDescOverflowCheck();
    }

    this.parent_list = this.processRawProducts(result.list || []);
    this.list = this.parent_list;
    this.setCategorySchema();
    this.findCurrency();
  }

  processRawProducts(rawList: any[]): any[] {
    const products: any[] = [];
    rawList.forEach(object => {
      object.created_on = new Date(new Date(new Date(object.created_on).setHours(23, 59, 59, 59)).setDate(new Date(object.created_on).getDate() + 30));
      if (object.badge_list?.length) object.badge_list = this.commonService.buildTags(object.badge_list);
      if (object.hold_till) {
        let balanceStock = object.stock;
        if (new Date() < new Date(object.hold_till)) balanceStock = object.stock - object.hold_qty;
        object.stock = balanceStock;
      }
      if (object.user_hold?.length && isPlatformBrowser(this.platformId)) {
        const sessionId = sessionStorage.getItem('session_id');
        const hold = object.user_hold.find((h: any) => h.session_id === sessionId);
        if (hold && new Date() < new Date(hold.hold_till)) {
          object.stock = Math.max(0, object.stock - (hold.hold_qty || 0));
        }
      }
      if (this.commonService.store_details?.additional_features?.disp_all_products) {
        if (object.stock < this.commonService.min_qty[object.unit]) object.stock = 0;
        products.push(object);
      } else if (object.stock >= this.commonService.min_qty[object.unit] || object.allow_preorder) {
        products.push(object);
      }
    });
    return products;
  }

  onSortChange() {
    if (!this.useV4Catalog) return;
    this.page = 1;
    this.applyCategoryIndexing();
    this.fetchProductList(1);
  }

  onPageChange(p: number) {
    this.page = p;
    if (this.useV4Catalog) {
      this.fetchProductList(p);
      this.applyCategoryIndexing();
    }
    this.scrollToCatalogToolbar();
  }

  /** Scroll to the product toolbar (not document top) so sticky header stays clear. */
  private scrollToCatalogToolbar(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const anchor = this.catalogToolbarAnchor?.nativeElement;
    if (!anchor) {
      this.commonService.pageScrollTop();
      return;
    }
    const headerOffset = this.getCatalogHeaderOffsetPx();
    const top = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - headerOffset - 8);
    try {
      window.scrollTo({ top, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, top);
    }
  }

  onPriceUserChange(ctx: ChangeContext) {
    this.syncPriceDisplay(ctx.value, ctx.highValue ?? this.sliderMax);
  }

  onPriceRangeEnd() {
    if (!this.useV4Catalog) return;
    this.priceRangeDirty = true;
    this.syncPriceDisplay();
    if (!this.filtersDrawerOpen) {
      this.rangeMin = this.sliderMin;
      this.rangeMax = this.sliderMax;
      this.priceChange$.next();
    }
  }

  onPriceRangeApply() {
    this.page = 1;
    if (this.useV4Catalog) this.applyCategoryIndexing();
    this.fetchProductList(1);
  }

  onFilterAccordionClick(index: number) {
    this.collapseIndex = this.collapseIndex === index ? -1 : index;
    if (this.collapseIndex === index) this.priceFilterOpen = false;
    if (!this.filtersFromApi) this.onCreateTagList(this.list, true);
  }

  removeFilterChip(chip: { tagId: string; name: string; value: string }) {
    const tagLists = [this.tag_list];
    if (this.appliedTagListSnapshot?.length) tagLists.push(this.appliedTagListSnapshot);
    if (this.filterDraftSnapshot?.tagList?.length) tagLists.push(this.filterDraftSnapshot.tagList);

    if (!this.uncheckFilterOption(chip, tagLists)) {
      return;
    }

    const tag = this.tag_list.find((t: any) => String(t._id) === String(chip.tagId))
      ?? this.tag_list.find((t: any) => t.name === chip.name);
    const opt = tag?.option_list?.find((o: any) => o.name === chip.value);

    this.selectedOptions = {};
    const tempParams = buildFilterQueryParamsFromTagList(this.tag_list);
    for (const key in tempParams) {
      if (Object.prototype.hasOwnProperty.call(tempParams, key)) {
        this.selectedOptions[key] = tempParams[key].split('-');
      }
    }

    this.page = 1;
    this.tagSelected = hasCheckedFilters(this.tag_list);
    this.appliedTagListSnapshot = null;
    this.filterDraftSnapshot = null;
    this.cdr.markForCheck();

    if (this.useV4Catalog) {
      this.applyCategoryIndexing();
      if (!this.filtersDrawerOpen) {
        this.navigateCatalogQuery(tempParams).then(() => this.fetchProductList(1));
      } else {
        this.fetchProductList(1);
      }
    } else if (tag && opt) {
      this.onTagNewFilter(tag, opt);
    } else {
      this.onTagFilter(true);
      this.navigateCatalogQuery(tempParams);
    }
  }

  getProductTags() {
    if (isPlatformBrowser(this.platformId)) {
      if (sessionStorage.getItem('pt')) {
        this.store_tags = this.commonService.decryptData(sessionStorage.getItem('pt'));
        this.onCreateTagList(this.list, false);
      }
      else {
        this.storeApi.PRODUCT_TAGS().subscribe(result => {
          if (result.status) {
            this.store_tags = JSON.parse(result.list);
            sessionStorage.setItem('pt', this.commonService.encryptData(this.store_tags));
            this.onCreateTagList(this.list, false);
          }
          else console.log("c4-response", result, this.pageUrl);
        });
      }
    }
    this.findMinMax();
  }

  filterProducts(productList) {
    this.parent_list = [];
    productList.forEach(object => {
      object.created_on = new Date(new Date(new Date(object.created_on).setHours(23, 59, 59, 59)).setDate(new Date(object.created_on).getDate() + 30));
      if (object.badge_list?.length) object.badge_list = this.commonService.buildTags(object.badge_list);
      if (object.hold_till) {
        let balanceStock = object.stock;
        if (new Date() < new Date(object.hold_till)) balanceStock = object.stock - object.hold_qty;
        object.stock = balanceStock;
      }
      if (this.commonService.store_details?.additional_features?.disp_all_products) {
        if (object.stock < this.commonService.min_qty[object.unit]) object.stock = 0;
        this.parent_list.push(object);
      }
      else {
        if (object.stock >= this.commonService.min_qty[object.unit] || object.allow_preorder) this.parent_list.push(object);
      }
    });
    this.list = this.parent_list;
    this.findCurrency();
    this.getProductTags();
  }

  findCurrency() {
    const products = this.useV4Catalog ? this.list : this.parent_list;
    for (let product of products) {
      product.temp_selling_price = this.cc.CALC(product.selling_price);
      product.temp_discounted_price = this.cc.CALC(product.discounted_price);
    }
    if (!this.filtersFromApi) this.findMinMax();
  }

  onWishlistClick(product: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.commonService.wishListIds.indexOf(product._id) !== -1) {
      this.ws.removeFromWishList(product._id);
    } else {
      this.ws.addToWishList(product);
    }
  }

  goToProduct(product: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.onSelectProduct(product);
    const url = product.seo_status
      ? `/product/${product.seo_details.page_url}`
      : `/product/${product._id}`;
    this.router.navigate([url]);
  }

  onSelectProduct(x) {
    this.commonService.selected_product = x;
    // set page attributes
    this.commonService.category_page_attr = {
      category_id: this.params.category_id, page: this.page, sort_value: this.sort_value, tag_list: this.tag_list,
      collapse_index: this.collapseIndex, scroll_y_pos: this.commonService.scroll_y_pos, category_details: this.category_details,
      parent_list: this.parent_list, page_url: this.pageUrl, grid_type: this.gridType, random_products: this.randomProducts,
      range_min: this.rangeMin, range_max: this.rangeMax, range_disp: this.range_disp,
      use_v4_catalog: this.useV4Catalog, filters_from_api: this.filtersFromApi,
      total: this.total, catalog_page_segments: this.catalog_page_segments,
      price_range_base: this.priceRangeBase, total_pages: this.totalPages
    }
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem("category_details", this.commonService.encryptData(this.category_details));
      if (this.template_setting.product_swiper) {
        let swipeProList: any = [];
        this.list.forEach(obj => {
          if (obj.seo_status) swipeProList.push(obj.seo_details.page_url);
          else swipeProList.push(obj._id);
        });
        sessionStorage.setItem("swipe_product_list", this.commonService.encryptData(swipeProList));
      }
    }
  }

  onCreateTagList(list, click) {
    if (this.filtersFromApi) {
      if (!click) this.onTagFilter(false);
      return;
    }
    let duplicateTagList: any = this.tag_list;
    this.tag_list = []; const counts = {};
    list.forEach(prod => {
      if (prod.tag_status) {
        prod.tag_list.forEach(tagObj => {
          let tagId = Object.keys(tagObj)[0];
          let existingTagIndex = duplicateTagList.findIndex(x => x._id == tagId && x.option_list.findIndex(obj => obj.checked) != -1);
          if (existingTagIndex != -1) {
            let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
            if (tagIndex == -1) this.tag_list.push(duplicateTagList[existingTagIndex]);
          }
          else {
            let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
            if (tagIndex == -1) {
              let tIndex = this.store_tags.findIndex(element => element._id == tagId);
              if (tIndex != -1) {
                let optionArray = [];
                tagObj[tagId].forEach(element => {
                  if (counts[element]) { counts[element]++; } 
                  else { counts[element] = 1; }
                  let pushData: any = { name: element, count: counts[element] };
                  let paramName = this.store_tags[tIndex].name.trim().toLowerCase().replace(/ /g, "_");
                  let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
                  if(this.qParams[paramName]?.indexOf(paramElem)>=0) pushData.checked = true;
                  optionArray.push(pushData);
                });
                if (optionArray.length) this.tag_list.push({ _id: tagId, name: this.store_tags[tIndex].name, rank: this.store_tags[tIndex].rank, option_list: optionArray });
              }
            }
            else {
              tagObj[tagId].forEach(element => {
                let optionIndex = this.tag_list[tagIndex].option_list.findIndex(x => x.name == element);
                if (counts[element]) { counts[element]++; } 
                else { counts[element] = 1; }
                if (optionIndex == -1) {
                  let pushData: any = { name: element, count: counts[element] };
                  let paramName = this.tag_list[tagIndex].name.trim().toLowerCase().replace(/ /g, "_");
                  let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
                  if(this.qParams[paramName]?.indexOf(paramElem)>=0) pushData.checked = true;
                  this.tag_list[tagIndex].option_list.push(pushData);
                }
                else{ this.tag_list[tagIndex].option_list[optionIndex].count = counts[element]; }
              });
            }
          }
        });
      }
    });
    this.onTagFilter(false);
  }
  onTagFilter(changeEvent) {
    if (this.useV4Catalog) {
      this.tagSelected = hasCheckedFilters(this.tag_list);
      if (changeEvent) {
        this.page = 1;
        this.fetchProductList(1);
      }
      return;
    }
    let parentProducts: any = this.parent_list;
    this.tagSelected = false;
    let dummyList = [];
    this.tag_list.forEach(tag => {
      let tagId = tag._id;
      if (dummyList.length) { parentProducts = dummyList; dummyList = []; }
      tag.option_list.forEach(tagOption => {
        if (tagOption.checked) {
          this.tagSelected = true;
          let optionName = tagOption.name;
          parentProducts.forEach(prod => {
            prod.tag_list.forEach(prodTag => {
              if (Object.keys(prodTag)[0] == tagId) {
                let tagIndex = prodTag[tagId].findIndex(x => x == optionName);
                if (tagIndex != -1) {
                  // push product
                  let index = dummyList.findIndex(x => x._id == prod._id);
                  if (index == -1) dummyList.push(prod);
                }
              }
            });
          });
        }
      });
    });
    if (this.tagSelected) {
      if (dummyList.length) parentProducts = dummyList;
      this.list = parentProducts;
    }
    else this.list = this.parent_list;
    if (changeEvent) this.page = 1;
    if (!this.filtersFromApi) {
      this.findMinMax();
      let duplicateTagList: any = this.tag_list;
      this.tag_list = []; const counts = {};
      this.list.forEach(prod => {
        if (prod.tag_status) {
          prod.tag_list.forEach(tagObj => {
            let tagId = Object.keys(tagObj)[0];
            let existingTagIndex = duplicateTagList.findIndex(x => x._id.toString() == tagId.toString());
            if (existingTagIndex != -1) {
              let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
              if (tagIndex == -1) this.tag_list.push(duplicateTagList[existingTagIndex]);
            }
            else {
              let tagIndex = this.tag_list.findIndex(x => x._id == tagId);
              if (tagIndex == -1) {
                let tIndex = this.store_tags.findIndex(element => element._id == tagId);
                if (tIndex != -1) {
                  let optionArray = [];
                  tagObj[tagId].forEach(element => {
                    if (counts[element]) { counts[element]++; }
                    else { counts[element] = 1; }
                    let pushData: any = { name: element, count: counts[element] };
                    let paramName = this.store_tags[tIndex].name.trim().toLowerCase().replace(/ /g, "_");
                    let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
                    if(this.qParams[paramName]?.indexOf(paramElem)>=0) pushData.checked = true;
                    optionArray.push(pushData);
                  });
                  if (optionArray.length) this.tag_list.push({ _id: tagId, name: this.store_tags[tIndex].name, rank: this.store_tags[tIndex].rank, option_list: optionArray });
                }
              }
              else {
                tagObj[tagId].forEach(element => {
                  let optionIndex = this.tag_list[tagIndex].option_list.findIndex(x => x.name == element);
                  if (counts[element]) { counts[element]++; }
                  else { counts[element] = 1; }
                  if (optionIndex == -1) {
                    let pushData: any = { name: element, count: counts[element] };
                    let paramName = this.tag_list[tagIndex].name.trim().toLowerCase().replace(/ /g, "_");
                    let paramElem = element.trim().toLowerCase().replace(/ /g, "_");
                    if(this.qParams[paramName]?.indexOf(paramElem)>=0) pushData.checked = true;
                    this.tag_list[tagIndex].option_list.push(pushData);
                  }
                  else{ this.tag_list[tagIndex].option_list[optionIndex].count = counts[element]; }
                });
              }
            }
          });
        }
      });
    }
  }
  clearTagFilter(applyImmediately = true) {
    this.qParams = {};
    this.tag_list.forEach(tag => {
      tag.option_list.forEach(tagOption => { delete tagOption.checked; });
    });
    this.tagSelected = false;
    this.selectedOptions = {};
    if (this.useV4Catalog) {
      this.page = 1;
      if (applyImmediately) {
        this.navigateCatalogQuery(this.qParams);
        this.applyCategoryIndexing();
        this.fetchProductList(1);
        this.appliedTagListSnapshot = null;
        this.filterDraftSnapshot = null;
      }
      return;
    }
    this.list = this.parent_list;
    this.onCreateTagList(this.list, false);
    this.findMinMax();
  }

  onTagNewFilter(x, y) {
    this.page = 1;
    let heading = x.name.trim().toLowerCase().replace(/ /g, "_");
    let option = y.name.trim().toLowerCase().replace(/ /g, "_");
    if(y.checked) {
      if(this.selectedOptions[heading]) {
        if(this.selectedOptions[heading].indexOf(option)==-1) this.selectedOptions[heading].push(option);
      }
      else this.selectedOptions[heading] = [option];
    }
    else {
      if(this.selectedOptions[heading]) {
        let oInd = this.selectedOptions[heading].indexOf(option);
        if(oInd!=-1) {
          this.selectedOptions[heading].splice(oInd, 1);
          if(!this.selectedOptions[heading].length) delete this.selectedOptions[heading];
        }
      }
    }
    let tempParams = {};
    for(let key in this.selectedOptions) {
      if(this.selectedOptions.hasOwnProperty(key)) tempParams[key] = this.selectedOptions[key].join("-");
    }
    if(this.parent_list.length || this.useV4Catalog) {
      if (this.useV4Catalog) {
        if (this.filtersDrawerOpen) {
          return;
        }
        this.tagSelected = hasCheckedFilters(this.tag_list);
        this.applyCategoryIndexing();
        this.fetchProductList(1);
      } else {
        this.onTagFilter(true);
        this.page = 1;
      }
    }
    if (!this.filtersDrawerOpen) {
      this.navigateCatalogQuery(tempParams);
    }
  }

  findMinMax() {
    if (this.commonService.category_page_attr.category_id == this.pageUrl) {

    }
    else if (this.params.category_id && this.commonService.category_page_attr.category_id == this.params.category_id) {

    }
    else {
      let minPrice = this.list.reduce((min, p) => parseFloat(p?.temp_discounted_price) < min ? parseFloat(p?.temp_discounted_price) : min, parseFloat(this.list[0]?.temp_discounted_price));
      let maxPrice = this.list.reduce((max, p) => parseFloat(p?.temp_discounted_price) > max ? parseFloat(p?.temp_discounted_price) : max, parseFloat(this.list[0]?.temp_discounted_price));
      if (!isNaN(minPrice) && !isNaN(maxPrice)) this.setPriceRange(minPrice, maxPrice);
    }
  }

  private setPriceRange(min: number, max: number) {
    this.rangeMin = min;
    this.rangeMax = max;
    this.sliderMin = min;
    this.sliderMax = max;
    this.range_disp = { floor: min, ceil: max, animate: false };
    this.syncPriceDisplay(min, max);
  }

  private syncSliderFromRange() {
    this.sliderMin = this.rangeMin;
    this.sliderMax = this.rangeMax;
    this.syncPriceDisplay(this.sliderMin, this.sliderMax);
  }

  private syncPriceDisplay(min = this.sliderMin, max = this.sliderMax) {
    this.priceDisplayMin = this.formatFilterPrice(min);
    this.priceDisplayMax = this.formatFilterPrice(max);
  }

  private formatFilterPrice(value: number): string {
    if (value == null || isNaN(value)) return '';
    return this.currencyPipe.transform(
      Math.round(value),
      this.cc.pipeCurrencyCode,
      'symbol-narrow',
      '1.0-0',
      this.cc.pipeLocale
    ) ?? '';
  }

  updateMetaData() {
    if (this.category_details.seo_status) this.commonService.setSiteMetaData(this.category_details.seo_details, null);
    else this.commonService.getStoreSeoDetails();
    this.buildBreadcrumbList();
    if (this.useV4Catalog) this.applyCategoryIndexing();
  }

  private buildBreadcrumbList() {
    if (!this.category_details?.name) {
      this.bcList = [{ name: 'Home', position: 1, link: '/' }];
    } else {
      this.bcList = [{ name: 'Home', position: 1, link: '/' }];
      let position = 2;
      if (this.isKanjivaram) {
        this.bcList.push({
          name: 'Kanjivaram Silk Sarees',
          position: position++,
          link: '/category/kanjivaram-silk-sarees'
        });
      } else if (this.isBanarasi) {
        this.bcList.push({
          name: 'Banarasi Silk Sarees',
          position: position++,
          link: '/category/banarasi-silk-sarees'
        });
      } else if (this.isOrganza) {
        this.bcList.push({
          name: 'Organza Sarees',
          position: position++,
          link: '/category/organza-sarees'
        });
      }
      this.bcList.push({
        name: this.category_details.name,
        position: position,
        link: this.pageUrl
      });
    }
    this.commonService.breadCrumbList(this.bcList);
  }

  private isPriceFiltered(): boolean {
    if (!this.useV4Catalog || !this.priceRangeBase.max) return false;
    const minInr = this.rangeMin ? this.cc.CONVERT_TO_INR(this.rangeMin) : this.priceRangeBase.min;
    const maxInr = this.rangeMax ? this.cc.CONVERT_TO_INR(this.rangeMax) : this.priceRangeBase.max;
    return isPriceRangeFiltered(minInr, maxInr, this.priceRangeBase);
  }

  private applyCategoryIndexing() {
    if (!isPlatformBrowser(this.platformId)) return;
    const canonical = this.commonService.origin + this.pageUrl;
    const ccLink = this.document.getElementById('ccLink') as HTMLLinkElement | null;
    if (ccLink) ccLink.href = canonical;

    const robots = categoryRobotsContent({
      page: this.page,
      sortValue: this.sort_value,
      tagList: this.tag_list,
      priceFiltered: this.isPriceFiltered()
    });
    let robotsMeta = this.document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = this.document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      this.document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', robots);
  }

  ngOnDestroy() {
    if (this.priceDebounceSub) this.priceDebounceSub.unsubscribe();
    if (this.subscription) this.subscription.unsubscribe();
    this.teardownCatalogToolbarSticky();
    this.teardownScrollTopButton();
    this.commonService.removeElement('category-jsonld');
    this.commonService.removeElement('category-faq-jsonld');
    if (isPlatformBrowser(this.platformId)) {
      if (this.useV4Catalog) {
        const robotsMeta = this.document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
        if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow');
      }
      window.removeEventListener('resize', () => {
        this.checkNavigationOverflow();
        this.updateNavigationButtonVisibility();
      });
    }
  }

  setCategorySchema() {
    // breadcrumb
    this.categorySchema['@graph'][1]['@id'] = "https://tulsisilks.co.in"+this.pageUrl+"#breadcrumbs";
    this.categorySchema['@graph'][1]['itemListElement'] = [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://tulsisilks.co.in/"
    }];
    if(this.isKanjivaram) {
      this.categorySchema['@graph'][1]['itemListElement'].push({
        "@type": "ListItem",
        "position": 2,
        "name": "Kanjivaram Silk Sarees",
        "item": "https://tulsisilks.co.in/category/kanjivaram-silk-sarees"
      });
    }
    else if(this.isBanarasi) {
      this.categorySchema['@graph'][1]['itemListElement'].push({
        "@type": "ListItem",
        "position": 2,
        "name": "Banarasi Silk Sarees",
        "item": "https://tulsisilks.co.in/category/banarasi-silk-sarees"
      });
    }
     else if(this.isOrganza) {
      this.categorySchema['@graph'][1]['itemListElement'].push({
        "@type": "ListItem",
        "position": 2,
        "name": "Organza Sarees",
        "item": "https://tulsisilks.co.in/category/organza-sarees"
      });
    }
    this.categorySchema['@graph'][1]['itemListElement'].push({
      "@type": "ListItem",
      "position": this.categorySchema['@graph'][1]['itemListElement'].length+1,
      "name": this.category_details.name,
      "item": "https://tulsisilks.co.in"+this.pageUrl
    });
    // item list
    this.categorySchema['@graph'][2]['@id'] = "https://tulsisilks.co.in"+this.pageUrl+"#collection";
    this.categorySchema['@graph'][2]['url'] = "https://tulsisilks.co.in"+this.pageUrl;
    this.categorySchema['@graph'][2]['name'] = this.category_details.name;
    this.categorySchema['@graph'][2]['description'] = this.category_details.seo_details?.meta_desc || '';
    const itemCount = this.useV4Catalog
      ? (this.total || this.category_details.product_count || 0)
      : (this.category_details.product_count || this.parent_list.length || 0);
    if (itemCount) {
      this.categorySchema['@graph'][2]['mainEntity']['numberOfItems'] = itemCount;
    }
    this.categorySchema['@graph'][2]['mainEntity']['itemListElement'] = [];

    const emitItemList = this.useV4Catalog
      ? shouldEmitCategoryItemListSchema({
          page: this.page,
          sortValue: this.sort_value,
          tagList: this.tag_list,
          priceFiltered: this.isPriceFiltered()
        })
      : this.page === 1;

    if (emitItemList) {
      let pageItemList = this.parent_list.sort((a, b) => 0 - (a.rank > b.rank ? 1 : -1)).slice(0, this.pageSize);
      let ind = 0;
      for (let itemData of pageItemList) {
        ind++;
        this.categorySchema['@graph'][2]['mainEntity']['itemListElement'].push(
          {
            "@type": "ListItem",
            "position": ind,
            "url": "https://tulsisilks.co.in/product/" + itemData.seo_details.page_url,
            "item": {
              "@type": "Product",
              "@id": "https://tulsisilks.co.in/product/" + itemData.seo_details.page_url + "#product",
              "name": itemData.name,
              "image": [environment.img_baseurl + itemData.image_list[0].image],
              "description": itemData.seo_details.meta_desc,
              "sku": itemData.sku,
              "offers": {
                "@type": "Offer",
                "priceCurrency": "INR",
                "price": itemData.discounted_price,
                "availability": "https://schema.org/InStock",
                "url": "https://tulsisilks.co.in/product/" + itemData.seo_details.page_url,
                "priceValidUntil": this.expiryData,
                "shippingDetails": {
                  "@type": "OfferShippingDetails",
                  "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": 0,
                    "currency": "INR"
                  },
                  "deliveryTime": {
                    "@type": "ShippingDeliveryTime",
                    "transitTime": {
                      "@type": "QuantitativeValue",
                      "minValue": 4,
                      "maxValue": 7,
                      "unitCode": "d"
                    }
                  },
                  "shippingDestination": [
                    { "@type": "DefinedRegion", "addressCountry": "IN" },
                    { "@type": "DefinedRegion", "addressCountry": "US" },
                    { "@type": "DefinedRegion", "addressCountry": "GB" },
                    { "@type": "DefinedRegion", "addressCountry": "AE" }
                  ]
                },
                "hasMerchantReturnPolicy": {
                  "@type": "MerchantReturnPolicy",
                  "returnPolicyCategory": "MerchantReturnFiniteReturnWindow",
                  "merchantReturnDays": 1,
                  "applicableCountry": "IN",
                  "returnShippingFeesAmount": {
                    "@type": "MonetaryAmount",
                    "currency": "INR",
                    "value": 0
                  },
                  "refundType": "FullRefund",
                  "description": "Free returns within 1 day of delivery. Initiate return via orders@tulsisilks.com or customer service."
                },
                "seller": {
                  "@type": "Organization",
                  "name": "Tulsi Silks",
                  "@id": "https://tulsisilks.co.in/#organization"
                }
              }
            }
          }
        );
      }
    }

    if (this.useV4Catalog && this.priceRangeBase.min && this.priceRangeBase.max) {
      const minPrice = this.decimalPipe.transform(this.priceRangeBase.min, '1.0-0');
      const maxPrice = this.decimalPipe.transform(this.priceRangeBase.max, '1.0-0');
      this.categorySchema['@graph'][3]['priceRange'] = 'INR ' + minPrice + ' - INR ' + maxPrice;
    } else {
      let tempList = this.parent_list.sort((a, b) => 0 - (a.discounted_price > b.discounted_price ? -1 : 1));
      if (tempList.length > 1) {
        let minPrice = this.decimalPipe.transform(tempList[0].discounted_price, '1.0-0');
        let maxPrice = this.decimalPipe.transform(tempList[tempList.length - 1].discounted_price, '1.0-0');
        this.categorySchema['@graph'][3]['priceRange'] = 'INR ' + minPrice + ' - INR ' + maxPrice;
      }
    }

    // JSON-LD — remove first so SPA navigation between categories always injects a fresh block
    this.commonService.removeElement('category-jsonld');
    this.commonService.createJsonLD("category-jsonld", this.categorySchema);
  }

  getRandomProds(arr, num) {
    let shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
  }

}