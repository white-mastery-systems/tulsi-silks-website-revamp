import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DynamicAssetLoaderService } from '../../../../../services/dynamic-asset-loader.service';
import { CurrencyConversionService } from '../../../../../services/currency-conversion.service';
import { BlogCarouselProduct, ProductCarouselBlockData } from './blog-product-carousel.models';

@Component({
    selector: 'app-blog-product-carousel',
    templateUrl: './blog-product-carousel.component.html',
    styleUrls: ['./blog-product-carousel.component.scss'],
    standalone: false
})
export class BlogProductCarouselComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() data: ProductCarouselBlockData | null = null;
  @Input() imgBaseUrl = '';
  /** Unique id fragment for Swiper nav elements (alphanumeric). */
  @Input() carouselId = 'pc0';

  @ViewChild('swiperRoot') swiperRoot?: ElementRef<HTMLElement>;
  @ViewChild('btnPrev') btnPrev?: ElementRef<HTMLButtonElement>;
  @ViewChild('btnNext') btnNext?: ElementRef<HTMLButtonElement>;

  products: BlogCarouselProduct[] = [];
  defaultBrand = 'TULSI SILKS';

  private swiper: { destroy: (deleteListeners?: boolean, cleanup?: boolean) => void } | null = null;
  private viewInited = false;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly assets: DynamicAssetLoaderService,
    readonly cc: CurrencyConversionService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['imgBaseUrl']) {
      this.products = this.normalizeProducts();
    }
    if (changes['data'] || changes['carouselId']) {
      this.teardownSwiper();
    }
    if (this.viewInited) {
      this.scheduleMount();
    }
  }

  ngAfterViewInit(): void {
    this.viewInited = true;
    this.scheduleMount();
  }

  ngOnDestroy(): void {
    this.teardownSwiper();
  }

  private scheduleMount(): void {
    if (!isPlatformBrowser(this.platformId) || this.products.length < 1) return;
    setTimeout(() => this.mountSwiper(), 0);
  }

  imageSrc(p: BlogCarouselProduct): string {
    const raw = p?.image ?? '';
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const path = raw.replace(/^\/+/, '');
    const base = (this.imgBaseUrl ?? '').replace(/\/?$/, '/');
    return base + path;
  }

  productLink(p: BlogCarouselProduct): string {
    const s = String(p?.link ?? '').trim();
    if (!s || s === '#') return '#';
    if (s.startsWith('/')) return s;
    return '/' + s.replace(/^\/+/, '');
  }

  priceValue(p: BlogCarouselProduct): number {
    return this.cc.CALC(p.price ?? 0);
  }

  originalPriceValue(p: BlogCarouselProduct): number | null {
    const o = p.originalPrice ?? p.mrp;
    if (o == null || o <= 0) return null;
    if ((p.price ?? 0) >= o) return null;
    return this.cc.CALC(o);
  }

  brandFor(p: BlogCarouselProduct): string {
    const fromProduct = p.brand?.trim();
    if (fromProduct) return fromProduct.toUpperCase();
    const fromBlock = this.data?.brandLabel?.trim();
    if (fromBlock) return fromBlock.toUpperCase();
    return this.defaultBrand;
  }

  get viewAllLabel(): string | null {
    const label = this.data?.buttonLabel?.trim();
    return label ? label : null;
  }

  /** Same-origin / relative path for SPA navigation (e.g. `/category/gadwal`). */
  get viewAllRouterLink(): string | null {
    if (!this.viewAllLabel) return null;
    const raw = this.data?.buttonLink?.trim();
    if (!raw || raw === '#') return null;

    if (raw.startsWith('/') && !/^https?:\/\//i.test(raw)) {
      return raw.split('?')[0] || '/';
    }

    if (/^https?:\/\//i.test(raw) && isPlatformBrowser(this.platformId)) {
      try {
        const url = new URL(raw);
        if (url.origin === window.location.origin) {
          return (url.pathname || '/') + (url.search || '');
        }
      } catch {
        /* ignore */
      }
    }

    // Absolute URL for this store host even during SSR / before hydration.
    const match = raw.match(/^https?:\/\/(?:www\.)?tulsisilks\.co\.in(\/[^?#]*)/i);
    if (match?.[1]) return match[1];

    return null;
  }

  get viewAllExternalHref(): string | null {
    if (!this.viewAllLabel || this.viewAllRouterLink) return null;
    const raw = this.data?.buttonLink?.trim();
    if (!raw || !/^https?:\/\//i.test(raw)) return null;
    return raw;
  }

  trackByIdx(i: number): number {
    return i;
  }

  private normalizeProducts(): BlogCarouselProduct[] {
    const raw = this.data?.products ?? [];
    const lim = this.data?.productLimit;
    const capped =
      lim != null && lim > 0 ? raw.slice(0, Math.min(lim, raw.length)) : [...raw];
    return capped.filter((p) => p && (p.title || p.image));
  }

  private teardownSwiper(): void {
    if (this.swiper) {
      try {
        this.swiper.destroy(true, true);
      } catch {
        /* ignore */
      }
      this.swiper = null;
    }
  }

  private mountSwiper(): void {
    const el = this.swiperRoot?.nativeElement;
    if (!el || this.products.length < 1) return;

    this.assets.load('swiper-js', 'swiper-css').then(() => {
      const SwiperCtor = (typeof window !== 'undefined' && (window as any).Swiper) as
        | (new (el: Element, opts: object) => { destroy: (a?: boolean, b?: boolean) => void })
        | undefined;
      if (!SwiperCtor || !this.swiperRoot?.nativeElement) return;

      const root = this.swiperRoot.nativeElement;
      const prevEl = this.btnPrev?.nativeElement;
      const nextEl = this.btnNext?.nativeElement;

      this.teardownSwiper();
      this.swiper = new SwiperCtor(root, {
        speed: 480,
        slidesPerView: 1.15,
        spaceBetween: 14,
        slidesPerGroup: 1,
        watchOverflow: true,
        roundLengths: true,
        observer: true,
        observeParents: true,
        breakpoints: {
          576: { slidesPerView: 2, spaceBetween: 16 },
          992: { slidesPerView: 3, spaceBetween: 18 },
        },
        ...(prevEl && nextEl
          ? {
              navigation: {
                prevEl,
                nextEl,
              },
              uniqueNavElements: false,
            }
          : {}),
      });
    });
  }
}
