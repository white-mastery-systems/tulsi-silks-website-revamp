import { Directive, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DynamicAssetLoaderService } from '../../../services/dynamic-asset-loader.service';
declare const Swiper: any;
declare const $: any;

@Directive({
  selector: '[appCategoryHighlights]'
})

export class CategoryHighlightsDirective {

  private observer: any;
  loadedElements: any = [];

  color_swiper: any ={
    auto_play: false,
    break_points: {
      1024: { slidesPerView: 7, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 3, spaceBetween: 0 },
      320: { slidesPerView: 3.5, spaceBetween: 2 }
    }
  };

  highlights: any = {
    card_count: 6,
    auto_play: true,
    loop:true,
    break_points: {
      1024: { slidesPerView: 7.5, spaceBetween: 0 },
      768: { slidesPerView: 4.5, spaceBetween: 0 },
      640: { slidesPerView: 3.5, spaceBetween: 0 },
      320: { slidesPerView: 3.5, spaceBetween: 0 }
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, private _element: ElementRef,
    private assetLoader: DynamicAssetLoaderService
  ) { }

  ngOnInit() {
    if(isPlatformBrowser(this.platformId)) {
      this.assetLoader.load('swiper-css', 'swiper-js').then(() => {
        this.registerListenerForDomChanges();
        this.fetchSwipeElements();
      }).catch(error => console.log("err", error));
    }
  }
​
  private registerListenerForDomChanges() {
    this.observer = new MutationObserver(() => this.fetchSwipeElements());
    const attributes = false; const childList = true; const subtree = true;
    this.observer.observe(this._element.nativeElement, { attributes, childList, subtree });
  }

  ngAfterViewInit() {
    if(isPlatformBrowser(this.platformId)) {
      this.assetLoader.load('jquery', 'swiper-js').then(() => {
        this.registerListenerForDomChanges();
        this.fetchSwipeElements();
      }).catch(error => console.log("err", error));
    }
  }

  fetchSwipeElements() {
    let classList: any = this._element.nativeElement.classList;
    for(let i=0; i<classList.length; i++) {
      if(classList[i].includes("phls") || classList[i].includes("color_slider")) {
        let swipeElement = classList[i];

        if(this.loadedElements.indexOf(swipeElement) == -1 && isPlatformBrowser(this.platformId)) {
          this.loadedElements.push(swipeElement);
          // swiper config
          let swipeConfig: any = {
            speed: 700,
            loop: true,
            breakpoints: this.highlights.break_points,
            navigation: {
              nextEl: '#highlight_next',
              prevEl: '#highlight_prev'
            }
          }
          let autoPlay = this.highlights.auto_play;
          if(autoPlay) {
            swipeConfig.autoplay = {
              delay: 500,
              disableOnInteraction: false
            }
          }
          // initialize swiper
          new Swiper('.'+swipeElement, swipeConfig);
          // hover event
          if(autoPlay && swipeElement.includes("desktop")) {
            $('.'+swipeElement).hover(function () {
              (this).swiper.autoplay.stop();
            }, function () {
              (this).swiper.autoplay.start();
            });
          }
        }

        else if(classList[i].includes("color_slider")) {
          if(this.loadedElements.indexOf(swipeElement) == -1) {
            this.loadedElements.push(swipeElement);
            // swiper config
            let swipeConfig: any = {
              speed: 500,
              breakpoints: this.color_swiper.break_points,
              navigation: {
                nextEl: '#color_slider_next',
                prevEl: '#color_slider_prev'
              }
            }
            let autoPlay = this.color_swiper.auto_play;
            if(autoPlay) {
              swipeConfig.autoplay = {
                delay: 3000,
                disableOnInteraction: false
              }
            }
            // initialize swiper
            let swipeInit = new Swiper('.'+swipeElement, swipeConfig);
            if(swipeConfig.auto_play && swipeElement.includes("desktop")) this.autoPlayEvt(swipeInit);
            let ele:any = document.getElementsByClassName(swipeElement)[0];
            ele.style.visibility = "unset";
          }
        }
        break;
      }
    }
  }

  autoPlayEvt(swipeInit) {
    swipeInit.el.addEventListener("mouseover", () => {  
      swipeInit.autoplay.stop();
    });
    swipeInit.el.addEventListener("mouseout", () => {   
      swipeInit.autoplay.start();
    });
  }
​
}