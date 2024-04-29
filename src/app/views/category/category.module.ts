import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { CollapseModule } from 'ngx-bootstrap/collapse';

import { CategoryRoutingModule } from './category-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CategoryComponent } from './category.component';
import { RangeFilterPipe } from './pipes/range-filter.pipe';
import { ProductSortPipe } from './pipes/product-sort.pipe';

@NgModule({
  declarations: [CategoryComponent, RangeFilterPipe, ProductSortPipe],
  imports: [
    SharedModule,
    CategoryRoutingModule,
    NgxPaginationModule,
    CollapseModule.forRoot()
  ]
})

export class CategoryModule { }