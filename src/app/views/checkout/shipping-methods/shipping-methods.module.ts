import { NgModule } from '@angular/core';

import { ShippingMethodsRoutingModule } from './shipping-methods-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { ShippingMethodsComponent } from './shipping-methods.component';

@NgModule({
  declarations: [ShippingMethodsComponent],
  imports: [
    SharedModule,
    ShippingMethodsRoutingModule
  ]
})

export class ShippingMethodsModule { }