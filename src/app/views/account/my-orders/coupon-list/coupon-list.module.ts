import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../../../../shared/shared.module';

import { CouponListRoutingModule } from './coupon-list-routing.module';
import { CouponListComponent } from './coupon-list.component';

@NgModule({
  declarations: [CouponListComponent],
  imports: [
    SharedModule,
    NgxPaginationModule,
    CouponListRoutingModule
  ]
})

export class CouponListModule { }