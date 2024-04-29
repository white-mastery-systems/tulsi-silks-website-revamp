import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';

import { InvoiceRoutingModule } from './invoice-routing.module';
import { InvoiceComponent } from './invoice.component';

@NgModule({
  declarations: [InvoiceComponent],
  imports: [
    SharedModule,
    InvoiceRoutingModule
  ]
})

export class InvoiceModule { }