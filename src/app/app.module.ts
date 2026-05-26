import { APP_ID, APP_INITIALIZER, NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http';
import { BrowserModule, provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { QuicklinkModule } from 'ngx-quicklink';
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
    QuicklinkModule,
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
    // Client hydration — Angular reuses the SSR-rendered DOM instead of tearing it down
    // and rebuilding from scratch. Without this, every SSR'd element flickers/swaps on
    // client bootstrap, blowing up TBT and LCP. Components that need to bypass hydration
    // (e.g. third-party DOM libs) can opt out with the `ngSkipHydration` attribute.
    //
    // withHttpTransferCacheOptions: GET responses Angular makes during SSR are serialized
    // into the page and replayed instantly on the client — no second network round-trip
    // for STORE_DETAILS / layout / catalog data. `includePostRequests: false` is the
    // default; we keep it because POST requests are user-initiated and shouldn't replay.
    provideClientHydration(
      withHttpTransferCacheOptions({
        includeHeaders: ['Content-Type'],
        filter: () => true,
      })
    ),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
