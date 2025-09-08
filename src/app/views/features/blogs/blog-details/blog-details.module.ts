import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { BlogDetailsRoutingModule } from './blog-details-routing.module';
import { BlogDetailsComponent } from './blog-details.component';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { BlogSwiperDirective } from './directives/blog-swiper.directive';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@NgModule({
  declarations: [BlogDetailsComponent, BlogSwiperDirective],
  imports: [
    SharedModule,
    BlogDetailsRoutingModule,
    AccordionModule.forRoot(),
    LucideAngularModule.pick({ ChevronLeft, ChevronRight })
  ]
})

export class BlogDetailsModule { }
