import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentCategoriesComponent } from './appointment-categories.component';

const routes: Routes = [{ path: "", component: AppointmentCategoriesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AppointmentCategoriesRoutingModule { }