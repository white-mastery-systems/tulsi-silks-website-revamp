import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from 'ngx-bootstrap/modal';
import { CustomizationComponent } from './customization.component';

@NgModule({
  declarations: [CustomizationComponent],
  imports: [
    CommonModule,
    ModalModule.forRoot()
  ],
  exports: [CustomizationComponent]
})

export class CustomizationModule { }