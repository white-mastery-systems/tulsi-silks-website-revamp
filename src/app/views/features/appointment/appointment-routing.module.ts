import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountGuard } from '../../../guards/account.guard';

const routes: Routes = [
  { path: "", loadChildren: () => import('./appointment-categories/appointment-categories.module').then(m => m.AppointmentCategoriesModule) },
  { path: ":category", loadChildren: () => import('./appointment-services/appointment-services.module').then(m => m.AppointmentServicesModule) },
  { path: ":category/:id", loadChildren: () => import('./service-details/service-details.module').then(m => m.ServiceDetailsModule), canActivate: [AccountGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AppointmentRoutingModule { }