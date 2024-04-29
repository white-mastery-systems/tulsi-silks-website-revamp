import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserAddressComponent } from './user-address.component';

const routes: Routes = [{ path: "", component: UserAddressComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class UserAddressRoutingModule { }