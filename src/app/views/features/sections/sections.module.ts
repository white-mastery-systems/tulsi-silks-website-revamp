import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { SectionsRoutingModule } from './sections-routing.module';
import { SectionsComponent } from './sections.component';

@NgModule({
  declarations: [
    SectionsComponent
  ],
  imports: [
    SharedModule,
    SectionsRoutingModule
  ]
})

export class SectionsModule { }