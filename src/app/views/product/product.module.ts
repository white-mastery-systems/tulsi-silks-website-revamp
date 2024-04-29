import { NgModule } from '@angular/core';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { NgxPaginationModule } from 'ngx-pagination';

import { ProductRoutingModule } from './product-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CustomizationModule } from '../../shared/modules/customization/customization.module';
import { ProductComponent } from './product.component';
import { RelatedProductsDirective } from './directives/related-products.directive';

@NgModule({
  declarations: [ProductComponent, RelatedProductsDirective],
  imports: [
    SharedModule,
    CustomizationModule,
    ProductRoutingModule,
    YouTubePlayerModule,
    NgxPaginationModule,
    AccordionModule.forRoot()
  ]
})

export class ProductModule { }