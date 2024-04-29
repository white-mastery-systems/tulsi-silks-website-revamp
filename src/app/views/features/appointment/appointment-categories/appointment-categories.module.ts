import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { AppointmentCategoriesRoutingModule } from './appointment-categories-routing.module';
import { AppointmentCategoriesComponent } from './appointment-categories.component';

@NgModule({
  declarations: [AppointmentCategoriesComponent],
  imports: [
    SharedModule,
    AppointmentCategoriesRoutingModule
  ]
})

export class AppointmentCategoriesModule { }