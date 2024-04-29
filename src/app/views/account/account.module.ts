import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';

@NgModule({
  declarations: [AccountComponent],
  imports: [
    AccountRoutingModule,
    SharedModule
  ]
})

export class AccountModule { }