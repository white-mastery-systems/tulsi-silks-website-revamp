import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { AppointmentServicesRoutingModule } from './appointment-services-routing.module';
import { AppointmentServicesComponent } from './appointment-services.component';

@NgModule({
  declarations: [AppointmentServicesComponent],
  imports: [
    SharedModule,
    AppointmentServicesRoutingModule
  ]
})

export class AppointmentServicesModule { }