import { Directive, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DynamicAssetLoaderService } from '../../../services/dynamic-asset-loader.service';
declare const Swiper: any;

/** Pushes carousel setup off the Angular bootstrap stack so LCP paints first.
 * `timeout` caps wait on busy main threads (Lighthouse PSI). */
function deferSwiperWork(cb: () => void, urgent: boolean): void {
  if (urgent) {
    // Primary hero (.home-slider): idle defer stacks slides until Swiper runs — bad LCP/layout.
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => cb());
        } else {
          setTimeout(cb, 0);
        }
      });
    } else if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => setTimeout(cb, 0));
    } else {
      setTimeout(cb, 0);
    }
    return;
  }
  const win = typeof window !== 'undefined' ? (window as unknown as Window & typeof globalThis) : null;
  const ric = win && (win as Window & { requestIdleCallback?(cb: () => void, opts?: { timeout: number }): number })
    .requestIdleCallback;
  if (typeof ric === 'function') {
    ric.call(win, cb, { timeout: 2400 });
  } else if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => setTimeout(cb, 0));
  } else {
    setTimeout(cb, 0);
  }
}
@Directive({
    selector: '[appHomeSwiper]',
    standalone: false
})

export class HomeSwiperDirective {

  private observer: any;

  /** Hero + immediately-below-fold carousels: skip idle defer so slides don’t stack before Swiper. */
  private readonly deferSwiperUrgent: boolean;

  /** Batches MutationObserver storms during hydration/layout into one CD frame → less TBT. */
  private observerRafQueued = false;

  loadedElements: any = [];
  
