import { NgModule } from '@angular/core';

import { StoriesRoutingModule } from './stories-routing.module';
import { StoriesComponent } from './stories.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    StoriesComponent
  ],
  imports: [
    StoriesRoutingModule,
    SharedModule
  ]
})

export class StoriesModule { }