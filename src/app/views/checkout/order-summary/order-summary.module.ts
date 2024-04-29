import { NgModule } from '@angular/core';

import { OrderSummaryRoutingModule } from './order-summary-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { OrderSummaryComponent } from './order-summary.component';

@NgModule({
  declarations: [OrderSummaryComponent],
  imports: [
    SharedModule,
    OrderSummaryRoutingModule
  ]
})

export class OrderSummaryModule { }