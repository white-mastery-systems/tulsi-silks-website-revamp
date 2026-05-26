import { AfterViewInit, Directive, ElementRef, Inject, Input, OnDestroy, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { CommonService } from '../../services/common.service';

/**
 * Mobile-aware lazy loader: on mobile only the small variant is shown (saves bandwidth),
 * on desktop the full image loads when in viewport. Uses `IntersectionObserver` (replaces
 * `lazysizes` to keep the runtime dependency-free).
 */
@Directive({
    selector: '[appSmallImg]',
    host: { '(error)': 'placeholder()', '(load)': 'onImgLoad()' },
    standalone: false
})

export class SmallImgDirective implements OnInit, AfterViewInit, OnDestroy {

  @Input() ImagelazyLoad: any;
  public lqip_img : any;
  private observer: IntersectionObserver | null = null;
  private fullSrc = '';
  private deferToObserver = false;

  constructor(
    private _element: ElementRef,
    private renderer: Renderer2,
    private cs: CommonService,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  ngOnInit() {
    let imgArray = this.ImagelazyLoad.split(environment.img_host);
    if (imgArray.length == 2) this.lqip_img = environment.img_host + imgArray[1].split('.').join('_s.');
    else this.lqip_img = "assets/images/placeholder.svg";
    this.fullSrc = this.ImagelazyLoad;
    this.setInitialAttributes();
  }

  ngAfterViewInit() {
    if (!this.deferToObserver) return;
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof IntersectionObserver === 'undefined') {
      this.swapToFull();
      return;
    }
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target === this._element.nativeElement) {
          this.swapToFull();
          this.disconnect();
          break;
        }
      }
    }, { rootMargin: '0px 0px 500px 0px' });
    this.observer.observe(this._element.nativeElement);
  }

  ngOnDestroy() {
    this.disconnect();
  }

  setInitialAttributes() {
    if (this.cs.desktop_device) {
      // Desktop: lazy-load full image via observer, show LQIP first with blur.
      this.deferToObserver = true;
      this.renderer.addClass(this._element.nativeElement, 'lazyload');
      this.renderer.addClass(this._element.nativeElement, 'blur-up');
      this.setImages(this.lqip_img, this.fullSrc);
    } else {
      // Mobile: only show the small variant — saves bandwidth, no observer needed.
      this.deferToObserver = false;
      this.setImages(this.lqip_img, this.lqip_img);
    }
  }

  setImages(displaySrc: string, fullSrc: string) {
    if (this._element.nativeElement.localName === 'img') {
      this.renderer.setAttribute(this._element.nativeElement, 'data-src', fullSrc);
      this.renderer.setAttribute(this._element.nativeElement, 'src', displaySrc);
    } else {
      this.renderer.setAttribute(this._element.nativeElement, 'data-bg', fullSrc);
      this.renderer.setStyle(this._element.nativeElement, 'background-image', `url(${displaySrc})`);
    }
  }

  private swapToFull() {
    const el = this._element.nativeElement;
    if (el.localName === 'img') {
      this.renderer.setAttribute(el, 'src', this.fullSrc);
    } else {
      this.renderer.setStyle(el, 'background-image', `url(${this.fullSrc})`);
      this.renderer.addClass(el, 'lazyloaded');
    }
  }

  onImgLoad() {
    const el = this._element.nativeElement;
    if (el.localName === 'img' && el.getAttribute('src') === this.fullSrc) {
      this.renderer.addClass(el, 'lazyloaded');
    }
  }

  private disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  placeholder() {
    this.lqip_img = "assets/images/placeholder.svg";
    this.ImagelazyLoad = "assets/images/placeholder.svg";
    this.fullSrc = this.ImagelazyLoad;
    this.setInitialAttributes();
  }

}
