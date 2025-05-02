import { Directive, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DynamicAssetLoaderService } from '../../../services/dynamic-asset-loader.service';
declare const Swiper: any;
​
@Directive({
  selector: '[appHomeSwiper]'
})

export class HomeSwiperDirective {

  private observer: any;
  loadedElements: any = [];
  
  highlights: any = {
    auto_play: true,
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
      1024: { slidesPerView: 4.2, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1.5, spaceBetween: 0 }
    }
  };

  featured_products: any = {
    auto_play: true,
    spaceBetween: 15,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1.5, spaceBetween: 0 }
    }
  };

  multi_tab_featured_products: any = {
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1.5, spaceBetween: 0 }
    }
  };

  testimonial: any = {
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };
  
  blogs: any = {
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  shop_look: any = {
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1.5, spaceBetween: 0 }
    }
  };

  instagram: any = {
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private _element: ElementRef, private assetLoader: DynamicAssetLoaderService) { }
​
  ngOnInit() {
    if(isPlatformBrowser(this.platformId)) {
      this.assetLoader.load('swiper-js').then(() => {
        this.registerListenerForDomChanges();
        this.fetchSwipeElements();
      }).catch(error => console.log("err", error));
    }
  }

  registerListenerForDomChanges() {
    this.observer = new MutationObserver(() => this.fetchSwipeElements());
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
            let swipeConfig: any = {
              speed: 700, loop: true,
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
          else if(swipeElement.includes("insta")) this.initializeSwiper(swipeElement, this.instagram);
          else this.initializeSwiper(swipeElement, this.featured_products);
        }
        break;
      }
    }
  }

  initializeSwiper(swipeElement: any, configData: any) {
    // swiper config
    let swipeConfig: any = {
      speed: 500,
      breakpoints: configData.break_points,
      navigation: {
        nextEl: '#swipe_next_'+swipeElement.split("_")[1],
        prevEl: '#swipe_prev_'+swipeElement.split("_")[1]
      }
    }
    if(configData.loop) swipeConfig.loop = true;
    if(configData.auto_play) swipeConfig.autoplay = { delay: 3000, disableOnInteraction: false };
    let swipeInit = new Swiper('.'+swipeElement, swipeConfig);
    if(configData.auto_play && swipeElement.includes("desktop")) this.autoPlayEvt(swipeInit);
  }

  autoPlayEvt(swipeInit) {
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
​
}