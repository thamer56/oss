import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from '../login/login.component';
import { PortalComponent } from '../dashboards/portal.component';
import { SuperAdminDashboardComponent } from '../dashboards/super-admin-dashboard.component';
import { DirectorDashboardComponent } from '../dashboards/director-dashboard.component';
import { DivisionChiefDashboardComponent } from '../dashboards/division-chief-dashboard.component';
import { ProjectManagerDashboardComponent } from '../dashboards/project-manager-dashboard.component';
import { UserSignupComponent } from '../dashboards/user-signup.component';
import { ProjectDetailComponent } from '../dashboards/project-detail.component';
import { ProjectCreateComponent } from '../dashboards/project-create.component';
import { EquipeComponent } from '../dashboards/equipe.component';
import { BudgetComponent } from '../dashboards/budget.component';
import { TvDisplayComponent } from '../dashboards/tv-display.component';
import { PmTasksComponent } from './dashboards/pm-tasks/pm-tasks.component';
import { PmCalendarComponent } from './dashboards/pm-calendar/pm-calendar.component';

const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Auth
  { path: 'login', component: LoginComponent },

  // Portal (role selector)
  { path: 'portal', component: PortalComponent },

  // Dashboards
  { path: 'super-admin', component: SuperAdminDashboardComponent },
  { path: 'director', component: DirectorDashboardComponent },
  { path: 'division-chief', component: DivisionChiefDashboardComponent },
  { path: 'project-manager', component: ProjectManagerDashboardComponent },
  { path: 'admin/signup', component: UserSignupComponent },
  { path: 'project/new', component: ProjectCreateComponent },
  { path: 'project/:id', component: ProjectDetailComponent },
  { path: 'equipe', component: EquipeComponent },
  { path: 'budget', component: BudgetComponent },
  { path: 'pm-tasks', component: PmTasksComponent },
  { path: 'pm-calendar', component: PmCalendarComponent },
  { path: 'tv-display', component: TvDisplayComponent },

  // Fallback
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }