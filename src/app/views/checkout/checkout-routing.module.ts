import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserGuard } from '../../guards/user.guard';
import { CheckoutGuard } from '../../guards/checkout.guard';

import { CheckoutHeaderComponent } from '../../shared/components/headers/checkout-header/checkout-header.component';

const routes: Routes = [
  {
    path: '', component: CheckoutHeaderComponent, children: [
      { path: 'address-list/:type', loadChildren: () => import('./address-list/address-list.module').then(m => m.AddressListModule), canActivate: [CheckoutGuard] },
      { path: 'shipping-methods', loadChildren: () => import('./shipping-methods/shipping-methods.module').then(m => m.ShippingMethodsModule), canActivate: [CheckoutGuard] },
      { path: 'delivery-methods', loadChildren: () => import('./delivery-methods/delivery-methods.module').then(m => m.DeliveryMethodsModule), canActivate: [CheckoutGuard] },
      { path: 'pickup-methods', loadChildren: () => import('./pickup-methods/pickup-methods.module').then(m => m.PickupMethodsModule), canActivate: [CheckoutGuard] },
      { path: 'product-order-details', loadChildren: () => import('./product-order-details/product-order-details.module').then(m => m.ProductOrderDetailsModule), canActivate: [CheckoutGuard] },
      { path: 'giftcard-order-details', loadChildren: () => import('./giftcard-order-details/giftcard-order-details.module').then(m => m.GiftcardOrderDetailsModule), canActivate: [UserGuard] },
      { path: 'quick-order/:id', loadChildren: () => import('./quick-order-details/quick-order-details.module').then(m => m.QuickOrderDetailsModule) },
      { path: 'order-summary', loadChildren: () => import('./order-summary/order-summary.module').then(m => m.OrderSummaryModule) },
      { path: 'order-summary/:type/:order_id', loadChildren: () => import('./order-summary/order-summary.module').then(m => m.OrderSummaryModule) },
      { path: 'payment-failure', loadChildren: () => import('./payment-failure/payment-failure.module').then(m => m.PaymentFailureModule) },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class CheckoutRoutingModule { }