import { NgModule } from '@angular/core';
import { TabsModule } from 'ngx-bootstrap/tabs';

import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { HomeComponent } from './home.component';
import { HomeSwiperDirective } from './directives/home-swiper.directive';
import { HomeHighlightsDirective } from './directives/home-highlights.directive';
import { SharedBlogUiModule } from '../features/blogs/shared/shared-blog-ui.module';

import { LucideAngularModule, ArrowUp, ChevronLeft, ChevronRight, CloudUpload, Search, Sparkles } from 'lucide-angular';

@NgModule({
  declarations: [HomeComponent, HomeSwiperDirective, HomeHighlightsDirective],
  imports: [
    TabsModule.forRoot(),
    SharedModule,
    SharedBlogUiModule,
    HomeRoutingModule,
    LucideAngularModule.pick({ ArrowUp, ChevronLeft, ChevronRight, CloudUpload, Search, Sparkles })
  ]
})

export class HomeModule { }