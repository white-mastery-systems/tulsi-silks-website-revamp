import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServicePlacedComponent } from './service-placed.component';

const routes: Routes = [{ path: "", component: ServicePlacedComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ServicePlacedRoutingModule { }