import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { VendorInvoiceRoutingModule } from './vendor-invoice-routing.module';
import { VendorInvoiceComponent } from './vendor-invoice.component';

@NgModule({
  declarations: [VendorInvoiceComponent],
  imports: [
    SharedModule,
    VendorInvoiceRoutingModule
  ]
})

export class VendorInvoiceModule { }