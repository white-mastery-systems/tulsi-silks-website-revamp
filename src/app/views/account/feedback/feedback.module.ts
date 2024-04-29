import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { FeedbackRoutingModule } from './feedback-routing.module';
import { FeedbackComponent } from './feedback.component';

@NgModule({
  declarations: [FeedbackComponent],
  imports: [
    FeedbackRoutingModule,
    SharedModule
  ]
})

export class FeedbackModule { }