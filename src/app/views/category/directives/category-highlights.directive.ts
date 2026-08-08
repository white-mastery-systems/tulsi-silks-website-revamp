import { Directive, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DynamicAssetLoaderService } from '../../../services/dynamic-asset-loader.service';
declare const Swiper: any;
declare const $: any;

@Directive({
    selector: '[appCategoryHighlights]',
    standalone: false
})

export class CategoryHighlightsDirective {

  private observer: any;
  private navRevision = '';

  groupHighlights: any = {
    auto_play: false,
    loop: true,
    break_points: {
      1024: { slidesPerView: 6, spaceBetween: 8 },
      768: { slidesPerView: 4, spaceBetween: 8 },
      640: { slidesPerView: 3, spaceBetween: 8 },
      320: { slidesPerView: 2.5, spaceBetween: 8 }
    }
  };
  highlights: any = {
    auto_play: false,
    loop: true,
    break_points: {
      1024: { slidesPerView: 6, spaceBetween: 8 },
      768: { slidesPerView: 4, spaceBetween: 8 },
      640: { slidesPerView: 3, spaceBetween: 8 },
      320: { slidesPerView: 2.5, spaceBetween: 8 }
    }
  };
  materialHighlights: any = {
    auto_play: false,
    loop: true,
    break_points: {
      1024: { slidesPerView: 6, spaceBetween: 8 },
      768: { slidesPerView: 4, spaceBetween: 8 },
      640: { slidesPerView: 3, spaceBetween: 8 },
      320: { slidesPerView: 2.5, spaceBetween: 8 }
    }
  };
  weaveHighlights: any = {
    auto_play: false,
    loop: true,
    break_points: {
      1024: { slidesPerView: 3, spaceBetween: 12 },
      768: { slidesPerView: 2, spaceBetween: 8 },
      640: { slidesPerView: 2.5, spaceBetween: 8 },
      320: { slidesPerView: 2.5, spaceBetween: 8 }
    }
  };
  /** 2–4 item tabs on mobile — show ~2.5 slides. */
  pairHighlights: any = {
    auto_play: false,
    loop: false,
    break_points: {
      768: { slidesPerView: 2.5, spaceBetween: 8 },
      640: { slidesPerView: 2.5, spaceBetween: 8 },
      320: { slidesPerView: 2.5, spaceBetween: 8 }
    }
  };

  /** Category blogs — match home mobile blog slider peek. */
  blogHighlights: any = {
    auto_play: false,
    loop: false,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 15 },
      768: { slidesPerView: 2, spaceBetween: 15 },
      640: { slidesPerView: 2, spaceBetween: 15 },
      320: { slidesPerView: 1.5, spaceBetween: 15 }
    }
  };

  swiperInfo: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 4.2, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 15 },
      640: { slidesPerView: 2, spaceBetween: 15 },
      320: { slidesPerView: 1.5, spaceBetween: 15 }
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private _element: ElementRef,
    private assetLoader: DynamicAssetLoaderService
  ) { }
