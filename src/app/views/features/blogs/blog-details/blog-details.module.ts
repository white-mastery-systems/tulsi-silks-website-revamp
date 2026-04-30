import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { BlogDetailsRoutingModule } from './blog-details-routing.module';
import { BlogDetailsComponent } from './blog-details.component';
import { BlogRendererComponent } from './blog-renderer/blog-renderer.component';
import { BlogProductCarouselComponent } from './blog-product-carousel/blog-product-carousel.component';
import { SharedBlogUiModule } from '../shared/shared-blog-ui.module';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { BlogSwiperDirective } from './directives/blog-swiper.directive';
import { LucideAngularModule, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-angular';

@NgModule({
  declarations: [BlogDetailsComponent, BlogRendererComponent, BlogProductCarouselComponent, BlogSwiperDirective],
  imports: [
    SharedBlogUiModule,
    SharedModule,
    BlogDetailsRoutingModule,
    AccordionModule.forRoot(),
    LucideAngularModule.pick({ ChevronLeft, ChevronRight, ArrowUp })
  ]
})

export class BlogDetailsModule { }
