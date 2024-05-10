import { NgModule } from '@angular/core';

import { StoryDetailsRoutingModule } from './story-details-routing.module';
import { StoryDetailsComponent } from './story-details.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    StoryDetailsComponent
  ],
  imports: [
    SharedModule,
    StoryDetailsRoutingModule
  ]
})

export class StoryDetailsModule { }