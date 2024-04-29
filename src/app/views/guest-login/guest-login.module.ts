import { NgModule } from '@angular/core';

import { GuestLoginRoutingModule } from './guest-login-routing.module';
import { GuestLoginComponent } from './guest-login.component';
import { SharedModule } from './../../shared/shared.module';


@NgModule({
  declarations: [GuestLoginComponent],
  imports: [
    GuestLoginRoutingModule,
    SharedModule
  ]
})

export class GuestLoginModule { }