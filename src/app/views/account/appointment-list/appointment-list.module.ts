import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../../../shared/shared.module';

import { AppointmentListRoutingModule } from './appointment-list-routing.module';
import { AppointmentListComponent } from './appointment-list.component';

@NgModule({
  declarations: [AppointmentListComponent],
  imports: [
    SharedModule,
    NgxPaginationModule,
    AppointmentListRoutingModule
  ]
})

export class AppointmentListModule { }