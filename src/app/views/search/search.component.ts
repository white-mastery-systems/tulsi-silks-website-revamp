import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { StoreApiService } from '../../services/store-api.service';
import { CommonService } from '../../services/common.service';
import { CurrencyConversionService } from '../../services/currency-conversion.service';
import { environment } from './../../../environments/environment';
import {
  SearchFilterGroup,
  chipOptionsForField,
  deriveColourFamily,
  mapAvailableFilters,
  matchFilterOption
} from './search-filter-options';
import { SEARCH_AVAILABLE_FILTERS_DATA } from './search-available-filters.data';

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

  filterGroups: SearchFilterGroup[] = [];
  selectedFilters: Record<string, string> = {};
  chipLists: Record<string, string[]> = {};
  expandedFilters: Record<string, boolean> = {};
  priceRange: { min: number; max: number } | null = null;

  selectedImageFile: File | null = null;
  imagePreview: string | null = null;
  classifyLoader: boolean = false;
  imageError: string = '';
  imageDetected: boolean = false;
  isDragOver: boolean = false;
  fallbackUsed: boolean = false;
  finalAiTags: string[] = [];

  private pendingQuery: string | null = null;
  private restorePending = false;
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageSizeBytes = 5 * 1024 * 1024;
  private readonly chipPreviewLimit = 8;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private storeApi: StoreApiService,
    public commonService: CommonService,
    public cc: CurrencyConversionService,
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
    this.activeRoute.queryParams.subscribe((params: Params) => {
      this.pendingQuery = params['q'] ? String(params['q']) : null;
      if(this.filterGroups.length) this.handleRouteState();
    });
    this.commonService.breadCrumbList(this.bcList);
    this.loadAvailableFilters();
  }

  get activeFilterChips(): ActiveFilterChip[] {
    return this.filterGroups
      .filter(group => !!this.selectedFilters[group.key])
      .map(group => ({
        label: group.name,
        key: group.key,
        value: this.selectedFilters[group.key]
      }));
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterChips.length > 0;
  }

  get showPagination(): boolean {
    return this.productCount > this.pageSize;
  }

  toggleFilterGroup(key: string) {
    this.expandedFilters[key] = !this.expandedFilters[key];
  }

  visibleChips(group: SearchFilterGroup): string[] {
    const chips = this.chipLists[group.key] || group.options;
    if(this.expandedFilters[group.key]) return chips;
    return chips.slice(0, this.chipPreviewLimit);
  }

  hasMoreChips(group: SearchFilterGroup): boolean {
    const chips = this.chipLists[group.key] || group.options;
    return chips.length > this.chipPreviewLimit && !this.expandedFilters[group.key];
  }

  onFilterChipSelect(group: SearchFilterGroup, value: string) {
    this.imageDetected = false;
    const current = this.selectedFilters[group.key];
    this.selectedFilters[group.key] = (current === value) ? '' : value;
    this.syncChipLists();
  }

  isChipSelected(group: SearchFilterGroup, value: string): boolean {
    return this.selectedFilters[group.key]?.toLowerCase() === value.toLowerCase();
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
    this.runSearchWithFallback();
  }

  onClearFilters() {
    this.selectedFilters = {};
    this.imageError = '';
    this.imageDetected = false;
    this.fallbackUsed = false;
    this.finalAiTags = [];
    this.afterSearchEvent = false;
    this.product_list = [];
    this.productCount = 0;
    this.page = 1;
    this.clearImageOnly();
    this.syncChipLists();
    this.resetExpandedFilters();
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
    this.selectedFilters[chip.key] = '';
    this.syncChipLists();
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
  }

  private loadAvailableFilters() {
    if(this.filterGroups.length) return;
    this.applyFiltersResponse(SEARCH_AVAILABLE_FILTERS_DATA);
    this.handleRouteState();
  }

  private applyFiltersResponse(result: any) {
    this.filterGroups = mapAvailableFilters(result.available_filters);
    this.priceRange = result.price_range || null;
    this.initFilterState();
  }

  private initFilterState() {
    this.filterGroups.forEach(group => {
      if(this.selectedFilters[group.key] === undefined) this.selectedFilters[group.key] = '';
      if(this.expandedFilters[group.key] === undefined) this.expandedFilters[group.key] = false;
    });
    this.syncChipLists();
  }

  private handleRouteState() {
    if(!this.filterGroups.length) return;

    if(this.restorePending) {
      this.restorePending = false;
      this.restoreSearchState();
      return;
    }

    if(this.pendingQuery) {
      const materialGroup = this.filterGroups.find(group => group.name === 'Material');
      if(materialGroup) {
        this.selectedFilters[materialGroup.key] = matchFilterOption(
          materialGroup.options,
          this.pendingQuery
        );
        this.syncChipLists();
        this.onSearch();
      }
      this.pendingQuery = null;
    }
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
    this.selectedImageFile = file;
    if(this.imagePreview) URL.revokeObjectURL(this.imagePreview);
    this.imagePreview = URL.createObjectURL(file);
    this.classifyAndSearch();
  }

  private classifyAndSearch() {
    if(!this.selectedImageFile) return;
    this.classifyLoader = true;
    this.page = 1;
    this.fallbackUsed = false;

    this.storeApi.CLASSIFY_SAREE(this.selectedImageFile).subscribe(result => {
      this.classifyLoader = false;
      if(result.status && result.classification) {
        this.applyClassification(result.classification);
        this.imageDetected = true;
        this.syncChipLists();
        this.onSearch();
      }
      else {
        this.imageError = result.message || 'Could not classify image. Please select filters manually.';
      }
    });
  }

  private applyClassification(classification: any) {
    const [design, occasion, border] = classification.tags || [];
    const mappedValues: Record<string, string> = {
      'Material': classification.keyword || '',
      'Body Colour': classification.colour || '',
      'Design': design || '',
      'Occasion': occasion || '',
      'Border': border || ''
    };

    this.filterGroups.forEach(group => {
      const rawValue = mappedValues[group.name];
      if(rawValue) {
        this.selectedFilters[group.key] = matchFilterOption(group.options, rawValue);
      }
    });
  }

  private async runSearchWithFallback() {
    const attempts = this.buildTagAttempts();
    try {
      for(let i = 0; i < attempts.length; i++) {
        const tags = attempts[i];
        const payload = this.buildSearchPayload(tags, 0, this.pageSize);
        const result = await firstValueFrom(this.storeApi.SEARCH_PRODUCT_V2(payload));
        if(result.status && (result.count > 0 || i === attempts.length - 1)) {
          this.finalAiTags = tags;
          this.fallbackUsed = i > 0 && result.count > 0;
          this.applySearchResult(result);
          break;
        }
      }
    }
    catch (err) {
      console.log("search error", err);
      this.imageError = 'Search failed. Please try again.';
    }
    finally {
      this.searchLoader = false;
    }
  }

  private fetchPage(page: number) {
    this.pageLoader = true;
    const skip = (page - 1) * this.pageSize;
    const payload = this.buildSearchPayload(this.finalAiTags, skip, this.pageSize);
    this.storeApi.SEARCH_PRODUCT_V2(payload).subscribe(result => {
      this.pageLoader = false;
      if(result.status) this.applySearchResult(result);
      else console.log("response", result);
    });
  }

  private buildTagAttempts(): string[][] {
    const allTags = this.getSelectedTagValues();
    const attempts: string[][] = [];
    const maxAttempts = 4;

    for(let i = 0; i < maxAttempts; i++) {
      const tagCount = Math.max(0, allTags.length - i);
      attempts.push(allTags.slice(0, tagCount));
      if(tagCount === 0) break;
    }

    return attempts.length ? attempts : [[]];
  }

  private getSelectedTagValues(): string[] {
    return this.filterGroups
      .filter(group => group.apiField === 'tag' && this.selectedFilters[group.key])
      .sort((a, b) => a.rank - b.rank)
      .map(group => this.selectedFilters[group.key]);
  }

  private buildSearchPayload(tags: string[], skip: number, limit: number) {
    const materialGroup = this.filterGroups.find(group => group.name === 'Material');
    const colourGroup = this.filterGroups.find(group => group.name === 'Body Colour');
    const colour = colourGroup ? this.selectedFilters[colourGroup.key]?.trim() : '';

    return {
      keyword: materialGroup ? this.selectedFilters[materialGroup.key]?.trim() : '',
      colour,
      colour_family: colour ? deriveColourFamily(colour) : '',
      tags,
      skip,
      limit
    };
  }

  private applySearchResult(result: any) {
    if(!result.status) return;
    this.productCount = result.count;
    const list = result.list || [];
    list.forEach((obj: any) => {
      if(obj.hold_till) {
        let balanceStock = obj.stock;
        if(new Date() < new Date(obj.hold_till)) balanceStock = obj.stock - obj.hold_qty;
        obj.stock = balanceStock;
      }
      obj.temp_selling_price = this.cc.CALC(obj.selling_price);
      obj.temp_discounted_price = this.cc.CALC(obj.discounted_price);
    });
    this.product_list = list;
  }

  onSelectProduct(x: any) {
    this.commonService.selected_product = x;
    this.commonService.search_page_attr = {
      search_form: { filters: { ...this.selectedFilters } },
      product_list: this.product_list,
      scroll_y_pos: this.commonService.scroll_y_pos,
      product_count: this.productCount,
      ai_search_form: { ...this.selectedFilters },
      final_ai_tags: this.finalAiTags,
      fallback_used: this.fallbackUsed,
      image_detected: this.imageDetected,
      page: this.page
    };
  }

  private restoreSearchState() {
    this.afterSearchEvent = true;
    const saved = this.commonService.search_page_attr;
    const savedFilters = saved.ai_search_form || saved.search_form?.filters;
    if(savedFilters) this.selectedFilters = { ...this.selectedFilters, ...savedFilters };
    this.product_list = saved.product_list;
    this.productCount = saved.product_count;
    this.finalAiTags = saved.final_ai_tags || [];
    this.fallbackUsed = !!saved.fallback_used;
    this.imageDetected = !!saved.image_detected;
    this.page = saved.page || 1;
    this.syncChipLists();
    const scrollPos = saved.scroll_y_pos;
    setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
    this.commonService.search_page_attr = {};
  }

  private syncChipLists() {
    this.filterGroups.forEach(group => {
      this.chipLists[group.key] = chipOptionsForField(
        group.options,
        this.selectedFilters[group.key]
      );
    });
  }

  private clearImageOnly() {
    this.selectedImageFile = null;
    if(this.imagePreview) URL.revokeObjectURL(this.imagePreview);
    this.imagePreview = null;
    this.classifyLoader = false;
  }

  private resetExpandedFilters() {
    Object.keys(this.expandedFilters).forEach(key => {
      this.expandedFilters[key] = false;
    });
  }

  ngOnDestroy() {
    if(this.imagePreview) URL.revokeObjectURL(this.imagePreview);
  }

}
