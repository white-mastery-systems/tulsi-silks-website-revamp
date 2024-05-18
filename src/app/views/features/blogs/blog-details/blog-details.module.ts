import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { BlogDetailsRoutingModule } from './blog-details-routing.module';
import { BlogDetailsComponent } from './blog-details.component';
import { AccordionModule } from 'ngx-bootstrap/accordion';


@NgModule({
  declarations: [BlogDetailsComponent],
  imports: [
    SharedModule,
    BlogDetailsRoutingModule,
    AccordionModule.forRoot()
  ]
})
export class BlogDetailsModule { }
