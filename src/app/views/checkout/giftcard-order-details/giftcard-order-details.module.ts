import { NgModule } from '@angular/core';

import { GiftcardOrderDetailsRoutingModule } from './giftcard-order-details-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { GiftcardOrderDetailsComponent } from './giftcard-order-details.component';

@NgModule({
  declarations: [GiftcardOrderDetailsComponent],
  imports: [
    SharedModule,
    GiftcardOrderDetailsRoutingModule
  ]
})

export class GiftcardOrderDetailsModule { }