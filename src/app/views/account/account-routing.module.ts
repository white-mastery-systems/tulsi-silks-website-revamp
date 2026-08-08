import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountComponent } from './account.component';

import { UserGuard } from '../../guards/user.guard';

const routes: Routes = [
  { path: '', component: AccountComponent },
  { path: 'facebook', component: AccountComponent },
  { path: 'google', component: AccountComponent },
  { path: 'my-orders', loadChildren: () => import('./my-orders/my-orders.module').then(m => m.MyOrdersModule) },
  { path: 'feedback', loadChildren: () => import('./feedback/feedback.module').then(m => m.FeedbackModule), canActivate: [UserGuard] },
  { path: 'models', loadChildren: () => import('./profile/user-models/user-models.module').then(m => m.UserModelsModule), canActivate: [UserGuard] },
  { path: 'profile', loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule), canActivate: [UserGuard] },
  { path: 'my-appointments', loadChildren: () => import('./appointment-list/appointment-list.module').then(m => m.AppointmentListModule), canActivate: [UserGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AccountRoutingModule { }