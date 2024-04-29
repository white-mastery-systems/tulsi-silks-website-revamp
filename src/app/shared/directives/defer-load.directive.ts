import { Directive, ElementRef, Input, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appDeferLoad]',
  host: { '(load)':'removeBlur()' }
})

export class DeferLoadDirective {
  
  @Input() ImagelazyLoad: any;
  private observer : IntersectionObserver;
  options: any = {
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], rootMargin: '250px'
  }

  constructor(private _element: ElementRef, private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: any) {}

  public ngAfterViewInit () {
    if(isPlatformBrowser(this.platformId)) {
      this.observer = new IntersectionObserver(entries => {
        this.checkForIntersection(entries);
      }, this.options);
      this.observer.observe(<Element>(this._element.nativeElement));
    }
  }

  private checkForIntersection = (entries: Array<IntersectionObserverEntry>) => {
    entries.forEach((entry: IntersectionObserverEntry) => {
      if(this.checkIfIntersecting(entry)) {
        if(this._element.nativeElement.localName === 'img') {
          this.renderer.setAttribute(this._element.nativeElement, 'data-src', this.ImagelazyLoad);
          this.renderer.setAttribute(this._element.nativeElement, 'src', this.ImagelazyLoad);
        }
        else {
          this.renderer.setAttribute(this._element.nativeElement, 'data-bg', this.ImagelazyLoad);
          this.renderer.setStyle(this._element.nativeElement, 'background-image', `url(${this.ImagelazyLoad})`);
        }
        this.observer.unobserve(<Element>(this._element.nativeElement));
        this.observer.disconnect();
      }
    });
  }
  
  private checkIfIntersecting (entry: IntersectionObserverEntry) {
    return (<any>entry).isIntersecting && entry.target === this._element.nativeElement;
  }

  removeBlur() {
    if(this._element.nativeElement.src==this.ImagelazyLoad) {
      this.renderer.removeClass(this._element.nativeElement, 'lq-blur-up');
    }
  }

}