import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShippingMethodsComponent } from './shipping-methods.component';

const routes: Routes = [{ path: '', component: ShippingMethodsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ShippingMethodsRoutingModule { }