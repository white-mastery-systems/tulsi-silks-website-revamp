import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { ModalDirective } from 'ngx-bootstrap/modal';
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
  sort_value = 'price_desc';
  readonly sort_list = [
    { name: 'Latest', value: 'latest' },
    { name: 'Price: Low to High', value: 'price_asc' },
    { name: 'Price: High to Low', value: 'price_desc' }
  ];

  tag_list: any[] = [];
  priceRange: { min: number; max: number } | null = null;
  filtersDrawerOpen = false;
  filterCollapseIndex = -1;
  moreFiltersOpen = false;
  howItWorksOpen = false;
  private filterDraftSnapshot: any[] | null = null;
  private appliedTagListSnapshot: any[] | null = null;
  private filterApplyCommitted = false;
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
  loadingStatusText = '';
  imageError: string = '';
  imageDetected: boolean = false;
  analysisCached: boolean = false;
  isDragOver: boolean = false;
  fallbackUsed: boolean = false;
  rateLimitCountdown: number = 0;
  searchQuery: string = '';
  searchPlaceholder = '';
  cameraOpen: boolean = false;
  searchMode: 'text' | 'image' = 'text';
  expandedFilters: Record<string, boolean> = {};

  private pendingQuery: string | null = null;
  private pendingTextQuery: string | null = null;
  private pendingHomeImageFile: File | null = null;
  private restorePending = false;
  private sessionRestorePending = false;
  private cachedImageFingerprint: string | null = null;
  private cachedClassification: Record<string, unknown> | null = null;
  private passColourHint = false;
  private countdownInterval: any;
  private typewriterTimeout: ReturnType<typeof setTimeout> | null = null;
  private loadingStatusInterval: ReturnType<typeof setInterval> | null = null;
  private loadingStatusIndex = 0;
  private wasClassifying = false;
  private readonly analyseLoadingPhrases = [
    'Analysing…',
    'Reading style…',
    'Detecting fabric…',
    'Getting details…'
  ];
  private readonly imageSearchLoadingPhrases = [
    'Finding matches…',
    'Loading sarees…',
    'Almost there…'
  ];
  private typewriterPhraseIndex = 0;
  private typewriterCharIndex = 0;
  private typewriterBackspacing = false;
  private typewriterStopped = false;
  private readonly searchPlaceholderPhrases = [
    "Type 'pink floral linen'...",
    'Or upload a photo to match style...',
    "Type 'traditional temple border'..."
  ];
  private readonly searchPlaceholderActive = 'Describe style, fabric, color, or upload a saree photo...';
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageSizeBytes = 5 * 1024 * 1024;

  @ViewChild('filterModal') filterModal!: ModalDirective;
  @ViewChild('sortModal') sortModal!: ModalDirective;

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
    this.restorePending = !!this.commonService.search_page_attr.search_form;
    if(isPlatformBrowser(this.platformId) && !this.restorePending) {
      this.sessionRestorePending = !!readSearchSession()?.classify;
    }
    if (isPlatformBrowser(this.platformId) && this.commonService.pendingSearchImageFile) {
      this.pendingHomeImageFile = this.commonService.pendingSearchImageFile;
      this.commonService.pendingSearchImageFile = null;
      this.sessionRestorePending = false;
    }
    this.activeRoute.queryParams.subscribe((params: Params) => {
      this.pendingQuery = params['q'] ? String(params['q']) : null;
      this.pendingTextQuery = params['text'] ? String(params['text']).trim() : null;
      if (this.pendingTextQuery) {
        this.searchQuery = this.pendingTextQuery;
        this.stopTypewriterAnimation();
      }
      if(this.tag_list.length) this.handleRouteState();
    });
    this.commonService.breadCrumbList(this.bcList);
    this.loadAvailableFilters();
    if (isPlatformBrowser(this.platformId) && !this.searchQuery.trim()) {
      this.startTypewriterAnimation();
    } else {
      this.typewriterStopped = true;
      this.searchPlaceholder = this.searchPlaceholderActive;
    }
  }

  get activeFilterChips(): ActiveFilterChip[] {
    const tagSource =
      this.filtersDrawerOpen && this.appliedTagListSnapshot
        ? this.appliedTagListSnapshot
        : this.tag_list;
    return buildActiveFilterChips(tagSource).map(chip => ({
      label: chip.name,
      key: toFilterKey(chip.name),
      value: chip.value
    }));
  }

  get hasActiveFilters(): boolean {
    const tagSource =
      this.filtersDrawerOpen && this.appliedTagListSnapshot
        ? this.appliedTagListSnapshot
        : this.tag_list;
    return hasCheckedFilters(tagSource);
  }

  get activeFilterCount(): number {
    const tagSource =
      this.filtersDrawerOpen && this.appliedTagListSnapshot
        ? this.appliedTagListSnapshot
        : this.tag_list;
    return countActiveFilterGroups(tagSource);
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

  get catalogProductCountLabel(): string {
    const count = this.productCount;
    return `${count} ${count === 1 ? 'product' : 'products'}`;
  }

  get currentSortLabel(): string {
    return this.sort_list.find(item => item.value === this.sort_value)?.name || 'Latest';
  }

  get sortEnabled(): boolean {
    return !!this.afterSearchEvent
      && !this.searchLoader
      && (this.product_list?.length > 0);
  }

  get filtersEnabled(): boolean {
    return !!this.afterSearchEvent
      && !this.classifyLoader
      && !this.searchLoader
      && !this.pageLoader;
  }

  get hasUploadedImage(): boolean {
    return !!(this.selectedImageFile || this.imagePreview);
  }

  get showImageLoadingText(): boolean {
    return this.classifyLoader || (this.searchLoader && this.hasUploadedImage);
  }

  get showAiResponsePills(): boolean {
    return false;
  }

  /** Text search needs at least 3 characters before submit is allowed. */
  get canSubmitTextSearch(): boolean {
    return (this.searchQuery || '').trim().length >= 3;
  }

  onSearchInputFocus() {
    this.stopTypewriterAnimation();
  }

  onSearchInputChange() {
    this.stopTypewriterAnimation();
  }

  toggleHowItWorks() {
    this.howItWorksOpen = !this.howItWorksOpen;
  }

  openFilters() {
    if (!this.filtersEnabled) return;
    this.filterDraftSnapshot = this.cloneTagListSnapshot(this.tag_list);
    this.appliedTagListSnapshot = this.cloneTagListSnapshot(this.tag_list);
    this.filterApplyCommitted = false;
    this.filterCollapseIndex = -1;
    this.filterModal.show();
    this.filtersDrawerOpen = true;
  }

  applyFilters() {
    this.filterApplyCommitted = true;
    this.appliedTagListSnapshot = null;
    this.filterDraftSnapshot = null;
    this.filterModal.hide();
    this.filtersDrawerOpen = false;
    this.passColourHint = false;
    this.imageDetected = false;
    this.analysisCached = false;
    this.persistSearchSessionState();

    const hasFilters = hasCheckedFilters(this.tag_list);
    if (!hasFilters && !this.searchQuery.trim() && !this.hasUploadedImage) {
      this.imageError = 'Select at least one filter to apply.';
      return;
    }

    // Image / visual search → exact match API
    if (this.hasUploadedImage || this.searchMode === 'image') {
      this.runFilterSearch();
      return;
    }

    // Text search → normal catalog search API
    if (this.searchQuery.trim() || hasFilters) {
      this.runCatalogSearch();
      return;
    }

    this.imageError = 'Select at least one filter to apply.';
  }

  cancelFilters() {
    this.filterApplyCommitted = false;
    this.restoreFilterDraftSnapshot();
    this.appliedTagListSnapshot = null;
    this.filterModal.hide();
    this.filtersDrawerOpen = false;
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

  panelHasFilters(): boolean {
    return hasCheckedFilters(this.tag_list);
  }

  onFilterAccordionClick(index: number) {
    this.filterCollapseIndex = this.filterCollapseIndex === index ? -1 : index;
  }

  clearFilterDraft() {
    this.clearTagFilter();
  }

  openSortOptions() {
    if (!this.sortEnabled) return;
    if (this.commonService.screen_width < 992) {
      this.sortModal.show();
    }
  }

  onSortChange() {
    if (!this.sortEnabled) return;
    if (this.afterSearchEvent && (this.hasUploadedImage || this.searchMode === 'image')) {
      this.page = 1;
      this.searchLoader = true;
      this.syncImageLoadingStatus();
      this.runSearchWithFallback();
      return;
    }
    if (this.afterSearchEvent && this.searchMode === 'text') {
      this.runCatalogSearch();
      return;
    }
    this.sortProductList();
  }

  toggleCameraPanel() {
    this.cameraOpen = !this.cameraOpen;
  }

  onUploadZoneClick(input: HTMLInputElement, event: MouseEvent) {
    event.stopPropagation();
    input.click();
  }

  onClearImageClick(event: MouseEvent) {
    event.stopPropagation();
    this.clearImagePreview();
  }

  onMainSearch() {
    if(this.selectedImageFile) {
      this.onAnalyseClick();
    } else {
      if (!this.canSubmitTextSearch) return;
      this.onSearch();
    }
  }

  selectPreset(query: string) {
    if (this.hasUploadedImage || this.classifyLoader || this.searchLoader) return;
    this.stopTypewriterAnimation();
    this.searchQuery = query;
    this.onSearch();
  }

  toggleFilterGroup(groupName: string) {
    this.expandedFilters[groupName] = !this.isFilterGroupOpen(groupName);
  }

  isFilterGroupOpen(groupName: string): boolean {
    return !!this.expandedFilters[groupName];
  }

  toggleFilterOption(group: any, option: any) {
    // Multi-select chips — commit to applied chips / API only on Apply
    option.checked = !option.checked;
    this.imageDetected = false;
    this.analysisCached = false;
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
    if (this.hasUploadedImage) return;
    if (!this.canSubmitTextSearch && !this.hasActiveFilters) return;
    if(this.searchQuery.trim() || this.hasActiveFilters) {
      this.runCatalogSearch();
    } else {
      this.imageError = 'Enter a search term or upload a photo to search.';
    }
  }

  private runCatalogSearch() {
    this.imageError = '';
    this.afterSearchEvent = true;
    this.searchLoader = true;
    this.page = 1;
    this.fallbackUsed = false;
    this.searchMode = 'text';
    const payload = this.buildCatalogSearchPayload(0, this.pageSize);
    this.storeApi.SEARCH_PRODUCT(payload).subscribe({
      next: result => {
        this.applySearchResult(result);
        this.searchLoader = false;
        this.persistSearchSessionState();
      },
      error: () => {
        this.imageError = 'Search failed. Please try again.';
        this.searchLoader = false;
      }
    });
  }

  /** @deprecated use runCatalogSearch — kept for image-flow callers */
  private runTextSearch() {
    this.runCatalogSearch();
  }

  runFilterSearch() {
    this.imageError = '';
    this.afterSearchEvent = true;
    this.searchLoader = true;
    this.syncImageLoadingStatus();
    this.page = 1;
    this.fallbackUsed = false;
    this.searchMode = 'image';
    this.runSearchWithFallback();
  }

  onClearFilters() {
    this.clearTagFilter();
    this.passColourHint = false;
    this.imageError = '';
    this.imageDetected = false;
    this.analysisCached = false;
    this.moreFiltersOpen = false;
    this.page = 1;

    // Image session → re-query via search_exact (filters cleared)
    if (this.hasUploadedImage || this.searchMode === 'image') {
      this.persistSearchSessionState();
      this.runFilterSearch();
      return;
    }

    // Text search → normal search by name
    if (this.searchQuery.trim()) {
      this.persistSearchSessionState();
      this.runCatalogSearch();
      return;
    }

    // No search term left — clear results
    this.cachedImageFingerprint = null;
    this.cachedClassification = null;
    clearSearchSession();
    this.fallbackUsed = false;
    this.rateLimitCountdown = 0;
    clearInterval(this.countdownInterval);
    this.afterSearchEvent = false;
    this.product_list = [];
    this.productCount = 0;
    this.clearImageOnly();
    this.persistSearchSessionState();
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
    this.passColourHint = false;
    this.page = 1;

    // Always re-search when a query / image session / filters remain
    if (this.searchQuery.trim() || this.hasActiveFilters || this.hasUploadedImage || this.searchMode === 'image') {
      this.persistSearchSessionState();
      if (this.hasUploadedImage || this.searchMode === 'image') {
        this.searchLoader = true;
        this.syncImageLoadingStatus();
        this.runSearchWithFallback();
      } else {
        this.runCatalogSearch();
      }
      return;
    }

    this.afterSearchEvent = false;
    this.product_list = [];
    this.productCount = 0;
    this.persistSearchSessionState();
  }

  clearImagePreview() {
    this.clearImageOnly();
    this.clearTagFilter();
    this.moreFiltersOpen = false;
    this.passColourHint = false;
    this.imageError = '';
    this.imageDetected = false;
    this.analysisCached = false;
    this.cachedImageFingerprint = null;
    this.cachedClassification = null;
    this.cameraOpen = false;
    this.afterSearchEvent = false;
    this.product_list = [];
    this.productCount = 0;
    this.page = 1;
    this.fallbackUsed = false;
    this.searchMode = 'text';
    clearSearchSession();
    this.persistSearchSessionState();
    if (!this.searchQuery.trim()) {
      this.restartTypewriterAnimation();
    }
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
  }

  private handleRouteState() {
    if(!this.tag_list.length) return;

    if (this.pendingHomeImageFile) {
      const file = this.pendingHomeImageFile;
      this.pendingHomeImageFile = null;
      this.processImageFile(file, { autoAnalyse: true });
      return;
    }

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

    if(this.pendingTextQuery) {
      const text = this.pendingTextQuery;
      this.pendingTextQuery = null;
      this.searchQuery = text;
      this.stopTypewriterAnimation();
      this.runTextSearch();
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
      this.passColourHint = true;
      this.runFilterSearch();
      return;
    }
    if(!this.selectedImageFile) return;
    this.classifyAndSearch();
  }

  private processImageFile(file: File, options?: { autoAnalyse?: boolean }) {
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
    if(this.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.imagePreview);
    this.imagePreview = URL.createObjectURL(file);
    this.cameraOpen = true;
    this.stopTypewriterAnimation();
    this.searchQuery = '';

    if(!isPlatformBrowser(this.platformId)) return;
    void this.syncSessionForSelectedFile(file).then(() => {
      if(this.analysisCached && this.cachedClassification) {
        this.applyClassification(this.cachedClassification);
        this.imageDetected = true;
      }
      if (options?.autoAnalyse) {
        this.onAnalyseClick();
      }
    });
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

  private startClassifyOnly() {
    if(!this.selectedImageFile) return;
    this.classifyLoader = true;
    this.syncImageLoadingStatus();
    this.imageError = '';
    this.storeApi.CLASSIFY_SAREE(this.selectedImageFile).subscribe({
      next: result => {
        this.classifyLoader = false;
        this.syncImageLoadingStatus();
        if(result.status && result.classification) {
          this.applyClassification(result.classification);
          this.imageDetected = true;
          void this.persistClassifySession(this.selectedImageFile!, result.classification);
        } else {
          this.imageError = result.message || 'Could not classify image. Select filters manually.';
          if(result.retry_after_seconds > 0) this.startCountdown(result.retry_after_seconds);
        }
      },
      error: () => {
        this.classifyLoader = false;
        this.syncImageLoadingStatus();
        this.imageError = 'Classification failed. Please try again.';
      }
    });
  }

  private classifyAndSearch() {
    if(!this.selectedImageFile) return;
    this.classifyLoader = true;
    this.syncImageLoadingStatus();
    this.imageError = '';
    this.page = 1;
    this.fallbackUsed = false;

    void this.syncSessionForSelectedFile(this.selectedImageFile).then(() => {
      if(this.analysisCached && this.cachedClassification) {
        this.classifyLoader = false;
        this.applyClassification(this.cachedClassification);
        this.imageDetected = true;
        this.passColourHint = true;
        this.onSearch();
        if (!this.showImageLoadingText) {
          this.syncImageLoadingStatus();
        }
        return;
      }

      this.storeApi.CLASSIFY_SAREE(this.selectedImageFile!).subscribe({
        next: result => {
          this.classifyLoader = false;
          if(result.status && result.classification) {
            this.applyClassification(result.classification);
            this.imageDetected = true;
            void this.persistClassifySession(this.selectedImageFile!, result.classification);
            this.passColourHint = true;
            this.runFilterSearch();
          }
          else {
            this.syncImageLoadingStatus();
            this.imageError = result.message || 'Could not classify image. Please select filters manually.';
            if(result.retry_after_seconds > 0) {
              this.startCountdown(result.retry_after_seconds);
            }
          }
        },
        error: () => {
          this.classifyLoader = false;
          this.syncImageLoadingStatus();
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
    const classFilters: Record<string, string[]> = classification?.filters || {};
    this.cachedClassification = classification;
    this.clearTagFilter();

    Object.entries(classFilters).forEach(([id, values]) => {
      if(!values?.length) return;
      const tagId = String(id);
      const tag = this.tag_list.find(t => String(t._id) === tagId);
      if(!tag) return;

      const rawValue = values[0];
      const optionNames = (tag.option_list || []).map((opt: any) => opt.name);
      const matched = matchFilterOption(optionNames, rawValue);
      let option = (tag.option_list || []).find((opt: any) =>
        opt.name.trim().toLowerCase() === matched.trim().toLowerCase()
      );

      if(!option) {
        option = { name: rawValue };
        tag.option_list = tag.option_list || [];
        tag.option_list.push(option);
      }

      tag.option_list.forEach((opt: any) => { delete opt.checked; });
      option.checked = true;
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
        this.syncImageLoadingStatus();
      },
      error: err => {
        console.log("search error", err);
        this.imageError = 'Search failed. Please try again.';
        this.searchLoader = false;
        this.syncImageLoadingStatus();
      }
    });
  }

  private fetchPage(page: number) {
    this.pageLoader = true;
    const skip = (page - 1) * this.pageSize;
    if(this.searchMode === 'text') {
      const payload = this.buildCatalogSearchPayload(skip, this.pageSize);
      this.storeApi.SEARCH_PRODUCT(payload).subscribe(result => {
        this.pageLoader = false;
        if(result.status) this.applySearchResult(result);
      });
    } else {
      const payload = this.buildSearchPayload(skip, this.pageSize);
      this.storeApi.SEARCH_PRODUCT_EXACT(payload).subscribe(result => {
        this.pageLoader = false;
        if(result.status) this.applySearchResult(result);
        else console.log("response", result);
      });
    }
  }

  /** Payload for `/store_details/v1/product/search` */
  private buildCatalogSearchPayload(skip: number, limit: number) {
    return {
      name: this.searchQuery.trim(),
      filters: this.buildSelectedFiltersByTagId(),
      limit,
      skip,
      sort_by: this.sort_value || 'latest'
    };
  }

  private buildSelectedFiltersByTagId(): Record<string, string[]> {
    const filters: Record<string, string[]> = {};
    this.tag_list.forEach(tag => {
      const tagId = String(tag._id);
      const selected = (tag.option_list || [])
        .filter((opt: any) => opt.checked)
        .map((opt: any) => opt.name);
      if (selected.length) filters[tagId] = selected;
    });
    return filters;
  }

  private cloneTagListSnapshot(tagList: any[]): any[] {
    return (tagList || []).map(tag => ({
      ...tag,
      option_list: (tag.option_list || []).map((opt: any) => ({ ...opt }))
    }));
  }

  private restoreFilterDraftSnapshot(): void {
    if (!this.filterDraftSnapshot) return;
    this.tag_list = this.cloneTagListSnapshot(this.filterDraftSnapshot);
    this.filterDraftSnapshot = null;
  }

  private buildSearchPayload(skip: number, limit: number) {
    const filters: Record<string, string[]> = this.buildSelectedFiltersByTagId();

    // Fill gaps from classify API while AI filters are still active (user edits clear imageDetected).
    if(this.searchMode === 'image' && this.imageDetected) {
      const classFilters = (this.cachedClassification?.['filters'] || {}) as Record<string, string[]>;
      Object.entries(classFilters).forEach(([id, values]) => {
        const tagId = String(id);
        if(!values?.length || filters[tagId]?.length) return;
        filters[tagId] = values.slice();
      });
    }

    const payload: {
      filters: Record<string, string[]>;
      skip: number;
      limit: number;
      colour_hint?: string[];
    } = { filters, skip, limit };

    if (this.passColourHint && this.searchMode === 'image') {
      const colourHint = this.getClassificationColourHint();
      if (colourHint.length) {
        payload.colour_hint = colourHint;
      }
    }

    return payload;
  }

  private getClassificationColourHint(): string[] {
    const raw = this.cachedClassification?.['colour_hint'] ?? this.cachedClassification?.['color_hint'];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((hint): hint is string => typeof hint === 'string')
      .map(hint => hint.trim())
      .filter(Boolean);
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
    this.sortProductList();
    this.persistSearchSessionState();
  }

  private sortProductList() {
    if (!this.product_list?.length) return;

    const list = [...this.product_list];
    switch (this.sort_value) {
      case 'price_asc':
        list.sort((a, b) => (a.temp_discounted_price || 0) - (b.temp_discounted_price || 0));
        break;
      case 'price_desc':
        list.sort((a, b) => (b.temp_discounted_price || 0) - (a.temp_discounted_price || 0));
        break;
      default:
        break;
    }
    this.product_list = list;
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
      this.syncImageLoadingStatus();
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
    this.syncImageLoadingStatus();
  }

  ngOnDestroy() {
    if(this.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(this.imagePreview);
    clearInterval(this.countdownInterval);
    this.clearTypewriterTimeout();
    this.stopImageLoadingStatus();
  }

  private getImageLoadingPhrases(): string[] {
    return this.classifyLoader ? this.analyseLoadingPhrases : this.imageSearchLoadingPhrases;
  }

  private syncImageLoadingStatus() {
    if (!isPlatformBrowser(this.platformId)) return;

    const classifying = this.classifyLoader;
    if (classifying && !this.wasClassifying) {
      this.loadingStatusIndex = 0;
    } else if (!classifying && this.wasClassifying && this.searchLoader && this.hasUploadedImage) {
      this.loadingStatusIndex = 0;
    }
    this.wasClassifying = classifying;

    if (this.showImageLoadingText) {
      const phrases = this.getImageLoadingPhrases();
      this.loadingStatusText = phrases[this.loadingStatusIndex % phrases.length];
      if (!this.loadingStatusInterval) {
        this.loadingStatusInterval = setInterval(() => {
          const activePhrases = this.getImageLoadingPhrases();
          this.loadingStatusIndex = (this.loadingStatusIndex + 1) % activePhrases.length;
          this.loadingStatusText = activePhrases[this.loadingStatusIndex];
        }, 1800);
      }
      return;
    }

    this.stopImageLoadingStatus();
  }

  private stopImageLoadingStatus() {
    if (this.loadingStatusInterval) {
      clearInterval(this.loadingStatusInterval);
      this.loadingStatusInterval = null;
    }
    this.loadingStatusText = '';
    this.loadingStatusIndex = 0;
    this.wasClassifying = false;
  }

  private startTypewriterAnimation() {
    if (!isPlatformBrowser(this.platformId) || this.typewriterStopped) return;
    this.clearTypewriterTimeout();
    this.typewriterPhraseIndex = 0;
    this.typewriterCharIndex = 0;
    this.typewriterBackspacing = false;
    this.runTypewriterStep();
  }

  private restartTypewriterAnimation() {
    this.typewriterStopped = false;
    this.startTypewriterAnimation();
  }

  private stopTypewriterAnimation() {
    if (this.typewriterStopped) return;
    this.typewriterStopped = true;
    this.clearTypewriterTimeout();
    this.searchPlaceholder = this.searchPlaceholderActive;
  }

  private clearTypewriterTimeout() {
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }
  }

  private runTypewriterStep() {
    if (!isPlatformBrowser(this.platformId) || this.typewriterStopped) return;

    const currentPhrase = this.searchPlaceholderPhrases[this.typewriterPhraseIndex];

    if (this.typewriterBackspacing) {
      this.searchPlaceholder = currentPhrase.substring(0, this.typewriterCharIndex);
      this.typewriterCharIndex--;

      if (this.typewriterCharIndex < 0) {
        this.typewriterBackspacing = false;
        this.typewriterPhraseIndex = (this.typewriterPhraseIndex + 1) % this.searchPlaceholderPhrases.length;
        this.typewriterCharIndex = 0;
        this.typewriterTimeout = setTimeout(() => this.runTypewriterStep(), 400);
      } else {
        this.typewriterTimeout = setTimeout(() => this.runTypewriterStep(), 20);
      }
      return;
    }

    this.searchPlaceholder = currentPhrase.substring(0, this.typewriterCharIndex + 1);
    this.typewriterCharIndex++;

    if (this.typewriterCharIndex === currentPhrase.length) {
      this.typewriterBackspacing = true;
      this.typewriterTimeout = setTimeout(() => this.runTypewriterStep(), 2200);
    } else {
      this.typewriterTimeout = setTimeout(() => this.runTypewriterStep(), 45);
    }
  }

}
