import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { VendorLoginRoutingModule } from './vendor-login-routing.module';
import { VendorLoginComponent } from './vendor-login.component';

@NgModule({
  declarations: [VendorLoginComponent],
  imports: [
    SharedModule,
    VendorLoginRoutingModule
  ]
})

export class VendorLoginModule { }