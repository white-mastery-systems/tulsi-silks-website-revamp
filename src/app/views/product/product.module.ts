import { NgModule } from '@angular/core';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { NgxPaginationModule } from 'ngx-pagination';

import { ProductRoutingModule } from './product-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CustomizationModule } from '../../shared/modules/customization/customization.module';
import { ProductComponent } from './product.component';
import { RelatedProductsDirective } from './directives/related-products.directive';
import { LucideAngularModule, ChevronLeft, ChevronRight, XCircle, Heart, Share2 } from 'lucide-angular';
import { ButtonFlipDirective } from './directives/button-flip.directive';

@NgModule({
  declarations: [ProductComponent, RelatedProductsDirective, ButtonFlipDirective],
  imports: [
    SharedModule,
    CustomizationModule,
    ProductRoutingModule,
    YouTubePlayerModule,
    NgxPaginationModule,
    AccordionModule.forRoot(),
    LucideAngularModule.pick({ ChevronLeft, ChevronRight, XCircle, Heart, Share2 })
  ]
})

export class ProductModule { }