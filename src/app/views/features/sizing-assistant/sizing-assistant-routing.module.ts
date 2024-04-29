import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SizingAssistantComponent } from './sizing-assistant.component';

const routes: Routes = [{ path: '', component: SizingAssistantComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SizingAssistantRoutingModule { }