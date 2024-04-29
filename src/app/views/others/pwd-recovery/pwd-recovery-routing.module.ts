import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PwdRecoveryComponent } from './pwd-recovery.component';

const routes: Routes = [{ path: '', component: PwdRecoveryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class PwdRecoveryRoutingModule { }