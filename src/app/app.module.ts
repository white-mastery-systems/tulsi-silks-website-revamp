import { APP_ID, APP_INITIALIZER, NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserModule, provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

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
    // SsrTransferCacheTrimInterceptor runs server-side only and strips heavy fields
    // from LAYOUT_LIST products + blog list BEFORE the transfer cache serialises them
    // into the SSR HTML. DI interceptors see responses before Angular's functional
    // transfer-cache interceptor, so what the transfer cache stores is already trimmed.
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SsrHttpTimeoutInterceptor,
      multi: true,
    },
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
