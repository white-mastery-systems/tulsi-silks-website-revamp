import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { PickupMethodsRoutingModule } from './pickup-methods-routing.module';
import { PickupMethodsComponent } from './pickup-methods.component';

@NgModule({
  declarations: [PickupMethodsComponent],
  imports: [
    SharedModule,
    PickupMethodsRoutingModule
  ]
})

export class PickupMethodsModule { }