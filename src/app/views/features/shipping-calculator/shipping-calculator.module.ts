import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { ShippingCalculatorRoutingModule } from './shipping-calculator-routing.module';
import { ShippingCalculatorComponent } from './shipping-calculator.component';

@NgModule({
  declarations: [
    ShippingCalculatorComponent
  ],
  imports: [
    SharedModule,
    ShippingCalculatorRoutingModule
  ]
})

export class ShippingCalculatorModule { }