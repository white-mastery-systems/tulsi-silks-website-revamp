import { NgModule } from '@angular/core';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { NgxSliderModule } from '@angular-slider/ngx-slider';

import { CategoryRoutingModule } from './category-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CategoryComponent } from './category.component';
import { CatalogSegmentsComponent } from './catalog-segments/catalog-segments.component';
import { RangeFilterPipe } from './pipes/range-filter.pipe';
import { ProductSortPipe } from './pipes/product-sort.pipe';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { CategoryHighlightsDirective } from './directives/category-highlights.directive';
import { SharedBlogUiModule } from '../features/blogs/shared/shared-blog-ui.module';
import { LucideAngularModule, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Diamond, Sun, CheckSquare, Gem, Church, Gift, ArrowRight, PartyPopper, Flower, Sparkles, Flower2, CircleCheck, Award, CalendarHeart, Check, ShoppingBag, Heart, Plus, Minus } from 'lucide-angular';

@NgModule({
  declarations: [CategoryComponent, CatalogSegmentsComponent, RangeFilterPipe, ProductSortPipe, CategoryHighlightsDirective],
  imports: [
    SharedModule,
    CategoryRoutingModule,
    NgxPaginationModule,
    NgxSliderModule,
    CollapseModule.forRoot(),
    AccordionModule.forRoot(),
    SharedBlogUiModule,
    LucideAngularModule.pick({ ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Diamond, Sun, CheckSquare, Gem, Church, Gift, ArrowRight, PartyPopper, Flower, Sparkles, Flower2, CircleCheck, Award, CalendarHeart, Check, ShoppingBag, Heart, Plus, Minus })
  ],
  providers: [DecimalPipe, CurrencyPipe]
})

export class CategoryModule { }