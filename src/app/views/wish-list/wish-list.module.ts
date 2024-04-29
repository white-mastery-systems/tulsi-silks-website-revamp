import { NgModule } from '@angular/core';

import { WishListRoutingModule } from './wish-list-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { WishListComponent } from './wish-list.component';

@NgModule({
  declarations: [WishListComponent],
  imports: [
    SharedModule,
    WishListRoutingModule
  ]
})

export class WishListModule { }