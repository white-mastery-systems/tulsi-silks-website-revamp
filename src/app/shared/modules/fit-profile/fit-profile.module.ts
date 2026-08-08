import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FitCreateProfileComponent } from './fit-create-profile.component';

@NgModule({
  declarations: [FitCreateProfileComponent],
  imports: [SharedModule],
  exports: [FitCreateProfileComponent]
})
export class FitProfileModule { }
