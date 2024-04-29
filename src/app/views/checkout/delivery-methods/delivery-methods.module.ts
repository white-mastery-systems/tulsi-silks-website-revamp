import { NgModule } from '@angular/core';

import { DeliveryMethodsRoutingModule } from './delivery-methods-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { DeliveryMethodsComponent } from './delivery-methods.component';

@NgModule({
  declarations: [DeliveryMethodsComponent],
  imports: [
    SharedModule,
    DeliveryMethodsRoutingModule
  ]
})

export class DeliveryMethodsModule { }