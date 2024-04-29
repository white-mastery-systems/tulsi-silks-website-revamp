import { NgModule } from '@angular/core';

import { ContactUsRoutingModule } from './contact-us-routing.module';
import { ContactUsComponent } from './contact-us.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [ContactUsComponent],
  imports: [
    ContactUsRoutingModule,
    SharedModule
  ]
})

export class ContactUsModule { }