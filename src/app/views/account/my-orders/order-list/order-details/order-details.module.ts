import { NgModule } from '@angular/core';
import { CustomizationModule } from '../../../../../shared/modules/customization/customization.module';
import { SharedModule } from '../../../../../shared/shared.module';

import { OrderDetailsRoutingModule } from './order-details-routing.module';
import { OrderDetailsComponent } from './order-details.component';

@NgModule({
  declarations: [OrderDetailsComponent],
  imports: [
    SharedModule,
    CustomizationModule,
    OrderDetailsRoutingModule
  ]
})

export class OrderDetailsModule { }