import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GuestLoginComponent } from './guest-login.component';

const routes: Routes = [{ path: '', component: GuestLoginComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class GuestLoginRoutingModule { }