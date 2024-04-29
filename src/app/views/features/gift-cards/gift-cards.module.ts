import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { GiftCardsRoutingModule } from './gift-cards-routing.module';
import { GiftCardsComponent } from './gift-cards.component';

@NgModule({
  declarations: [GiftCardsComponent],
  imports: [
    SharedModule,
    GiftCardsRoutingModule
  ]
})

export class GiftCardsModule { }