import { Injectable, Inject, DOCUMENT } from '@angular/core';


interface Scripts {
  name: string; type: string; src: string;
}

export const CssStore: Scripts[] = [
  { name: 'swiper-css', type: 'css', src: 'assets/css/swiper.css' },
  { name: 'quill-css', type: 'css', src: 'assets/css/quill-core.css' },
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
  { name: 'script-js', type: 'js', src: 'assets/js/script.js?v=2' },
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

  /** In-flight load promises — guards against parallel `loadAsset()` calls attaching
   * duplicate &lt;script&gt;/&lt;link&gt; nodes before `onload` flips `.loaded=true`.
   * On the home page ~15 directives each trigger `swiper-js`/`swiper-css` at once —
   * without this dedupe Lighthouse sees 10+ redundant Swiper downloads + parse passes,
   * which directly blows up TBT. */
  private readonly pendingLoads: Map<string, Promise<{ script: string; loaded: boolean; status: string }>> =
    new Map();

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
    if (this.scripts[name]?.loaded) {
      return Promise.resolve({ script: name, loaded: true, status: 'Already Loaded' });
    }

    let inflight = this.pendingLoads.get(name);
    if (inflight) {
      return inflight;
    }

    inflight = new Promise((resolve) => {
      const finish = (): void => {
        this.pendingLoads.delete(name);
      };

      let targetElement = this.scripts[name].type == 'js' ? 'script' : 'link';
      let script = this.document.createElement(targetElement);
      if (this.scripts[name].type == 'js') {
        script.type = 'text/javascript';
        script.src = this.scripts[name].src;
      } else {
        script.rel = 'stylesheet';
        script.href = this.scripts[name].src;
      }

      const onDone = (): void => {
        this.scripts[name].loaded = true;
        finish();
        resolve({ script: name, loaded: true, status: 'Loaded' });
      };

      if ((script as any).readyState) {
        script.onreadystatechange = (): void => {
          if (
            script.readyState === 'loaded' ||
            script.readyState === 'complete'
          ) {
            script.onreadystatechange = null;
            onDone();
          }
        };
      } else {
        script.onload = (): void => onDone();
      }
      script.onerror = (): void => {
        finish();
        resolve({ script: name, loaded: false, status: 'Error' });
      };
      this.document.getElementsByTagName('head')[0].appendChild(script);
    });

    this.pendingLoads.set(name, inflight);
    return inflight;
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
      this.pendingLoads.delete(name);
      this.scripts[name].loaded = false;
      resolve(true);
    });
  }

}