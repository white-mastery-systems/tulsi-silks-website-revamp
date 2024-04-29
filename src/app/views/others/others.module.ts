import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { OthersRoutingModule } from './others-routing.module';
import { OthersHeaderComponent } from '../../shared/components/headers/others-header/others-header.component';

@NgModule({
  declarations: [OthersHeaderComponent],
  imports: [
    SharedModule,
    OthersRoutingModule
  ]
})

export class OthersModule { }