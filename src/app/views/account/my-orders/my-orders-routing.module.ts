import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyOrdersComponent } from './my-orders.component';

import { UserGuard } from '../../../guards/user.guard';

const routes: Routes = [
  { path: '', component: MyOrdersComponent },
  { path: 'order-list', loadChildren: () => import('./order-list/order-list.module').then(m => m.OrderListModule), canActivate: [UserGuard] },
  { path: 'coupon-list', loadChildren: () => import('./coupon-list/coupon-list.module').then(m => m.CouponListModule), canActivate: [UserGuard] },
  { path: 'invoice/:type/:order_id', loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoiceModule) },
  { path: 'invoice/:type/:order_id/:vendor_id', loadChildren: () => import('./vendor-invoice/vendor-invoice.module').then(m => m.VendorInvoiceModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class MyOrdersRoutingModule { }