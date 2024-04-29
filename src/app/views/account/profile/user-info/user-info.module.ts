import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { UserInfoRoutingModule } from './user-info-routing.module';
import { UserInfoComponent } from './user-info.component';

@NgModule({
  declarations: [UserInfoComponent],
  imports: [
    SharedModule,
    UserInfoRoutingModule
  ]
})

export class UserInfoModule { }