import { APP_ID, APP_INITIALIZER, NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
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
    HammerModule,
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
    provideHttpClient(withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
