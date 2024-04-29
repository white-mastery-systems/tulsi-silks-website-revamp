import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserModelsComponent } from './user-models.component';

const routes: Routes = [{ path: "", component: UserModelsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class UserModelsRoutingModule { }