  highlights: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 6, spaceBetween: 0 },
      768: { slidesPerView: 4, spaceBetween: 0 },
      640: { slidesPerView: 3, spaceBetween: 0 },
      320: { slidesPerView: 3, spaceBetween: 0 }
    }
  };

  featured_section: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 15 },
      640: { slidesPerView: 1.75, spaceBetween: 15 },
      320: { slidesPerView: 1.75, spaceBetween: 15 }
    }
  };

  featured_products: any = {
    auto_play: false,
    spaceBetween: 15,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 15 },
      640: { slidesPerView: 2, spaceBetween: 15 },
      320: { slidesPerView: 1.75, spaceBetween: 15 }
    }
  };

  multi_tab_featured_products: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 15 },
      640: { slidesPerView: 2, spaceBetween: 15 },
      320: { slidesPerView: 1.5, spaceBetween: 15 }
    }
  };

  testimonial: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 20 },
      768: { slidesPerView: 2, spaceBetween: 16 },
      640: { slidesPerView: 1.5, spaceBetween: 14 },
      320: { slidesPerView: 1.1, spaceBetween: 12 }
    }
  };
  
  blogs: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 15 },
      768: { slidesPerView: 2, spaceBetween: 15 },
      640: { slidesPerView: 2, spaceBetween: 15 },
      320: { slidesPerView: 1.5, spaceBetween: 15 }
    }
  };
  shop_look: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1.5, spaceBetween: 0 }
    }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private _element: ElementRef, private assetLoader: DynamicAssetLoaderService) {
    const el = this._element.nativeElement as HTMLElement;
    this.deferSwiperUrgent =
      HomeSwiperDirective.isHomeHeroSwiperHost(el) ||
      HomeSwiperDirective.isFeaturedSectionSwiperHost(el) ||
      HomeSwiperDirective.isTabSwiperHost(el) ||
      HomeSwiperDirective.isTestimonialSwiperHost(el);
  }

  /** Tab slider (multi-tab featured products): re-rendered on every tab switch via *ngIf,
   *  so must use RAF (not idle) to avoid stacked-slide flash during Swiper init delay. */
  private static isTabSwiperHost(el: HTMLElement): boolean {
    if (!el?.classList) return false;
    for (let i = 0; i < el.classList.length; i++) {
      if (el.classList[i].includes('tabslider')) return true;
    }
    return false;
  }

  private static isHomeHeroSwiperHost(el: HTMLElement): boolean {
    if (!el?.classList || typeof el.closest !== 'function') {
      return false;
    }
    if (!el.closest('.home-slider')) {
      return false;
    }
    for (let i = 0; i < el.classList.length; i++) {
      const c = el.classList[i];
      if (c === 'pms' || c === 'desktop_pms') {
        return true;
      }
      if (c.includes('carousal_')) {
        return true;
      }
    }
    return false;
  }

  /** `featured_section` segment: `.feature-slide-sec .featured-sections` (desktopfeasecslider_ / feasecslider_) */
  private static isFeaturedSectionSwiperHost(el: HTMLElement): boolean {
    if (!el?.classList || typeof el.closest !== 'function') {
      return false;
    }
    if (!el.closest('.feature-slide-sec')) {
      return false;
    }
    for (let i = 0; i < el.classList.length; i++) {
      if (el.classList[i].includes('feasecslider')) {
        return true;
      }
    }
    return false;
  }

  /** Testimonial carousel: client-only segment — init promptly when layout expands after hydration. */
  private static isTestimonialSwiperHost(el: HTMLElement): boolean {
    if (!el?.classList) return false;
    for (let i = 0; i < el.classList.length; i++) {
      if (el.classList[i].includes('testimonialslider')) return true;
    }
    return false;
  }

  ngOnInit() {
    if(isPlatformBrowser(this.platformId)) {
      deferSwiperWork(() => {
        this.assetLoader.load('swiper-js', 'swiper-css').then(() => {
          this.registerListenerForDomChanges();
          this.fetchSwipeElements();
        }).catch(error => console.log("err", error));
      }, this.deferSwiperUrgent);
    }
  }

  registerListenerForDomChanges() {
    if (this.observer) {
      return;
    }
    this.observer = new MutationObserver(() => {
      if (this.observerRafQueued) {
        return;
      }
      this.observerRafQueued = true;
      requestAnimationFrame(() => {
        this.observerRafQueued = false;
        try {
          this.fetchSwipeElements();
        } catch (e) {
          console.error('[appHomeSwiper] fetchSwipeElements', e);
        }
      });
    });
    const attributes = false; const childList = true; const subtree = true;
    this.observer.observe(this._element.nativeElement, { attributes, childList, subtree });
  }

  fetchSwipeElements() {
    let classList: any = this._element.nativeElement.classList;
    for(let i=0; i<classList.length; i++) {
      if(classList[i].includes("phls") || classList[i].includes("pms") || classList[i].includes("carousal_") || classList[i].includes("slider_")) {
        let swipeElement = classList[i];
        // primary highlighted section
        if(classList[i].includes("phls")) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            let swipeConfig: any = {
              speed: 500,
              breakpoints: this.highlights.break_points,
              navigation: { nextEl: '#highlight_next', prevEl: '#highlight_prev' }
            }
            let autoPlay = this.highlights.auto_play;
            if(autoPlay) swipeConfig.autoplay = { delay: 3000, disableOnInteraction: false };
            let swipeInit = new Swiper('.'+swipeElement, swipeConfig);
            if(autoPlay && swipeElement.includes("desktop")) this.autoPlayEvt(swipeInit);
          }
        }
        // primary main slider
        else if(classList[i].includes("pms")) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            const slideCount =
              typeof this._element.nativeElement.querySelectorAll === 'function'
                ? this._element.nativeElement.querySelectorAll('.swiper-slide').length
                : 0;
            // Avoid Swiper loop + cloned slides unless there are enough real slides — loop clones
            // could briefly surface neighbour slides stuck on `_s` LQIP + `.blur-up` (looks like soft LCP).
            const useLoop = slideCount >= 4;
            let swipeConfig: any = {
              speed: 700,
              loop: useLoop,
              autoplay: { delay: 3000, disableOnInteraction: false },
              pagination: { el: '#primary_pagination', clickable: true },
              navigation: { nextEl: '#primary_next', prevEl: '#primary_prev' }
            };
            let swipeInit = new Swiper('.'+swipeElement, swipeConfig);
            if(swipeElement.includes("desktop")) this.autoPlayEvt(swipeInit);
          }
        }
        // carousal (main slider & multi-highlighted section)
        else if(swipeElement.includes("carousal_")) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            let swipeInit = new Swiper('.'+swipeElement, {
              speed: 700, loop: true,
              autoplay: { delay: 3000, disableOnInteraction: false },
              pagination: { el: '#swipe_pagination_'+swipeElement.split("_")[1], clickable: true },
              navigation: { nextEl: '#swipe_next_'+swipeElement.split("_")[1], prevEl: '#swipe_prev_'+swipeElement.split("_")[1] }
            });
            if(swipeElement.includes("desktop")) this.autoPlayEvt(swipeInit);
          }
        }
        // slider
        else {
          // multi-tab
          if(swipeElement.includes("tab")) {
            setTimeout(() => {
              this.initializeSwiper(swipeElement, this.multi_tab_featured_products);
            }, 0);
          }
          else if(swipeElement.includes("testimonial")) this.initializeSwiper(swipeElement, this.testimonial);
          else if(swipeElement.includes("blog")) this.initializeSwiper(swipeElement, this.blogs);
          else if(swipeElement.includes("feasec")) this.initializeSwiper(swipeElement, this.featured_section);
          else if(swipeElement.includes("shoplook")) this.initializeSwiper(swipeElement, this.shop_look);
          // else if(swipeElement.includes("insta")) this.initializeSwiper(swipeElement, this.instagram);
          else if(swipeElement.includes("insta")) {
            if(this.loadedElements.indexOf(swipeElement) == -1) {
              this.loadedElements.push(swipeElement);
              // swiper config
              let swipeConfig: any = {
                speed: 3000,
                navigation: {
                  nextEl: '#swipe_next_'+swipeElement.split("_")[1],
                  prevEl: '#swipe_prev_'+swipeElement.split("_")[1]
                },  
                slidesPerView: 'auto',  
                loop: true,        
                allowTouchMove: false,              
                autoplay: { delay: 0, disableOnInteraction: false }   
              }
              let swipeInit = new Swiper('.'+swipeElement, swipeConfig);              
              if(swipeElement.includes("desktop")) this.autoPlayEvt(swipeInit); 
            }
          }
          else this.initializeSwiper(swipeElement, this.featured_products);
        }
        break;
      }
    }
  }

  initializeSwiper(swipeElement: any, configData: any) {
    if(this.loadedElements.indexOf(swipeElement) == -1) {
      this.loadedElements.push(swipeElement);
      // swiper config
      let swipeConfig: any = {
        speed: 500,
        breakpoints: configData.break_points,
        navigation: {
          nextEl: '#swipe_next_'+swipeElement.split("_")[1],
          prevEl: '#swipe_prev_'+swipeElement.split("_")[1]
        }
      }
      if (swipeElement.includes('testimonial')) {
        swipeConfig.observer = true;
        swipeConfig.observeParents = true;
      }
      if(configData.loop) swipeConfig.loop = true;
      if(configData.auto_play) swipeConfig.autoplay = { delay: 3000, disableOnInteraction: false };
      if(swipeElement.includes("insta")) {
      swipeConfig.speed = 3000;
      if(configData.auto_play) swipeConfig.autoplay = { delay: 0, disableOnInteraction: false };
    }
      let swipeInit = new Swiper('.'+swipeElement, swipeConfig);
      if(configData.auto_play && swipeElement.includes("desktop")) this.autoPlayEvt(swipeInit);
    }
  }

  autoPlayEvt(swipeInit: any) {
    swipeInit.el.addEventListener("mouseover", () => {  
      swipeInit.autoplay.stop();
    });
    swipeInit.el.addEventListener("mouseout", () => {   
      swipeInit.autoplay.start();
    });
  }

  ngOnDestroy() {
    if(isPlatformBrowser(this.platformId) && this.observer) this.observer.disconnect();
  }

}