​
  private registerListenerForDomChanges() {
    this.observer = new MutationObserver(() => this.fetchSwipeElements());
    const attributes = false; const childList = true; const subtree = true;
    this.observer.observe(this._element.nativeElement, { attributes, childList, subtree });
  }

  ngAfterViewInit() {
    if(isPlatformBrowser(this.platformId)) {
      // jQuery is only needed for autoplay hover — all category swipers have
      // auto_play:false, so skip the CDN load entirely to avoid blocking on
      // page reload when cdnjs is slow or unreachable.
      this.assetLoader.load('swiper-js', 'swiper-css').then(() => {
        this.registerListenerForDomChanges();
        try { this.fetchSwipeElements(); } catch(e) { console.warn('[swiper]', e); }
      }).catch(error => console.warn('[swiper asset load]', error));
    }
  }

  fetchSwipeElements() {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this._element.nativeElement;
    const slideCount = el.querySelectorAll('.swiper-slide').length;
    if (!slideCount) return;

    const revision = el.getAttribute('data-nav-revision') || '';
    const isNavSwiper = !!revision;
    if (isNavSwiper && revision === this.navRevision && (el as any).swiper) {
      (el as any).swiper.update();
      return;
    }
    if (isNavSwiper) {
      this.navRevision = revision;
    }

    const classList: any = el.classList;
    for (let i = 0; i < classList.length; i++) {
      if (classList[i].includes('pair_hls') || classList[i].includes('phls') || classList[i].includes('whls') || classList[i].includes('mhls') || classList[i].includes('ghls') || classList[i].includes('blogslider') || classList[i].includes('color_slider') || classList[i].includes('section_slider')) {
        const swipeElement = classList[i];
        if (classList[i].includes('blogslider')) {
          this.initOrRefreshSwiper(el, {
            speed: 500,
            loop: false,
            slidesPerView: 1.5,
            spaceBetween: 15,
            breakpoints: this.blogHighlights.break_points,
            navigation: { nextEl: '#cat_blog_next', prevEl: '#cat_blog_prev' }
          }, this.blogHighlights.auto_play, swipeElement);
        } else if (classList[i].includes('pair_hls')) {
          const slideCountAttr = parseInt(el.getAttribute('data-slide-count') || '', 10);
          const count = Number.isFinite(slideCountAttr) && slideCountAttr > 0
            ? slideCountAttr
            : el.querySelectorAll('.swiper-slide').length;
          const perView = count <= 2 ? 2 : 2.5;
          const pairBreakpoints = {
            768: { slidesPerView: perView, spaceBetween: 8 },
            640: { slidesPerView: perView, spaceBetween: 8 },
            320: { slidesPerView: perView, spaceBetween: 8 }
          };
          this.initOrRefreshSwiper(el, {
            speed: 700,
            loop: false,
            slidesPerView: perView,
            spaceBetween: 8,
            breakpoints: pairBreakpoints,
            navigation: { nextEl: '#highlight_next', prevEl: '#highlight_prev' }
          }, this.pairHighlights.auto_play, swipeElement);
        } else if (classList[i].includes('phls')) {
          this.initOrRefreshSwiper(el, {
            speed: 700,
            loop: false,
            breakpoints: this.highlights.break_points,
            navigation: { nextEl: '#highlight_next', prevEl: '#highlight_prev' }
          }, this.highlights.auto_play, swipeElement);
        } else if (classList[i].includes('whls')) {
          this.initOrRefreshSwiper(el, {
            speed: 700,
            loop: false,
            breakpoints: this.weaveHighlights.break_points,
            navigation: { nextEl: '#highlight_next', prevEl: '#highlight_prev' }
          }, this.weaveHighlights.auto_play, swipeElement);
        } else if (classList[i].includes('mhls')) {
          this.initOrRefreshSwiper(el, {
            speed: 700,
            loop: false,
            breakpoints: this.materialHighlights.break_points,
            navigation: { nextEl: '#highlight_next', prevEl: '#highlight_prev' }
          }, this.materialHighlights.auto_play, swipeElement);
        } else if (classList[i].includes('ghls')) {
          this.initOrRefreshSwiper(el, {
            speed: 700,
            loop: false,
            breakpoints: this.groupHighlights.break_points,
            navigation: { nextEl: '#group_highlight_next', prevEl: '#group_highlight_prev' }
          }, this.groupHighlights.auto_play, swipeElement);
        } else if (classList[i].includes('section_slider')) {
          const swipeConfig: any = {
            speed: 500,
            breakpoints: this.swiperInfo.break_points,
            navigation: { nextEl: '#section_next', prevEl: '#section_prev' }
          };
          const autoPlay = this.swiperInfo.auto_play;
          if (autoPlay) {
            swipeConfig.autoplay = { delay: 3000, disableOnInteraction: false };
          }
          const swipeInit = this.initOrRefreshSwiper(el, swipeConfig, autoPlay, swipeElement);
          if (autoPlay && swipeElement.includes('desktop')) this.autoPlayEvt(swipeInit);
        }
        break;
      }
    }
  }

  /** Init on this host element; destroy any prior instance when slides/revision change. */
  private initOrRefreshSwiper(el: HTMLElement, config: any, autoPlay: boolean, swipeElement: string): any {
    const host = el as any;
    if (host.swiper) {
      host.swiper.destroy(true, true);
    }
    const swipeInit = new Swiper(el, config);
    if (autoPlay && swipeElement.includes('desktop') && typeof $ !== 'undefined') {
      $(el).hover(
        function(this: any) { this.swiper.autoplay.stop(); },
        function(this: any) { this.swiper.autoplay.start(); }
      );
    }
    return swipeInit;
  }

  autoPlayEvt(swipeInit: any) {
    swipeInit.el.addEventListener("mouseover", () => {  
      swipeInit.autoplay.stop();
    });
    swipeInit.el.addEventListener("mouseout", () => {   
      swipeInit.autoplay.start();
    });
  }

}