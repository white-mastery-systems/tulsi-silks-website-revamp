import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalModule } from 'ngx-bootstrap/modal';

import { OrderSearchPipe } from './pipes/order-search.pipe';
import { OrderDescPipe } from './pipes/order-desc.pipe';
import { OrderAscPipe } from './pipes/order-asc.pipe';

import { NumberOnlyDirective } from './directives/number-only.directive';
import { UppercaseDirective } from './directives/uppercase.directive';
import { LowercaseDirective } from './directives/lowercase.directive';
import { MouseHoverDirective } from './directives/mouse-hover.directive';

import { ImgLazyLoadDirective } from './directives/img-lazy-load.directive';
import { LqimgLoadDirective } from './directives/lqimg-load.directive';
import { DeferLoadDirective } from './directives/defer-load.directive';
import { ImgIntersectionDirective } from './directives/img-intersection.directive';
import { ImgBrokenDirective } from './directives/img-broken.directive';
import { SmallImgDirective } from './directives/small-img.directive';

import { FooterComponent } from './components/footer/footer.component';
import { MainHeaderComponent } from './components/headers/main-header/main-header.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';

@NgModule({
  declarations: [
    OrderSearchPipe,
    OrderDescPipe,
    OrderAscPipe,

    NumberOnlyDirective,
    UppercaseDirective,
    LowercaseDirective,
    MouseHoverDirective,

    ImgLazyLoadDirective,
    LqimgLoadDirective,
    DeferLoadDirective,
    ImgIntersectionDirective,
    ImgBrokenDirective,
    SmallImgDirective,

    FooterComponent,
    MainHeaderComponent,
    LoadingSpinnerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ModalModule.forRoot(),
    LucideAngularModule.pick({ ChevronDown, ChevronUp })
  ],
  exports: [
    OrderSearchPipe,
    OrderDescPipe,
    OrderAscPipe,

    NumberOnlyDirective,
    UppercaseDirective,
    LowercaseDirective,
    MouseHoverDirective,

    ImgLazyLoadDirective,
    LqimgLoadDirective,
    DeferLoadDirective,
    ImgIntersectionDirective,
    ImgBrokenDirective,
    SmallImgDirective,
    
    FooterComponent,
    MainHeaderComponent,
    LoadingSpinnerComponent,

    CommonModule,
    FormsModule,
    RouterModule,
    ModalModule
  ]
})

export class SharedModule { }