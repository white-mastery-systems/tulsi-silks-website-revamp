import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShippingCalculatorComponent } from './shipping-calculator.component';

const routes: Routes = [{ path: "", component: ShippingCalculatorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ShippingCalculatorRoutingModule { }