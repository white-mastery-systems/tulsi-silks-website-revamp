import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../../../../shared/shared.module';

import { UserAddressRoutingModule } from './user-address-routing.module';
import { UserAddressComponent } from './user-address.component';

@NgModule({
  declarations: [UserAddressComponent],
  imports: [
    SharedModule,
    NgxPaginationModule,
    UserAddressRoutingModule
  ]
})

export class UserAddressModule { }