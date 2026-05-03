import { Directive, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DynamicAssetLoaderService } from '../../../services/dynamic-asset-loader.service';
declare const Swiper: any;
​
@Directive({
    selector: '[appRelatedProducts]',
    standalone: false
})

export class RelatedProductsDirective {

  private observer: any;
  loadedElements: any = [];
  
  private swiperInfo: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 4.2, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 15 },
      640: { slidesPerView: 2, spaceBetween: 15 },
      320: { slidesPerView: 1.5, spaceBetween: 15 }
    }
  };
  private blogSwiperInfo: any = {
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 4.2, spaceBetween: 15 },
      768: { slidesPerView: 3, spaceBetween: 15 },
      640: { slidesPerView: 2, spaceBetween: 15 },
      320: { slidesPerView: 1.5, spaceBetween: 15 }
    }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private _element: ElementRef, private assetLoader: DynamicAssetLoaderService) { }

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
      if(classList[i].includes("related_prod_slider1")) {
        let swipeElement = classList[i];
        if(this.loadedElements.indexOf(swipeElement) == -1) {
          this.loadedElements.push(swipeElement);
          // swiper config
          let swipeConfig: any = {
            speed: 500,
            breakpoints: this.swiperInfo.break_points,
            navigation: {
              nextEl: '#related_prod_next1',
              prevEl: '#related_prod_prev1'
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
          if(autoPlay && swipeElement.includes("desktop")) {
            swipeInit.el.addEventListener("mouseover", () => {  
              swipeInit.autoplay.stop();
            });
            swipeInit.el.addEventListener("mouseout", () => {   
              swipeInit.autoplay.start();
            });
          }
        }
      }
      else if(classList[i].includes("related_prod_slider2")) {
        let swipeElement = classList[i];
        if(this.loadedElements.indexOf(swipeElement) == -1) {
          this.loadedElements.push(swipeElement);
          // swiper config
          let swipeConfig: any = {
            speed: 500,
            breakpoints: this.swiperInfo.break_points,
            navigation: {
              nextEl: '#related_prod_next2',
              prevEl: '#related_prod_prev2'
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
          if(autoPlay && swipeElement.includes("desktop")) {
            swipeInit.el.addEventListener("mouseover", () => {  
              swipeInit.autoplay.stop();
            });
            swipeInit.el.addEventListener("mouseout", () => {   
              swipeInit.autoplay.start();
            });
          }
        }
      }
      else if(classList[i].includes("blogslider1")) {
        let swipeElement = classList[i];
        if(this.loadedElements.indexOf(swipeElement) == -1) {
          this.loadedElements.push(swipeElement);
          // swiper config
          let swipeConfig: any = {
            speed: 500,
            // breakpoints: this.blogSwiperInfo.break_points,
            navigation: {
              nextEl: '#blog_next2',
              prevEl: '#blog_prev2'
            }
          }
          let autoPlay = this.blogSwiperInfo.auto_play;
          if(autoPlay) {
            swipeConfig.autoplay = {
              delay: 3000,
              disableOnInteraction: false
            }
          }
          // initialize swiper
          let swipeInit = new Swiper('.'+swipeElement, swipeConfig);
          // hover event
          if(autoPlay && swipeElement.includes("desktop")) {
            swipeInit.el.addEventListener("mouseover", () => {  
              swipeInit.autoplay.stop();
            });
            swipeInit.el.addEventListener("mouseout", () => {   
              swipeInit.autoplay.start();
            });
          }
        }
      }
    }
  }

  ngOnDestroy() {
    if(isPlatformBrowser(this.platformId) && this.observer) this.observer.disconnect();
  }
​
}