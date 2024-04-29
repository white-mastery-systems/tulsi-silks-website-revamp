import { Directive, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
declare const Swiper: any;

@Directive({
  selector: '[appSwiperCarousal]'
})

export class SwiperCarousalDirective {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit() {
    if(isPlatformBrowser(this.platformId)) {
      new Swiper('.swiper_carousal', {
        speed: 700,
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        pagination: {
          el: '#swiper_pagination',
          clickable: true
        },
        navigation: {
          nextEl: '#swiper_next',
          prevEl: '#swiper_prev'
        }
      });
    }
  }

}