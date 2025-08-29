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
      if(classList[i].includes("phls")) {
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
        break;
      }
    }
  }
​
}