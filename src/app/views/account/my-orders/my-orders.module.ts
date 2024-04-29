import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { MyOrdersRoutingModule } from './my-orders-routing.module';
import { MyOrdersComponent } from './my-orders.component';

@NgModule({
  declarations: [MyOrdersComponent],
  imports: [
    MyOrdersRoutingModule,
    SharedModule
  ]
})

export class MyOrdersModule { }