import { NgModule } from '@angular/core';
import { CustomizationModule } from '../../../shared/modules/customization/customization.module';
import { SharedModule } from '../../../shared/shared.module';

import { OrderReviewRoutingModule } from './order-review-routing.module';
import { OrderReviewComponent } from './order-review.component';

@NgModule({
  declarations: [OrderReviewComponent],
  imports: [
    SharedModule,
    CustomizationModule,
    OrderReviewRoutingModule
  ]
})

export class OrderReviewModule { }