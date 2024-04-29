import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GiftCardsComponent } from './gift-cards.component';
import { UserGuard } from '../../../guards/user.guard';

const routes: Routes = [
  { path: '', component: GiftCardsComponent },
  { path: ':id', loadChildren: () => import('./giftcard-details/giftcard-details.module').then(m => m.GiftcardDetailsModule), canActivate: [UserGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class GiftCardsRoutingModule { }