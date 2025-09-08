import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { NgxSliderModule } from '@angular-slider/ngx-slider';

import { CategoryRoutingModule } from './category-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CategoryComponent } from './category.component';
import { RangeFilterPipe } from './pipes/range-filter.pipe';
import { ProductSortPipe } from './pipes/product-sort.pipe';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { CategoryHighlightsDirective } from './directives/category-highlights.directive';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@NgModule({
  declarations: [CategoryComponent, RangeFilterPipe, ProductSortPipe, CategoryHighlightsDirective],
  imports: [
    SharedModule,
    CategoryRoutingModule,
    NgxPaginationModule,
    NgxSliderModule,
    CollapseModule.forRoot(),
    AccordionModule.forRoot(),
    LucideAngularModule.pick({ ChevronLeft, ChevronRight })
  ]
})

export class CategoryModule { }