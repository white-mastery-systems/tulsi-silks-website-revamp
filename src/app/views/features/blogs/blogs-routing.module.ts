import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BlogsComponent } from './blogs.component';

const routes: Routes = [
  { path: '', component: BlogsComponent },
  { path: ':blog_id', loadChildren: () => import('./blog-details/blog-details.module').then(m => m.BlogDetailsModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class BlogsRoutingModule { }