import { CategoryTagGroup, ListV4Payload } from './category-api.types';

export const SPECIAL_CATEGORY_PATHS = [
  '/recommended-products',
  '/all-products',
  '/new-arrivals',
  '/on-sale',
  '/featured-products',
  '/best-sellers'
];

export function isStandardCategoryPage(pageUrl: string): boolean {
  if (SPECIAL_CATEGORY_PATHS.includes(pageUrl)) return false;
  return pageUrl.startsWith('/category/') && pageUrl.length > '/category/'.length;
}

export function filterParamName(name: string): string {
  return name.trim().toLowerCase().replace(/ /g, '_');
}

export function filterParamValue(value: string): string {
  return value.trim().toLowerCase().replace(/ /g, '_');
}

export function mapAvailableFiltersToTagList(
  availableFilters: any[],
  qParams: Record<string, string>
): CategoryTagGroup[] {
  return (availableFilters || [])
    .slice()
    .sort((a, b) => (a.rank || 0) - (b.rank || 0))
    .map(group => ({
      _id: group._id,
      name: group.name,
      rank: group.rank,
      option_list: (group.option_list || []).map((opt: any) => {
        const pushData: any = { name: opt.name };
        const paramName = filterParamName(group.name);
        const paramElem = filterParamValue(opt.name);
        const qVal = qParams[paramName];
        if (qVal && qVal.split('-').some(p => p === paramElem)) {
          pushData.checked = true;
        }
        return pushData;
      })
    }));
}

export function buildFiltersPayload(tagList: CategoryTagGroup[]): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  (tagList || []).forEach(tag => {
    const selected = (tag.option_list || [])
      .filter(opt => opt.checked)
      .map(opt => opt.name);
    if (selected.length) filters[tag._id] = selected;
  });
  return filters;
}

export function buildListV4Payload(params: {
  categoryId: string;
  page: number;
  limit: number;
  sortBy: string;
  minPriceInr: number;
  maxPriceInr: number;
  filters: Record<string, string[]>;
  includeMetadata?: boolean;
}): ListV4Payload {
  return {
    category_id: params.categoryId,
    page: params.page,
    limit: params.limit,
    min_price: params.minPriceInr,
    max_price: params.maxPriceInr,
    sort_by: params.sortBy || 'latest',
    filters: params.filters || {},
    include_metadata: params.includeMetadata === true
  };
}

export function hasCheckedFilters(tagList: CategoryTagGroup[]): boolean {
  return (tagList || []).some(tag =>
    (tag.option_list || []).some(opt => opt.checked)
  );
}

export function activeFilterChips(tagList: CategoryTagGroup[]): Array<{ tagId: string; name: string; value: string }> {
  const chips: Array<{ tagId: string; name: string; value: string }> = [];
  (tagList || []).forEach(tag => {
    (tag.option_list || []).forEach(opt => {
      if (opt.checked) chips.push({ tagId: tag._id, name: tag.name, value: opt.name });
    });
  });
  return chips;
}

export function countActiveFilterGroups(tagList: CategoryTagGroup[]): number {
  return (tagList || []).filter(tag => (tag.option_list || []).some(opt => opt.checked)).length;
}

export function isPriceRangeFiltered(
  minInr: number,
  maxInr: number,
  priceRangeBase: { min: number; max: number }
): boolean {
  if (!priceRangeBase?.max) return false;
  return minInr !== priceRangeBase.min || maxInr !== priceRangeBase.max;
}

export function categoryRobotsContent(params: {
  page: number;
  sortValue: string;
  tagList: CategoryTagGroup[];
  priceFiltered: boolean;
}): string {
  if (params.page > 1) return 'noindex, follow';
  if (params.sortValue && params.sortValue !== 'latest') return 'noindex, follow';
  if (params.priceFiltered) return 'noindex, follow';
  const groups = countActiveFilterGroups(params.tagList);
  const options = activeFilterChips(params.tagList).length;
  if (groups >= 2 || options >= 2) return 'noindex, follow';
  return 'index, follow';
}

export function shouldEmitCategoryItemListSchema(params: {
  page: number;
  sortValue: string;
  tagList: CategoryTagGroup[];
  priceFiltered: boolean;
}): boolean {
  return categoryRobotsContent(params) === 'index, follow';
}
