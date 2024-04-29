import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { StoreLocatorRoutingModule } from './store-locator-routing.module';
import { StoreLocatorComponent } from './store-locator.component';

@NgModule({
  declarations: [StoreLocatorComponent],
  imports: [
    StoreLocatorRoutingModule,
    SharedModule
  ]
})

export class StoreLocatorModule { }