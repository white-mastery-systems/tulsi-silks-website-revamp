import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CustomizationModule } from '../../shared/modules/customization/customization.module';

import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutHeaderComponent } from '../../shared/components/headers/checkout-header/checkout-header.component';

@NgModule({
  declarations: [CheckoutHeaderComponent],
  imports: [
    SharedModule,
    CustomizationModule,
    CheckoutRoutingModule
  ]
})

export class CheckoutModule { }