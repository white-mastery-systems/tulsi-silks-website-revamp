import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';

import { DiscountsRoutingModule } from './discounts-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { DiscountsComponent } from './discounts.component';


@NgModule({
  declarations: [DiscountsComponent],
  imports: [
    NgxPaginationModule,
    SharedModule,
    DiscountsRoutingModule
  ]
})

export class DiscountsModule { }