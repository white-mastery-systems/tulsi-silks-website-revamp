import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { LucideAngularModule, Search, ChevronDown, CloudUpload, Heart, ImagePlus, ShoppingBag, ArrowRight, Sparkles, SlidersHorizontal, Camera, X, Check, Info } from 'lucide-angular';

import { SearchRoutingModule } from './search-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { SearchComponent } from './search.component';

@NgModule({
  declarations: [SearchComponent],
  imports: [
    SharedModule,
    SearchRoutingModule,
    NgxPaginationModule,
    LucideAngularModule.pick({ Search, ChevronDown, CloudUpload, Heart, ImagePlus, ShoppingBag, ArrowRight, Sparkles, SlidersHorizontal, Camera, X, Check, Info })
  ]
})

export class SearchModule { }