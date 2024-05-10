import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoryDetailsComponent } from './story-details.component';

const routes: Routes = [{path:'', component: StoryDetailsComponent}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class StoryDetailsRoutingModule { }