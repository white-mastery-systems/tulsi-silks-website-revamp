import { NgModule } from '@angular/core';
import { TabsModule } from 'ngx-bootstrap/tabs';

import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { HomeComponent } from './home.component';
import { HomeSwiperDirective } from './directives/home-swiper.directive';
import { HomeHighlightsDirective } from './directives/home-highlights.directive';

import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@NgModule({
  declarations: [HomeComponent, HomeSwiperDirective, HomeHighlightsDirective],
  imports: [
    TabsModule.forRoot(),
    SharedModule,
    HomeRoutingModule,
    LucideAngularModule.pick({ ChevronLeft, ChevronRight })
  ]
})

export class HomeModule { }