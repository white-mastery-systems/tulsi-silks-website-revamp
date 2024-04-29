import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { BlogDetailsRoutingModule } from './blog-details-routing.module';
import { BlogDetailsComponent } from './blog-details.component';


@NgModule({
  declarations: [BlogDetailsComponent],
  imports: [
    SharedModule,
    BlogDetailsRoutingModule
  ]
})
export class BlogDetailsModule { }
