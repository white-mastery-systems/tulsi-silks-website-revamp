import { Directive, ElementRef, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare var Swiper: any;

@Directive({
    selector: '[appHeritageSwiper]',
    standalone: false
})
export class HeritageSwiperDirective implements AfterViewInit, OnDestroy {
  private swiper: any;

  constructor(
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initSwiper();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.swiper) {
        this.swiper.destroy(true, true);
      }
    }
  }

  private initSwiper(): void {
    setTimeout(() => {
      this.swiper = new Swiper(this.el.nativeElement, {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        },
        pagination: {
          el: '.heritage-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.heritage-next',
          prevEl: '.heritage-prev',
        },
        effect: 'slide',
        speed: 600,
        grabCursor: true,
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: true,
      });
    }, 100);
  }
  
}