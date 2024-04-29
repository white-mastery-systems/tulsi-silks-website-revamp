import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileComponent } from './profile.component';

const routes: Routes = [
  { path: '', component: ProfileComponent },
  { path: 'info', loadChildren: () => import('./user-info/user-info.module').then(m => m.UserInfoModule) },
  { path: 'address', loadChildren: () => import('./user-address/user-address.module').then(m => m.UserAddressModule) },
  { path: 'models', loadChildren: () => import('./user-models/user-models.module').then(m => m.UserModelsModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ProfileRoutingModule { }