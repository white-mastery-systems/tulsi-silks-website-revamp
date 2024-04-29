import { NgModule } from '@angular/core';
import { QRCodeModule } from 'angularx-qrcode';

import { ProductOrderDetailsRoutingModule } from './product-order-details-routing.module';
import { SharedModule } from '../../../shared/shared.module';

import { ProductOrderDetailsComponent } from './product-order-details.component';

@NgModule({
  declarations: [
    ProductOrderDetailsComponent
  ],
  imports: [
    SharedModule,
    QRCodeModule,
    ProductOrderDetailsRoutingModule
  ]
})

export class ProductOrderDetailsModule { }