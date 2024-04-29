import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import '../../../assets/js/ls.unveilhooks';
import 'lazysizes/plugins/blur-up/ls.blur-up';
import lazySizes from 'lazysizes';
import { environment } from '../../../environments/environment';

@Directive({
  selector: '[appImgLazyLoad]',
  host: { '(error)':'placeholder()' }
})

export class ImgLazyLoadDirective {

  @Input() ImagelazyLoad: any;
  public lqip_img : any;

  constructor(private _element: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    let imgArray = this.ImagelazyLoad.split(environment.img_host);
    if(imgArray.length==2) this.lqip_img = environment.img_host+imgArray[1].split('.').join('_s.');
    else this.lqip_img = "assets/images/placeholder.svg";
    if(lazySizes) lazySizes.init();
    this.setAttributes();
  }

  setAttributes() {
    this.renderer.addClass(this._element.nativeElement, 'lazyload');

    let objImg: any = this._element.nativeElement;
    objImg.src = this.ImagelazyLoad;
    if(objImg.complete) {
      this.lqip_img = this.ImagelazyLoad;
      this.renderer.removeClass(this._element.nativeElement, 'blur-up');
    }
    else this.renderer.addClass(this._element.nativeElement, 'blur-up');

    if(this._element.nativeElement.localName === 'img') {
      this.renderer.setAttribute(this._element.nativeElement, 'data-src', this.ImagelazyLoad);
      this.renderer.setAttribute(this._element.nativeElement, 'src', this.lqip_img);
    }
    else {
      this.renderer.setAttribute(this._element.nativeElement, 'data-bg', this.ImagelazyLoad);
      this.renderer.setStyle(this._element.nativeElement, 'background-image', `url(${this.lqip_img})`);
    }
  }

  placeholder() {
    this.lqip_img = "assets/images/placeholder.svg";
    this.ImagelazyLoad = "assets/images/placeholder.svg";
    this.setAttributes();
  }

}