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
  loadedElements: any = [];

  groupHighlights: any = {
    auto_play: false,
    loop: true,
    break_points: {
      1024: { slidesPerView: 4.5, spaceBetween: 15 },
      768: { slidesPerView: 2.15, spaceBetween: 15 },
      640: { slidesPerView: 1.15, spaceBetween: 15 },
      320: { slidesPerView: 1.15, spaceBetween: 15 }
    }
  };
  highlights: any = {
    auto_play: false,
    loop: true,
    break_points: {
      1024: { slidesPerView: 4.5, spaceBetween: 15 },
      768: { slidesPerView: 2.15, spaceBetween: 15 },
      640: { slidesPerView: 1.15, spaceBetween: 15 },
      320: { slidesPerView: 1.15, spaceBetween: 15 }
    }
  };
  materialHighlights: any = {
    auto_play: false,
    loop: true,
    break_points: {
      1024: { slidesPerView: 4.5, spaceBetween: 15 },
      768: { slidesPerView: 2.15, spaceBetween: 15 },
      640: { slidesPerView: 1.15, spaceBetween: 15 },
      320: { slidesPerView: 1.15, spaceBetween: 15 }
    }
  };
  weaveHighlights: any = {
    auto_play: false,
    loop: true,
    break_points: {
      1024: { slidesPerView: 3, spaceBetween: 15 },
      768: { slidesPerView: 2.15, spaceBetween: 15 },
      640: { slidesPerView: 1.15, spaceBetween: 15 },
      320: { slidesPerView: 1.15, spaceBetween: 15 }
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

  /** Caps each breakpoint's slidesPerView to the actual slide count so a single
   *  item fills the full container width instead of leaving 3+ empty slots. */
  private adaptBreakpoints(base: any): any {
    const count = this._element.nativeElement.querySelectorAll('.swiper-slide').length;
    if (!count) return base;
    const out: any = {};
    for (const bp of Object.keys(base)) {
      out[bp] = { ...base[bp], slidesPerView: Math.min(base[bp].slidesPerView, count) };
    }
    return out;
  }

  fetchSwipeElements() {
    let classList: any = this._element.nativeElement.classList;
    for(let i=0; i<classList.length; i++) {
      if(classList[i].includes("phls") || classList[i].includes("whls") || classList[i].includes("mhls") || classList[i].includes("ghls") || classList[i].includes("color_slider") || classList[i].includes("section_slider")) {
        let swipeElement = classList[i];
        if(classList[i].includes("phls") && isPlatformBrowser(this.platformId)) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            // swiper config
            let swipeConfig: any = {
              speed: 700,
              loop: false,
              breakpoints: this.adaptBreakpoints(this.highlights.break_points),
              navigation: {
                nextEl: '#highlight_next',
                prevEl: '#highlight_prev'
              }
            }
            let autoPlay = this.highlights.auto_play;
            if(autoPlay) {
              swipeConfig.autoplay = {
                delay: 1000,
                disableOnInteraction: false
              }
            }
            // initialize swiper
            new Swiper('.'+swipeElement, swipeConfig);
            if(autoPlay && swipeElement.includes("desktop")) {
              $('.'+swipeElement).hover(
                function(this: any) { this.swiper.autoplay.stop(); },
                function(this: any) { this.swiper.autoplay.start(); }
              );
            }
          }
        }
        else if(classList[i].includes("whls") && isPlatformBrowser(this.platformId)) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            // swiper config
            let swipeConfig: any = {
              speed: 700,
              loop: false,
              breakpoints: this.adaptBreakpoints(this.weaveHighlights.break_points),
              navigation: {
                nextEl: '#highlight_next',
                prevEl: '#highlight_prev'
              }
            }
            let autoPlay = this.weaveHighlights.auto_play;
            if(autoPlay) {
              swipeConfig.autoplay = {
                delay: 1000,
                disableOnInteraction: false
              }
            }
            // initialize swiper
            new Swiper('.'+swipeElement, swipeConfig);
            if(autoPlay && swipeElement.includes("desktop")) {
              $('.'+swipeElement).hover(
                function(this: any) { this.swiper.autoplay.stop(); },
                function(this: any) { this.swiper.autoplay.start(); }
              );
            }
          }
        }
        else if(classList[i].includes("mhls") && isPlatformBrowser(this.platformId)) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            // swiper config
            let swipeConfig: any = {
              speed: 700,
              loop: false,
              breakpoints: this.adaptBreakpoints(this.materialHighlights.break_points),
              navigation: {
                nextEl: '#highlight_next',
                prevEl: '#highlight_prev'
              }
            }
            let autoPlay = this.materialHighlights.auto_play;
            if(autoPlay) {
              swipeConfig.autoplay = {
                delay: 1000,
                disableOnInteraction: false
              }
            }
            // initialize swiper
            new Swiper('.'+swipeElement, swipeConfig);
            if(autoPlay && swipeElement.includes("desktop")) {
              $('.'+swipeElement).hover(
                function(this: any) { this.swiper.autoplay.stop(); },
                function(this: any) { this.swiper.autoplay.start(); }
              );
            }
          }
        }
        else if(classList[i].includes("ghls") && isPlatformBrowser(this.platformId)) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            // swiper config
            let swipeConfig: any = {
              speed: 700,
              loop: false,
              breakpoints: this.adaptBreakpoints(this.groupHighlights.break_points),
              navigation: {
                nextEl: '#group_highlight_next',
                prevEl: '#group_highlight_prev'
              }
            }
            let autoPlay = this.groupHighlights.auto_play;
            if(autoPlay) {
              swipeConfig.autoplay = {
                delay: 2000,
                disableOnInteraction: false
              }
            }
            // initialize swiper
            new Swiper('.'+swipeElement, swipeConfig);
            if(autoPlay && swipeElement.includes("desktop")) {
              $('.'+swipeElement).hover(
                function(this: any) { this.swiper.autoplay.stop(); },
                function(this: any) { this.swiper.autoplay.start(); }
              );
            }
          }
        }
        else if(classList[i].includes("section_slider") && isPlatformBrowser(this.platformId)) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            // swiper config
            let swipeConfig: any = {
              speed: 500,
              breakpoints: this.swiperInfo.break_points,
              navigation: {
                nextEl: '#section_next',
                prevEl: '#section_prev'
              }
            }
            let autoPlay = this.swiperInfo.auto_play;
            if(autoPlay) {
              swipeConfig.autoplay = {
                delay: 3000,
                disableOnInteraction: false
              }
            }
            // initialize swiper
            let swipeInit = new Swiper('.'+swipeElement, swipeConfig);
            // hover event
            if(autoPlay && swipeElement.includes("desktop")) this.autoPlayEvt(swipeInit);
          }
        }
        break;
      }
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

}