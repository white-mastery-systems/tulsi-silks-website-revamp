import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { ServicePlacedRoutingModule } from './service-placed-routing.module';
import { ServicePlacedComponent } from './service-placed.component';

@NgModule({
  declarations: [ServicePlacedComponent],
  imports: [
    SharedModule,
    ServicePlacedRoutingModule
  ]
})

export class ServicePlacedModule { }