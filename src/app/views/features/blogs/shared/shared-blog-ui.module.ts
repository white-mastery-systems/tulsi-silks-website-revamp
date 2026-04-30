import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BlogCardComponent } from '../components/blog-card/blog-card.component';

/** Shared UI so lazy-loaded blog detail can reuse cards without importing BlogsModule. */
@NgModule({
  declarations: [BlogCardComponent],
  imports: [CommonModule, RouterModule],
  exports: [BlogCardComponent],
})
export class SharedBlogUiModule {}
