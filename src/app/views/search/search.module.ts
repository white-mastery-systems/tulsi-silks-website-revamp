import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { LucideAngularModule, Search, ImagePlus } from 'lucide-angular';

import { SearchRoutingModule } from './search-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { SearchComponent } from './search.component';

@NgModule({
  declarations: [SearchComponent],
  imports: [
    SharedModule,
    SearchRoutingModule,
    NgxPaginationModule,
    LucideAngularModule.pick({ Search, ImagePlus })
  ]
})

export class SearchModule { }