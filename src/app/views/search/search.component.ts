import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';
import { environment } from './../../../environments/environment';
import {
  activeFilterChips as buildActiveFilterChips,
  countActiveFilterGroups,
  hasCheckedFilters,
  mapAvailableFiltersToTagList
} from '../category/category-api.helpers';
import { matchFilterOption, PRIMARY_FILTER_NAMES, toFilterKey } from './search-filter-options';
import { WishlistService } from '../../services/wishlist.service';
import {
  buildImageFingerprint,
  buildPreviewDataUrl,
  clearSearchSession,
  readSearchSession,
  SearchClassifyCache,
  writeSearchSession
} from './search-session.storage';

interface ActiveFilterChip {
  label: string;
  key: string;
  value: string;
}

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    standalone: false
})
export class SearchComponent implements OnInit, OnDestroy {

  afterSearchEvent: boolean;
  searchLoader: boolean;
  pageLoader: boolean;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  product_list: any = [];
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "Search", position: 2, link: "/search" }
  ];
  productCount: number = 0;
  page: number = 1;
  pageSize: number = 12;

  tag_list: any[] = [];
  priceRange: { min: number; max: number } | null = null;
  filtersPanelOpen: boolean = true;
  moreFiltersOpen = false;
  howItWorksOpen = false;
  readonly demoInspirationImage = 'assets/images/woven-image.png';
  readonly demoPreviewProducts = [
    { name: 'Cream Floral Silk Saree', price: '₹8,450', image: 'assets/images/img-2.jpg' },
    { name: 'Ivory Wedding Silk Saree', price: '₹12,990', image: 'assets/images/img-3.jpg' }
  ];
  readonly demoAiTags = ['Cream', 'Pure Silk', 'Floral', 'Wedding', 'Broad Border'];
  readonly toFilterKey = toFilterKey;

  selectedImageFile: File | null = null;
  imagePreview: string | null = null;
  classifyLoader: boolean = false;
  imageError: string = '';
  imageDetected: boolean = false;
  analysisCached: boolean = false;
  isDragOver: boolean = false;
  fallbackUsed: boolean = false;
  rateLimitCountdown: number = 0;

  private pendingQuery: string | null = null;
  private restorePending = false;
  private sessionRestorePending = false;
  private cachedImageFingerprint: string | null = null;
  private cachedClassification: Record<string, unknown> | null = null;
  private countdownInterval: any;
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageSizeBytes = 5 * 1024 * 1024;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private storeApi: StoreApiService,
    public commonService: CommonService,
    public cc: CurrencyConversionService,
    public ws: WishlistService,
    private router: Router,
    public location: Location,
    private activeRoute: ActivatedRoute
  ) {
    if(this.commonService.ys_features.indexOf('product_search')==-1) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if(!this.commonService.desktop_device) this.filtersPanelOpen = false;
    this.restorePending = !!this.commonService.search_page_attr.search_form;
    if(isPlatformBrowser(this.platformId) && !this.restorePending) {
      this.sessionRestorePending = !!readSearchSession()?.classify;
    }
    this.activeRoute.queryParams.subscribe((params: Params) => {
      this.pendingQuery = params['q'] ? String(params['q']) : null;
      if(this.tag_list.length) this.handleRouteState();
    });
    this.commonService.breadCrumbList(this.bcList);
    this.loadAvailableFilters();
  }

  get activeFilterChips(): ActiveFilterChip[] {
    return buildActiveFilterChips(this.tag_list).map(chip => ({
      label: chip.name,
      key: toFilterKey(chip.name),
      value: chip.value
    }));
  }

  get hasActiveFilters(): boolean {
    return hasCheckedFilters(this.tag_list);
  }

  get activeFilterCount(): number {
    return countActiveFilterGroups(this.tag_list);
  }

  get primaryFilterGroups() {
    return this.tag_list.filter(group => PRIMARY_FILTER_NAMES.includes(group.name));
  }

  get moreFilterGroups() {
    return this.tag_list.filter(group => !PRIMARY_FILTER_NAMES.includes(group.name));
  }

  get moreFiltersSelectedCount(): number {
    return this.moreFilterGroups.filter(group => this.getFilterSelectValue(group)).length;
  }

  get showPagination(): boolean {
    return this.productCount > this.pageSize;
  }

  toggleHowItWorks() {
    this.howItWorksOpen = !this.howItWorksOpen;
  }

  toggleFiltersPanel() {
    this.filtersPanelOpen = !this.filtersPanelOpen;
  }

  toggleMoreFilters() {
    this.moreFiltersOpen = !this.moreFiltersOpen;
  }

  getFilterSelectValue(group: any): string {
    return (group.option_list || []).find((opt: any) => opt.checked)?.name || '';
  }

  onFilterSelectChange(group: any, value: string) {
    group.option_list.forEach((opt: any) => { delete opt.checked; });
    if(value) {
      const option = group.option_list.find((opt: any) => opt.name === value);
      if(option) option.checked = true;
    }
    this.imageDetected = false;
    this.analysisCached = false;
    this.persistSearchSessionState();
  }

  onSearch() {
    if(!this.hasActiveFilters) {
      this.imageError = 'Select at least one filter to search.';
      return;
    }
    this.imageError = '';
    this.afterSearchEvent = true;
    this.searchLoader = true;
    this.page = 1;
    this.fallbackUsed = false;
    if(!this.commonService.desktop_device) this.filtersPanelOpen = false;
    this.runSearchWithFallback();
  }

  onClearFilters() {
    this.clearTagFilter();
    this.imageError = '';
    this.imageDetected = false;
    this.analysisCached = false;
    this.cachedImageFingerprint = null;
    this.cachedClassification = null;
    clearSearchSession();
    this.fallbackUsed = false;
    this.rateLimitCountdown = 0;
    clearInterval(this.countdownInterval);
    this.afterSearchEvent = false;
    this.product_list = [];
    this.productCount = 0;
    this.page = 1;
    this.moreFiltersOpen = false;
    this.clearImageOnly();
  }

  clearTagFilter() {
    this.tag_list.forEach(tag => {
      tag.option_list.forEach((opt: any) => { delete opt.checked; });
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.fetchPage(page);
    this.commonService.pageScrollTop();
  }

  onImageSelected(event: Event) {
    if(!isPlatformBrowser(this.platformId)) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if(file) this.processImageFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if(!isPlatformBrowser(this.platformId)) return;
    const file = event.dataTransfer?.files?.[0];
    if(file) this.processImageFile(file);
  }

  removeActiveChip(chip: ActiveFilterChip) {
    const group = this.tag_list.find(tag => toFilterKey(tag.name) === chip.key);
    const option = group?.option_list?.find((opt: any) => opt.name === chip.value);
    if(option) delete option.checked;
    this.imageDetected = false;
    this.analysisCached = false;
    if(this.afterSearchEvent && this.hasActiveFilters) {
      this.page = 1;
      this.searchLoader = true;
      this.runSearchWithFallback();
    }
    else if(!this.hasActiveFilters) {
      this.afterSearchEvent = false;
      this.product_list = [];
      this.productCount = 0;
    }
  }

  clearImagePreview() {
    this.clearImageOnly();
    this.imageDetected = false;
    this.analysisCached = false;
    this.cachedImageFingerprint = null;
    this.cachedClassification = null;
    clearSearchSession();
  }

  private loadAvailableFilters() {
    if(this.tag_list.length) return;
    this.storeApi.AVAILABLE_FILTERS({ category_id: 'all' }).subscribe(afResult => {
      if(afResult.status) {
        this.applyFiltersResponse(afResult);
      } else {
        console.log('available_filters response', afResult);
        this.tag_list = [];
        this.priceRange = null;
      }
      this.handleRouteState();
    });
  }

  private applyFiltersResponse(result: any) {
    this.tag_list = mapAvailableFiltersToTagList(result.available_filters, {});
    this.priceRange = result.price_range || null;
    if(this.moreFilterGroups.some(group => this.getFilterSelectValue(group))) {
      this.moreFiltersOpen = true;
    }
  }

  private handleRouteState() {
    if(!this.tag_list.length) return;

    if(this.restorePending) {
      this.restorePending = false;
      this.restoreSearchState();
      return;
    }

    if(this.sessionRestorePending) {
      this.sessionRestorePending = false;
      this.restoreClassifySession();
      return;
    }

    if(this.pendingQuery) {
      const materialGroup = this.tag_list.find(group => group.name === 'Material');
      if(materialGroup) {
        const matched = matchFilterOption(
          materialGroup.option_list.map((opt: any) => opt.name),
          this.pendingQuery
        );
        materialGroup.option_list.forEach((opt: any) => { delete opt.checked; });
        const option = materialGroup.option_list.find((opt: any) => opt.name === matched);
        if(option) option.checked = true;
        this.onSearch();
      }
      this.pendingQuery = null;
    }
  }

  onAnalyseClick() {
    if(this.classifyLoader || this.searchLoader) return;
    if(this.analysisCached && this.cachedClassification) {
      this.applyClassification(this.cachedClassification);
      this.imageDetected = true;
      this.onSearch();
      return;
    }
    if(!this.selectedImageFile) return;
    this.classifyAndSearch();
  }

  private processImageFile(file: File) {
    if(!this.allowedImageTypes.includes(file.type)) {
      this.imageError = 'Please upload a JPG, PNG, or WebP image.';
      return;
    }
    if(file.size > this.maxImageSizeBytes) {
      this.imageError = 'Image must be 5MB or smaller.';
      return;
    }

    this.imageError = '';
    this.rateLimitCountdown = 0;
    clearInterval(this.countdownInterval);
    this.imageDetected = false;
    this.analysisCached = false;
    this.cachedImageFingerprint = null;
    this.cachedClassification = null;
    this.selectedImageFile = file;
    if(this.imagePreview && this.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }
    this.imagePreview = URL.createObjectURL(file);

    if(!isPlatformBrowser(this.platformId)) return;
    void this.syncSessionForSelectedFile(file);
  }

  private async syncSessionForSelectedFile(file: File) {
    const session = readSearchSession();
    const classifyCache = session?.classify;

    try {
      const fingerprint = await buildImageFingerprint(file);
      if(classifyCache && classifyCache.imageFingerprint !== fingerprint) {
        writeSearchSession({
          classify: undefined,
          afterSearchEvent: false,
          page: 1,
          fallbackUsed: false,
          filters: {}
        });
        this.analysisCached = false;
        this.cachedClassification = null;
        this.cachedImageFingerprint = null;
        return;
      }

      if(!classifyCache) return;

      this.cachedImageFingerprint = fingerprint;
      this.cachedClassification = classifyCache.classification;
      this.analysisCached = true;
      if(classifyCache.previewDataUrl) {
        if(this.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.imagePreview);
        this.imagePreview = classifyCache.previewDataUrl;
      }
    } catch {
      // ignore fingerprint errors
    }
  }

  private classifyAndSearch() {
    if(!this.selectedImageFile) return;
    this.classifyLoader = true;
    this.imageError = '';
    this.page = 1;
    this.fallbackUsed = false;

    void this.syncSessionForSelectedFile(this.selectedImageFile).then(() => {
      if(this.analysisCached && this.cachedClassification) {
        this.classifyLoader = false;
        this.applyClassification(this.cachedClassification);
        this.imageDetected = true;
        this.onSearch();
        return;
      }

      this.storeApi.CLASSIFY_SAREE(this.selectedImageFile!).subscribe({
        next: result => {
          this.classifyLoader = false;
          if(result.status && result.classification) {
            this.applyClassification(result.classification);
            this.imageDetected = true;
            void this.persistClassifySession(this.selectedImageFile!, result.classification);
            this.onSearch();
          }
          else {
            this.imageError = result.message || 'Could not classify image. Please select filters manually.';
            if(result.retry_after_seconds > 0) {
              this.startCountdown(result.retry_after_seconds);
            }
          }
        },
        error: () => {
          this.classifyLoader = false;
          this.imageError = 'Classification failed. Please try again.';
        }
      });
    });
  }

  private async persistClassifySession(file: File, classification: Record<string, unknown>) {
    if(!isPlatformBrowser(this.platformId)) return;

    try {
      const [imageFingerprint, previewDataUrl] = await Promise.all([
        buildImageFingerprint(file),
        buildPreviewDataUrl(file).catch(() => this.imagePreview || '')
      ]);

      this.cachedImageFingerprint = imageFingerprint;
      this.cachedClassification = classification;
      this.analysisCached = true;

      if(previewDataUrl.startsWith('data:')) {
        if(this.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.imagePreview);
        this.imagePreview = previewDataUrl;
      }

      const classifyCache: SearchClassifyCache = {
        imageFingerprint,
        classification,
        filters: this.getSelectedFiltersMap(),
        previewDataUrl: previewDataUrl.startsWith('data:') ? previewDataUrl : '',
        imageDetected: this.imageDetected,
        cachedAt: Date.now()
      };

      writeSearchSession({
        ...readSearchSession(),
        classify: classifyCache,
        filters: classifyCache.filters
      });
    } catch (error) {
      console.log('classify session persist failed', error);
    }
  }

  private applyClassification(classification: any) {
    const classFilters: Record<string, string[]> = classification.filters || {};
    this.tag_list.forEach(tag => {
      const values = classFilters[tag._id];
      if(!values?.length) return;
      const matched = matchFilterOption(
        tag.option_list.map((opt: any) => opt.name),
        values[0]
      );
      tag.option_list.forEach((opt: any) => { delete opt.checked; });
      const option = tag.option_list.find((opt: any) => opt.name === matched);
      if(option) option.checked = true;
    });
    this.persistSearchSessionState();
  }

  private startCountdown(seconds: number) {
    clearInterval(this.countdownInterval);
    this.rateLimitCountdown = seconds;
    this.countdownInterval = setInterval(() => {
      this.rateLimitCountdown--;
      if(this.rateLimitCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.rateLimitCountdown = 0;
        this.imageError = '';
      }
    }, 1000);
  }

  private runSearchWithFallback() {
    const payload = this.buildSearchPayload(0, this.pageSize);
    this.storeApi.SEARCH_PRODUCT_EXACT(payload).subscribe({
      next: result => {
        this.applySearchResult(result);
        this.searchLoader = false;
      },
      error: err => {
        console.log("search error", err);
        this.imageError = 'Search failed. Please try again.';
        this.searchLoader = false;
      }
    });
  }

  private fetchPage(page: number) {
    this.pageLoader = true;
    const skip = (page - 1) * this.pageSize;
    const payload = this.buildSearchPayload(skip, this.pageSize);
    this.storeApi.SEARCH_PRODUCT_EXACT(payload).subscribe(result => {
      this.pageLoader = false;
      if(result.status) this.applySearchResult(result);
      else console.log("response", result);
    });
  }

  private buildSearchPayload(skip: number, limit: number) {
    const filters: Record<string, string[]> = {};
    this.tag_list.forEach(tag => {
      const selected = (tag.option_list || [])
        .filter((opt: any) => opt.checked)
        .map((opt: any) => opt.name);
      if(selected.length) filters[tag._id] = selected;
    });
    return { filters, skip, limit };
  }

  private getSelectedFiltersMap(): Record<string, string> {
    const filters: Record<string, string> = {};
    this.tag_list.forEach(tag => {
      const checked = (tag.option_list || []).find((opt: any) => opt.checked);
      if(checked) filters[toFilterKey(tag.name)] = checked.name;
    });
    return filters;
  }

  private applySelectedFiltersMap(savedFilters: Record<string, string>) {
    Object.entries(savedFilters || {}).forEach(([key, value]) => {
      const group = this.tag_list.find(tag => toFilterKey(tag.name) === key);
      if(!group || !value) return;
      group.option_list.forEach((opt: any) => { delete opt.checked; });
      const option = group.option_list.find((opt: any) => opt.name === value);
      if(option) option.checked = true;
    });
  }

  private applySearchResult(result: any) {
    if(!result.status) return;
    this.fallbackUsed = result.match_type === 'similar';
    this.productCount = result.count;
    const now = new Date();
    const list = result.list || [];
    list.forEach((obj: any) => {
      const activeHold = (obj.user_hold || []).find((h: any) => new Date(h.hold_till) > now);
      if(activeHold) obj.stock = Math.max(0, obj.stock - activeHold.hold_qty);
      obj.temp_selling_price = this.cc.CALC(obj.selling_price);
      obj.temp_discounted_price = this.cc.CALC(obj.discounted_price);
    });
    this.product_list = list;
    this.persistSearchSessionState();
  }

  private persistSearchSessionState() {
    if(!isPlatformBrowser(this.platformId)) return;

    const existing = readSearchSession() || {};
    writeSearchSession({
      ...existing,
      afterSearchEvent: this.afterSearchEvent,
      page: this.page,
      fallbackUsed: this.fallbackUsed,
      filters: this.getSelectedFiltersMap(),
      classify: existing.classify
        ? {
            ...existing.classify,
            filters: this.getSelectedFiltersMap(),
            imageDetected: this.imageDetected
          }
        : undefined
    });
  }

  private restoreClassifySession() {
    const session = readSearchSession();
    const classifyCache = session?.classify;
    if(!classifyCache?.classification) return;

    this.cachedImageFingerprint = classifyCache.imageFingerprint;
    this.cachedClassification = classifyCache.classification;
    this.analysisCached = true;
    this.imageDetected = !!classifyCache.imageDetected;

    if(classifyCache.previewDataUrl) {
      this.imagePreview = classifyCache.previewDataUrl;
    }

    this.applyClassification(classifyCache.classification);

    if(session?.afterSearchEvent && this.hasActiveFilters) {
      this.afterSearchEvent = true;
      this.page = session.page || 1;
      this.fallbackUsed = !!session.fallbackUsed;
      this.searchLoader = true;
      if(this.page > 1) {
        this.fetchPage(this.page);
      } else {
        this.runSearchWithFallback();
      }
      return;
    }

    if(this.moreFilterGroups.some(group => this.getFilterSelectValue(group))) {
      this.moreFiltersOpen = true;
    }
  }

  onSelectProduct(x: any) {
    this.commonService.selected_product = x;
    const selectedFilters = this.getSelectedFiltersMap();
    this.commonService.search_page_attr = {
      search_form: { filters: { ...selectedFilters } },
      product_list: this.product_list,
      scroll_y_pos: this.commonService.scroll_y_pos,
      product_count: this.productCount,
      ai_search_form: { ...selectedFilters },
      fallback_used: this.fallbackUsed,
      image_detected: this.imageDetected,
      page: this.page
    };
    this.persistSearchSessionState();
  }

  onWishlistClick(product: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if(this.commonService.wishListIds.indexOf(product._id) != -1) {
      this.ws.removeFromWishList(product._id);
    } else {
      this.ws.addToWishList(product);
    }
  }

  goToProduct(product: any, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.onSelectProduct(product);
    const url = product.seo_status
      ? `/product/${product.seo_details.page_url}`
      : `/product/${product._id}`;
    this.router.navigate([url]);
  }

  private restoreSearchState() {
    this.afterSearchEvent = true;
    const saved = this.commonService.search_page_attr;
    const savedFilters = saved.ai_search_form || saved.search_form?.filters;
    if(savedFilters) this.applySelectedFiltersMap(savedFilters);
    this.product_list = saved.product_list;
    this.productCount = saved.product_count;
    this.fallbackUsed = !!saved.fallback_used;
    this.imageDetected = !!saved.image_detected;
    this.page = saved.page || 1;
    if(this.moreFilterGroups.some(group => this.getFilterSelectValue(group))) {
      this.moreFiltersOpen = true;
    }
    const scrollPos = saved.scroll_y_pos;
    setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
    this.persistSearchSessionState();
    this.commonService.search_page_attr = {};
  }

  private clearImageOnly() {
    this.selectedImageFile = null;
    if(this.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.imagePreview);
    this.imagePreview = null;
    this.classifyLoader = false;
  }

  ngOnDestroy() {
    if(this.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.imagePreview);
    clearInterval(this.countdownInterval);
  }

}
