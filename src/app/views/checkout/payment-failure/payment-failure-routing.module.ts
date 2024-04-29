import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PaymentFailureComponent } from './payment-failure.component';

const routes: Routes = [{ path: '', component: PaymentFailureComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class PaymentFailureRoutingModule { }