import { NgModule } from '@angular/core';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { SharedModule } from '../../../../shared/shared.module';

import { ServiceDetailsRoutingModule } from './service-details-routing.module';
import { ServiceDetailsComponent } from './service-details.component';

@NgModule({
  declarations: [ServiceDetailsComponent],
  imports: [
    SharedModule,
    ServiceDetailsRoutingModule,
    BsDatepickerModule.forRoot()
  ]
})

export class ServiceDetailsModule { }