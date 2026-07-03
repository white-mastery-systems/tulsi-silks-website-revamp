export interface CategoryFilterOption {
  name: string;
  checked?: boolean;
}

export interface CategoryTagGroup {
  _id: string;
  name: string;
  rank: number;
  option_list: CategoryFilterOption[];
  tag_search?: string;
  show_more?: boolean;
}

export interface CategoryPriceRange {
  min: number;
  max: number;
}

export interface AvailableFiltersResponse {
  status: boolean;
  available_filters?: Array<{
    _id: string;
    name: string;
    rank: number;
    option_list?: Array<{ name: string }>;
  }>;
  price_range?: CategoryPriceRange;
}

export interface ListV4Payload {
  category_id: string;
  page: number;
  limit: number;
  min_price: number;
  max_price: number;
  sort_by: string;
  filters: Record<string, string[]>;
  include_metadata?: boolean;
}

export interface ListV4Response {
  status: boolean;
  category_details?: any;
  catalog_page_segments?: CatalogPageSegment[];
  list?: any[];
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
}

export interface CatalogPageSegment {
  _id: string;
  type: string;
  name?: string;
  rank: number;
  active_status?: boolean;
  heading?: string;
  sub_heading?: string;
  description?: string;
  icon_card_list?: any[];
  layout?: 'bordered' | 'plain';
  founder_intro?: any;
  founder_faq_list?: any[];
  highlight_points?: any[];
  content_split_intro?: any;
  checklist_config?: any;
  checklist_items?: any[];
  cta_list?: any[];
  theme?: string;
  bg_color?: string;
  feature_list?: any[];
  image_list?: any[];
  quote_text?: string;
  faq_list?: any[];
  group_list?: any[];
  blogs_type?: string;
  section_grid_type?: string;
}
