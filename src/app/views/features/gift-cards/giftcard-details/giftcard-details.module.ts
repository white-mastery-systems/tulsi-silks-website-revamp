import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { GiftcardDetailsRoutingModule } from './giftcard-details-routing.module';
import { GiftcardDetailsComponent } from './giftcard-details.component';

@NgModule({
  declarations: [GiftcardDetailsComponent],
  imports: [
    SharedModule,
    GiftcardDetailsRoutingModule
  ]
})

export class GiftcardDetailsModule { }