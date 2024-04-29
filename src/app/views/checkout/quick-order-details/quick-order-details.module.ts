import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { QuickOrderDetailsRoutingModule } from './quick-order-details-routing.module';
import { QuickOrderDetailsComponent } from './quick-order-details.component';

@NgModule({
  declarations: [QuickOrderDetailsComponent],
  imports: [
    SharedModule,
    QuickOrderDetailsRoutingModule
  ]
})

export class QuickOrderDetailsModule { }