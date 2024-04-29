import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

import { ServiceUnavailableRoutingModule } from './service-unavailable-routing.module';
import { ServiceUnavailableComponent } from './service-unavailable.component';

@NgModule({
  declarations: [ServiceUnavailableComponent],
  imports: [
    SharedModule,
    ServiceUnavailableRoutingModule
  ]
})

export class ServiceUnavailableModule { }