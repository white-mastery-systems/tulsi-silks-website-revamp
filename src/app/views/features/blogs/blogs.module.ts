import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../../../shared/shared.module';

import { BlogsRoutingModule } from './blogs-routing.module';
import { BlogsComponent } from './blogs.component';

@NgModule({
  declarations: [BlogsComponent],
  imports: [
    NgxPaginationModule,
    BlogsRoutingModule,
    SharedModule
  ]
})

export class BlogsModule { }