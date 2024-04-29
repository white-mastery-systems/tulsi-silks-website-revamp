import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VendorLoginComponent } from './vendor-login.component';

const routes: Routes = [{ path: "", component: VendorLoginComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class VendorLoginRoutingModule { }