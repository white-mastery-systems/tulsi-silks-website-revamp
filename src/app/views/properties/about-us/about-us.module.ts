import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AboutUsRoutingModule } from './about-us-routing.module';
import { AboutUsComponent } from './about-us.component';
import { SharedModule } from '../../../shared/shared.module';
import { SliderDirective } from './directives/slider.directive';
import { SegmentIntersectionDirective } from './directives/segment-intersection.directive';
import { HeritageSwiperDirective } from './directives/heritage-swiper.directive';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@NgModule({
  declarations: [
    AboutUsComponent, SliderDirective, SegmentIntersectionDirective, HeritageSwiperDirective
  ],
  imports: [
    CommonModule,
    AboutUsRoutingModule,
    SharedModule,
    LucideAngularModule.pick({ ChevronLeft, ChevronRight })
  ]
})

export class AboutUsModule { }