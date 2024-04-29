import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { ExtraPageRoutingModule } from './extra-page-routing.module';
import { ExtraPageComponent } from './extra-page.component';

@NgModule({
  declarations: [ExtraPageComponent],
  imports: [
    SharedModule,
    ExtraPageRoutingModule
  ]
})

export class ExtraPageModule { }