import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GiftcardOrderDetailsComponent } from './giftcard-order-details.component';

const routes: Routes = [{ path: '', component: GiftcardOrderDetailsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class GiftcardOrderDetailsRoutingModule { }