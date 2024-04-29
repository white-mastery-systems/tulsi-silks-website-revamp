import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PickupMethodsComponent } from './pickup-methods.component';

const routes: Routes = [{ path: "", component: PickupMethodsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class PickupMethodsRoutingModule { }