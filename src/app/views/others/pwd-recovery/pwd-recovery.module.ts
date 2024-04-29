import { NgModule } from '@angular/core';

import { PwdRecoveryRoutingModule } from './pwd-recovery-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { PwdRecoveryComponent } from './pwd-recovery.component';

@NgModule({
  declarations: [PwdRecoveryComponent],
  imports: [
    SharedModule,
    PwdRecoveryRoutingModule
  ]
})

export class PwdRecoveryModule { }