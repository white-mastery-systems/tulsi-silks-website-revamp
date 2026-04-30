import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../../../shared/shared.module';

import { BlogsRoutingModule } from './blogs-routing.module';
import { BlogsComponent } from './blogs.component';
import { BlogListComponent } from './components/blog-list/blog-list.component';
import { SharedBlogUiModule } from './shared/shared-blog-ui.module';

@NgModule({
  declarations: [BlogsComponent, BlogListComponent],
  imports: [
    NgxPaginationModule,
    BlogsRoutingModule,
    SharedBlogUiModule,
    SharedModule
  ]
})

export class BlogsModule { }