export interface BlogCarouselProduct {
  title: string;
  price?: number;
  originalPrice?: number;
  mrp?: number;
  image: string;
  link: string;
  brand?: string;
}

export interface ProductCarouselBlockData {
  title?: string;
  subtitle?: string;
  brandLabel?: string;
  category_id?: string;
  productLimit?: number;
  products?: BlogCarouselProduct[];
}
