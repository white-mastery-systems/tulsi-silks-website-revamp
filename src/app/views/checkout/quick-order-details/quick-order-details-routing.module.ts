import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuickOrderDetailsComponent } from './quick-order-details.component';

const routes: Routes = [{ path: "", component: QuickOrderDetailsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class QuickOrderDetailsRoutingModule { }