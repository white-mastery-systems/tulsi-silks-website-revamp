import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OthersHeaderComponent } from '../../shared/components/headers/others-header/others-header.component';

const routes: Routes = [
  { 
    path: '', component: OthersHeaderComponent, children: [
      { path: 'password-recovery/:token', loadChildren: () => import('./pwd-recovery/pwd-recovery.module').then(m => m.PwdRecoveryModule) },
      { path: 'service-unavailable', loadChildren: () => import('./service-unavailable/service-unavailable.module').then(m => m.ServiceUnavailableModule) },
      { path: 'invalid-domain', loadChildren: () => import('./service-unavailable/service-unavailable.module').then(m => m.ServiceUnavailableModule) },
      { path: 'invalid-site', loadChildren: () => import('./service-unavailable/service-unavailable.module').then(m => m.ServiceUnavailableModule) }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class OthersRoutingModule { }