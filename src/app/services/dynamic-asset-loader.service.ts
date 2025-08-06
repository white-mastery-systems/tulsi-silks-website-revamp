import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

interface Scripts {
  name: string; type: string; src: string;
}

export const CssStore: Scripts[] = [
  { name: 'default-skin', type: 'css', src: 'assets/css/default-skin.min.css' },
  { name: 'squarepay', type: 'css', src: 'assets/css/squarepay.css' },
  { name: 'headroom-css', type: 'css', src: 'assets/css/headroom.css' },
  { name: 'plyr-css', type: 'css', src: 'assets/css/plyr.min.css' },
  { name: 'bs-datepicker', type: 'css', src: 'https://unpkg.com/ngx-bootstrap@6.2.0/datepicker/bs-datepicker.css' },
  { name: 'photoswipe', type: 'css', src: 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.1/photoswipe.min.css' },
  { name: 'headroom-js', type: 'js', src: 'https://cdnjs.cloudflare.com/ajax/libs/headroom/0.10.2/headroom.min.js' },
  { name: 'wow-js', type: 'js', src: 'https://cdnjs.cloudflare.com/ajax/libs/wow/1.1.2/wow.min.js' },
  { name: 'jquery', type: 'js', src: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js' },
  { name: 'square-sandbox', type: 'js', src: 'https://js.squareupsandbox.com/v2/paymentform' },
  { name: 'square-live', type: 'js', src: 'https://js.squareup.com/v2/paymentform' },
  { name: 'razorpay', type: 'js', src: 'https://checkout.razorpay.com/v1/checkout.js' },
  { name: 'script-js', type: 'js', src: 'assets/js/script.js' },
  { name: 'swiper-js', type: 'js', src: 'assets/js/swiper.min.js' },
  { name: 'foloosipay', type: 'js', src: 'assets/js/foloosi.js' },
  { name: 'plyr-js', type: 'js', src: 'assets/js/plyr.min.js' },
  { name: 'web-story-js1', type: 'js', src: 'https://cdn.ampproject.org/v0.js' },
  { name: 'web-story-js2', type: 'js', src: 'https://cdn.ampproject.org/v0/amp-story-1.0.js' }
];

@Injectable({
  providedIn: 'root'
})

export class DynamicAssetLoaderService {

  private scripts: any = {};

  constructor(@Inject(DOCUMENT) private document) {
    CssStore.forEach((script: any) => {
      this.scripts[script.name] = {
        type: script.type, src: script.src, loaded: false
      };
    });
  }

  load(...scripts: string[]) {
    const promises: any[] = [];
    scripts.forEach((script) => promises.push(this.loadAsset(script)));
    return Promise.all(promises);
  }

  unload(...scripts: string[]) {
    const promises: any[] = [];
    scripts.forEach((script) => promises.push(this.unloadAsset(script)));
    return Promise.all(promises);
  }

  loadAsset(name: string) {
    return new Promise((resolve, reject) => {
      if(!this.scripts[name].loaded) {
        let targetElement = (this.scripts[name].type=="js")? "script": "link";
        let script = this.document.createElement(targetElement);
        if(this.scripts[name].type=="js") {
          script.type = 'text/javascript';
          script.src = this.scripts[name].src;
        }
        else {
          script.rel = 'stylesheet';
          script.href = this.scripts[name].src;
        }
        if(script.readyState) {  //IE
          script.onreadystatechange = () => {
            if(script.readyState === "loaded" || script.readyState === "complete") {
              script.onreadystatechange = null;
              this.scripts[name].loaded = true;
              resolve({script: name, loaded: true, status: 'Loaded'});
            }
          };
        }
        else {  //Others
          script.onload = () => {
            this.scripts[name].loaded = true;
            resolve({script: name, loaded: true, status: 'Loaded'});
          };
        }
        script.onerror = (error: any) => resolve({script: name, loaded: false, status: 'Loaded'});
        this.document.getElementsByTagName('head')[0].appendChild(script);
      }
      else {
        resolve({ script: name, loaded: true, status: 'Already Loaded' });
      }
    });
  }

  unloadAsset(name: string) {
    return new Promise((resolve, reject) => {
      let targetElement = this.scripts[name].type=="js"? "script": "link";
      let targetAttr = this.scripts[name].type=="js"? "src": "href";
      let allsuspects = this.document.getElementsByTagName(targetElement);
      for(let i=allsuspects.length; i>=0; i--)
      {
        if(allsuspects[i] && allsuspects[i].getAttribute(targetAttr)!=null && allsuspects[i].getAttribute(targetAttr).indexOf(this.scripts[name].src)!=-1)
        allsuspects[i].parentNode.removeChild(allsuspects[i])
      }
      this.scripts[name].loaded = false;
      resolve(true);
    });
  }

}