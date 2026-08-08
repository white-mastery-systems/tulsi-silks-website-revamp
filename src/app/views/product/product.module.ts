import { NgModule } from '@angular/core';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { NgxPaginationModule } from 'ngx-pagination';

import { ProductRoutingModule } from './product-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CustomizationModule } from '../../shared/modules/customization/customization.module';
import { FitProfileModule } from '../../shared/modules/fit-profile/fit-profile.module';
import { ProductComponent } from './product.component';
import { RelatedProductsDirective } from './directives/related-products.directive';
import { LucideAngularModule, ChevronLeft, ChevronRight, ChevronDown, Heart, Share2 } from 'lucide-angular';
import { ButtonFlipDirective } from './directives/button-flip.directive';
import { StickyFooterDirective } from './directives/sticky-footer.directive';
import { SharedBlogUiModule } from '../features/blogs/shared/shared-blog-ui.module';

@NgModule({
  declarations: [ProductComponent, RelatedProductsDirective, ButtonFlipDirective, StickyFooterDirective],
  imports: [
    SharedModule,
    CustomizationModule,
    FitProfileModule,
    SharedBlogUiModule,
    ProductRoutingModule,
    YouTubePlayerModule,
    NgxPaginationModule,
    AccordionModule.forRoot(),
    LucideAngularModule.pick({ ChevronLeft, ChevronRight, ChevronDown, Heart, Share2 })
  ]
})

export class ProductModule { }