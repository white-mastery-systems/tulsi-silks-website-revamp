import { NgModule } from '@angular/core';

import { StoriesRoutingModule } from './stories-routing.module';
import { StoriesComponent } from './stories.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [
    StoriesComponent
  ],
  imports: [
    NgxPaginationModule,
    StoriesRoutingModule,
    SharedModule
  ]
})

export class StoriesModule { }