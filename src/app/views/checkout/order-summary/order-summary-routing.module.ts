import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderSummaryComponent } from './order-summary.component';

const routes: Routes = [{ path: '', component: OrderSummaryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class OrderSummaryRoutingModule { }