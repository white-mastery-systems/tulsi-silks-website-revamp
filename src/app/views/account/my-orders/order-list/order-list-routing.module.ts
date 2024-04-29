import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderListComponent } from './order-list.component';

const routes: Routes = [
  { path: ':type', component: OrderListComponent },
  { path: ':type/:order_id', loadChildren: () => import('./order-details/order-details.module').then(m => m.OrderDetailsModule) },
  { path: ':type/:order_id/:vendor_id', loadChildren: () => import('./order-details/order-details.module').then(m => m.OrderDetailsModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class OrderListRoutingModule { }