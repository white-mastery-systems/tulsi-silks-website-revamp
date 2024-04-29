import { NgModule } from '@angular/core';

import { CartRoutingModule } from './cart-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CustomizationModule } from '../../shared/modules/customization/customization.module';
import { CartComponent } from './cart.component';

@NgModule({
  declarations: [CartComponent],
  imports: [
    SharedModule,
    CustomizationModule,
    CartRoutingModule
  ]
})

export class CartModule { }