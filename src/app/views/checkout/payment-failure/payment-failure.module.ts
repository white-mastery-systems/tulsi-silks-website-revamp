import { NgModule } from '@angular/core';

import { PaymentFailureRoutingModule } from './payment-failure-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { PaymentFailureComponent } from './payment-failure.component';

@NgModule({
  declarations: [PaymentFailureComponent],
  imports: [
    SharedModule,
    PaymentFailureRoutingModule
  ]
})

export class PaymentFailureModule { }