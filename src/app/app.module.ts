import { APP_ID, APP_INITIALIZER, NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserModule, provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { SsrApiCacheInterceptor } from './interceptors/ssr-api-cache.interceptor';
import { SsrTransferCacheTrimInterceptor } from './interceptors/ssr-transfer-cache-trim.interceptor';
import { SsrHttpTimeoutInterceptor } from './interceptors/ssr-http-timeout.interceptor';

import { DeviceDetectorService } from 'ngx-device-detector';
import { ConnectionService } from 'ng-connection-service';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { SharedModule } from './shared/shared.module';
import { serverSeoInitializerFactory, SERVER_SEO_INITIALIZER_DEPS } from './server-seo.initializer';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    FormsModule,
  ],
  providers: [
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: serverSeoInitializerFactory,
      deps: [...SERVER_SEO_INITIALIZER_DEPS],
    },
    { provide: APP_ID, useValue: 'serverApp' },
    DatePipe,
    DeviceDetectorService,
    ConnectionService,
    // Fetch backend is REQUIRED for HTTP transfer cache to work (XMLHttpRequest backend
    // is not interceptable for SSR → client transfer). All existing DI interceptors
    // (auth, error, etc.) keep working unchanged.
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    // ── SSR interceptor chain (server-only; DI interceptors run in registration
    //    order for requests; reverse for responses relative to the HTTP backend) ──
    //
    // 1. SsrApiCacheInterceptor — FIRST: serves cached API bodies for
    //    all GET requests from a module-level Map that survives across renders.
    //    First render populates the cache (~10 s); subsequent renders return
    //    instantly (~0 ms), collapsing 10–13 s SSR time to ~100–300 ms.
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SsrApiCacheInterceptor,
      multi: true,
    },
    // 2. SsrHttpTimeoutInterceptor — SECOND: caps each API call at 1.2–2.5 s
    //    so one slow upstream endpoint cannot block the entire SSR render.
    //    Cache hits from step 1 never reach this interceptor.
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SsrHttpTimeoutInterceptor,
      multi: true,
    },
    // 3. SsrTransferCacheTrimInterceptor — THIRD: strips heavy fields from
    //    LAYOUT_LIST + blog responses before the Angular transfer cache stores
    //    them as inline JSON in the SSR HTML <script> tag.
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SsrTransferCacheTrimInterceptor,
      multi: true,
    },
    // Client hydration — Angular reuses the SSR-rendered DOM instead of tearing it down
    // and rebuilding from scratch. Without this, every SSR'd element flickers/swaps on
    // client bootstrap, blowing up TBT and LCP. Components that need to bypass hydration
    // (e.g. third-party DOM libs) can opt out with the `ngSkipHydration` attribute.
    //
    // withHttpTransferCacheOptions: GET responses from SSR replay on the client instantly.
    // filter excludes only graph.instagram.com — Instagram post data (media_url,
    // captions, 15 posts) is pure client-side UI; the client re-fetches it fresh.
    // AI_STYLES is deliberately kept in the cache because the shopping-assistant
    // section renders based on it during SSR and needs it at hydration time.
    provideClientHydration(
      withHttpTransferCacheOptions({
        includeHeaders: ['Content-Type'],
        filter: (req) => {
          const u = req.url;
          if (u.includes('graph.instagram.com')) return false;
          // Below-fold APIs are not called during SSR; exclude from transfer cache.
          if (u.includes('/store_details/ai_styles')) return false;
          return true;
        },
      })
    ),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
