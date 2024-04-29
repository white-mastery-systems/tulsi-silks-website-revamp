import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import '../../../assets/js/ls.unveilhooks';
import 'lazysizes/plugins/blur-up/ls.blur-up';
import lazySizes from 'lazysizes';
import { environment } from '../../../environments/environment';
import { CommonService } from '../../services/common.service';

@Directive({
  selector: '[appSmallImg]',
  host: { '(error)':'placeholder()' }
})

export class SmallImgDirective {

  @Input() ImagelazyLoad: any;
  public lqip_img : any;

  constructor(private _element: ElementRef, private renderer: Renderer2, private cs: CommonService) { }

  ngOnInit() {
    let imgArray = this.ImagelazyLoad.split(environment.img_host);
    if(imgArray.length==2) this.lqip_img = environment.img_host+imgArray[1].split('.').join('_s.');
    else this.lqip_img = "assets/images/placeholder.svg";
    if(lazySizes) lazySizes.init();
    this.setAttributes();
  }

  setAttributes() {
    if(this.cs.desktop_device) {
      this.renderer.addClass(this._element.nativeElement, 'lazyload');
      let objImg: any = this._element.nativeElement;
      objImg.src = this.ImagelazyLoad;
      if(objImg.complete) {
        this.lqip_img = this.ImagelazyLoad;
        this.renderer.removeClass(this._element.nativeElement, 'blur-up');
      }
      else this.renderer.addClass(this._element.nativeElement, 'blur-up');
      this.setImages(this.lqip_img, this.ImagelazyLoad);
    }
    else this.setImages(this.lqip_img, this.lqip_img);
  }

  setImages(lqImg, hqImg) {
    if(this._element.nativeElement.localName === 'img') {
      this.renderer.setAttribute(this._element.nativeElement, 'data-src', hqImg);
      this.renderer.setAttribute(this._element.nativeElement, 'src', lqImg);
    }
    else {
      this.renderer.setAttribute(this._element.nativeElement, 'data-bg', hqImg);
      this.renderer.setStyle(this._element.nativeElement, 'background-image', `url(${lqImg})`);
    }
  }

  placeholder() {
    this.lqip_img = "assets/images/placeholder.svg";
    this.ImagelazyLoad = "assets/images/placeholder.svg";
    this.setAttributes();
  }

}