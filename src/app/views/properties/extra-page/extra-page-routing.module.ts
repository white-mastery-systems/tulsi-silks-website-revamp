import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExtraPageComponent } from './extra-page.component';

const routes: Routes = [{ path: "", component: ExtraPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ExtraPageRoutingModule { }