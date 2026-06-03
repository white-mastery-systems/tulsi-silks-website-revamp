import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SectionsComponent } from './sections.component';

const routes: Routes = [
  { path: '', redirectTo: '/404', pathMatch: 'full' },
  { path: 'by-category', redirectTo: 'regional-collections', pathMatch: 'full' },
  { path: 'by-colours', redirectTo: 'sarees-by-colour', pathMatch: 'full' },
  { path: ':page_url', component: SectionsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SectionsRoutingModule { }