import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from '../login/login.component';

// Dashboard Components
import { PortalComponent } from '../dashboards/portal.component';
import { SuperAdminDashboardComponent } from '../dashboards/super-admin-dashboard.component';
import { DirectorDashboardComponent } from '../dashboards/director-dashboard.component';
import { DivisionChiefDashboardComponent } from '../dashboards/division-chief-dashboard.component';
import { ProjectManagerDashboardComponent } from '../dashboards/project-manager-dashboard.component';

// Common Interactive Components
import { FileUploadComponent } from '../dashboards/file-upload.component';
import { ProjectFormComponent } from '../dashboards/project-form.component';
import { UserSignupComponent } from '../dashboards/user-signup.component';
import { ProjectDetailComponent } from '../dashboards/project-detail.component';
import { ProjectCreateComponent } from '../dashboards/project-create.component';
import { EquipeComponent } from '../dashboards/equipe.component';
import { ChatbotComponent } from '../dashboards/chatbot.component';
import { StatsDashboardComponent } from '../dashboards/stats-dashboard.component';
import { BudgetComponent } from '../dashboards/budget.component';
import { SafeUrlPipe } from './safe-url.pipe';
import { PmTasksComponent } from './dashboards/pm-tasks/pm-tasks.component';
import { PmCalendarComponent } from './dashboards/pm-calendar/pm-calendar.component';
import { TvDashboardComponent } from '../dashboards/tv-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PortalComponent,
    SuperAdminDashboardComponent,
    DirectorDashboardComponent,
    DivisionChiefDashboardComponent,
    ProjectManagerDashboardComponent,
    FileUploadComponent,
    ProjectFormComponent,
    UserSignupComponent,
    ProjectDetailComponent,
    ProjectCreateComponent,
    EquipeComponent,
    ChatbotComponent,
    StatsDashboardComponent,
    BudgetComponent,
    SafeUrlPipe,
    PmTasksComponent,
    PmCalendarComponent,
    TvDashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }