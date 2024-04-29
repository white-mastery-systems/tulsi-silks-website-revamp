import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeliveryMethodsComponent } from './delivery-methods.component';

const routes: Routes = [{ path: '', component: DeliveryMethodsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class DeliveryMethodsRoutingModule { }