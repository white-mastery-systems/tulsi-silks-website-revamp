import { NgModule } from '@angular/core';

import { AddressListRoutingModule } from './address-list-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { AddressListComponent } from './address-list.component';

@NgModule({
  declarations: [AddressListComponent],
  imports: [
    SharedModule,
    AddressListRoutingModule
  ]
})

export class AddressListModule { }