import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../../../../shared/shared.module';

import { OrderListRoutingModule } from './order-list-routing.module';
import { OrderListComponent } from './order-list.component';

@NgModule({
  declarations: [OrderListComponent],
  imports: [
    OrderListRoutingModule,
    NgxPaginationModule,
    SharedModule
  ]
})

export class OrderListModule { }