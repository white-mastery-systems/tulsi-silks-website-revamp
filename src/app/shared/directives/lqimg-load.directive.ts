import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import '../../../assets/js/ls.unveilhooks';
import 'lazysizes/plugins/blur-up/ls.blur-up';
import lazySizes from 'lazysizes';
import { environment } from '../../../environments/environment';

@Directive({
  selector: '[appLqimgLoad]',
  host: { '(error)':'placeholder()', '(load)':'addBlur()' }
})

export class LqimgLoadDirective {

  @Input() ImagelazyLoad: any;
  public lqip_img : any;

  constructor(private _element: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    this.lqip_img = "assets/images/placeholder.svg";
    if(lazySizes) lazySizes.init();
    this.setAttributes();
  }

  setAttributes() {
    let imgPathName = "assets/images/placeholder.svg";
    let imgArray = this.ImagelazyLoad.split(environment.img_host);
    if(imgArray.length==2) imgPathName = environment.img_host+imgArray[1].split('.').join('_s.');

    this.renderer.addClass(this._element.nativeElement, 'lazyload');

    let objImg: any = this._element.nativeElement;
    objImg.src = this.ImagelazyLoad;
    if(objImg.complete) {
      imgPathName = this.ImagelazyLoad;
      this.lqip_img = this.ImagelazyLoad;
    }
    
    if(this._element.nativeElement.localName === 'img') {
      this.renderer.setAttribute(this._element.nativeElement, 'data-src', imgPathName);
      this.renderer.setAttribute(this._element.nativeElement, 'src', this.lqip_img);
    }
    else {
      this.renderer.setAttribute(this._element.nativeElement, 'data-bg', imgPathName);
      this.renderer.setStyle(this._element.nativeElement, 'background-image', `url(${this.lqip_img})`);
    }
  }

  placeholder() {
    this.lqip_img = "assets/images/placeholder.svg";
    this.ImagelazyLoad = "assets/images/placeholder.svg";
    this.setAttributes();
  }

  addBlur() {
    if(this._element.nativeElement.src.indexOf('assets/images/placeholder.svg') === -1) {
      this.renderer.addClass(this._element.nativeElement, 'lq-blur-up');
    }
  }

}