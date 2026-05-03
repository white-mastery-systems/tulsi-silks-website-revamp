import { NgModule } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';

import { ProductOrderDetailsRoutingModule } from './product-order-details-routing.module';
import { SharedModule } from '../../../shared/shared.module';

import { ProductOrderDetailsComponent } from './product-order-details.component';

@NgModule({
  declarations: [
    ProductOrderDetailsComponent
  ],
  imports: [
    SharedModule,
    QRCodeComponent,
    ProductOrderDetailsRoutingModule
  ]
})

export class ProductOrderDetailsModule { }