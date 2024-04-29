import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VendorEnquiryComponent } from './vendor-enquiry.component';

const routes: Routes = [{ path: '', component: VendorEnquiryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class VendorEnquiryRoutingModule { }