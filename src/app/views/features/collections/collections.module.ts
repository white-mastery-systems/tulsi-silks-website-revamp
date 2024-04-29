import { NgModule } from '@angular/core';
import { NestedSearchPipe } from './pipes/nested-search.pipe';
import { SharedModule } from '../../../shared/shared.module';

import { CollectionsRoutingModule } from './collections-routing.module';
import { CollectionsComponent } from './collections.component';

@NgModule({
  declarations: [NestedSearchPipe, CollectionsComponent],
  imports: [
    SharedModule,
    CollectionsRoutingModule
  ]
})

export class CollectionsModule { }