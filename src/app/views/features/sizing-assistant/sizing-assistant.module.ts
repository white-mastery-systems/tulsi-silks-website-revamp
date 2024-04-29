import { NgModule } from '@angular/core';

import { SizingAssistantRoutingModule } from './sizing-assistant-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { SizingAssistantComponent } from './sizing-assistant.component';

@NgModule({
  declarations: [SizingAssistantComponent],
  imports: [
    SharedModule,
    SizingAssistantRoutingModule
  ]
})

export class SizingAssistantModule { }