import { NgModule } from '@angular/core';

import { VendorEnquiryRoutingModule } from './vendor-enquiry-routing.module';
import { VendorEnquiryComponent } from './vendor-enquiry.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [VendorEnquiryComponent],
  imports: [
    SharedModule,
    VendorEnquiryRoutingModule
  ]
})

export class VendorEnquiryModule { }