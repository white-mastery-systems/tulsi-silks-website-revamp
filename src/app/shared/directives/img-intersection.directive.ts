import { Directive, ElementRef, Input, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
    selector: '[appImgIntersection]',
    standalone: false
})

export class ImgIntersectionDirective {
  
  public lqip_img : any;
  @Input() ImagelazyLoad: any;
  private observer : IntersectionObserver;

  constructor(private _element: ElementRef, private renderer: Renderer2, @Inject(PLATFORM_ID) private platformId: any) {}

  public ngAfterViewInit () {
    this.lqip_img = "assets/images/placeholder.svg";
    this.renderer.setAttribute(this._element.nativeElement, 'src', this.lqip_img);
    if(isPlatformBrowser(this.platformId)) {
      this.observer = new IntersectionObserver(entries => {
        this.checkForIntersection(entries);
      }, {});
      this.observer.observe(<Element>(this._element.nativeElement));
    }
  }

  private checkForIntersection = (entries: Array<IntersectionObserverEntry>) => {
    entries.forEach((entry: IntersectionObserverEntry) => {
      if(this.checkIfIntersecting(entry)) {
        if(this._element.nativeElement.localName === 'img') {
          this.renderer.setAttribute(this._element.nativeElement, 'src', this.ImagelazyLoad);
        }
        else {
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

}