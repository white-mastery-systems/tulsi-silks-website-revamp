import { Directive, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwiperService } from '../../../services/swiper.service';
declare const Swiper: any;
declare const $: any;
​
@Directive({
    selector: '[appHomeHighlights]',
    standalone: false
})

export class HomeHighlightsDirective {

  private observer = new MutationObserver(() => this.fetchSwipeElements());

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private _element: ElementRef, private swiperService: SwiperService) { }
​
  private registerListenerForDomChanges() {
    const attributes = false; const childList = true; const subtree = true;
    this.observer.observe(this._element.nativeElement, { attributes, childList, subtree });
  }

  ngAfterViewInit() {
    this.registerListenerForDomChanges();
    this.fetchSwipeElements();
  }

  fetchSwipeElements() {
    let classList: any = this._element.nativeElement.classList;
    for(let i=0; i<classList.length; i++) {
      if(classList[i].includes("phls")) {
        let swipeElement = classList[i];
        if(isPlatformBrowser(this.platformId)) {
          // swiper config
          let swipeConfig: any = {
            speed: 500,
            breakpoints: this.swiperService.highlights.break_points,
            navigation: {
              nextEl: '#highlight_next',
              prevEl: '#highlight_prev'
            }
          }
          let autoPlay = this.swiperService.highlights.auto_play;
          if(autoPlay) {
            swipeConfig.autoplay = {
              delay: 3000,
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