import {
  Directive,
  ElementRef,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
    selector: '[appSegmentIntersection]',
    standalone: false
})

export class SegmentIntersectionDirective implements AfterViewInit {

  private observer!: IntersectionObserver;

  options: IntersectionObserverInit = {
    threshold: 0.6,
    rootMargin: '0px 0px -40% 0px' // triggers around mid-screen
  };

  constructor(
    private _element: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.observer = new IntersectionObserver(
        this.checkForIntersection,
        this.options
      );
      this.observer.observe(this._element.nativeElement);
    }
  }

  private checkForIntersection = (
    entries: IntersectionObserverEntry[]
  ): void => {
    entries.forEach((entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const imageElement = document.getElementById('main-image') as HTMLImageElement;

        // Instead of using element.id directly as image src, get image URL from data attribute
        const newImageSrc = element.id; 

        if (imageElement && newImageSrc) {
          imageElement.style.opacity = '0';
          setTimeout(() => {
            imageElement.src = newImageSrc;
            imageElement.style.opacity = '1';
          }, 300);
        }
      }
    });
  };
  
}
