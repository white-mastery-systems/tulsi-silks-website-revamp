import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { VendorRegisterRoutingModule } from './vendor-register-routing.module';
import { VendorRegisterComponent } from './vendor-register.component';

@NgModule({
  declarations: [VendorRegisterComponent],
  imports: [
    SharedModule,
    VendorRegisterRoutingModule
  ]
})

export class VendorRegisterModule { }