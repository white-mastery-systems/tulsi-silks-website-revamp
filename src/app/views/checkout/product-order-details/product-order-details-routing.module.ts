import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProductOrderDetailsComponent } from './product-order-details.component';

const routes: Routes = [{ path: '', component: ProductOrderDetailsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ProductOrderDetailsRoutingModule { }