import { Routes } from '@angular/router';
import { AgendaListComponent } from './agenda-list/agenda-list.component';
import { AgendaCreateComponent } from './agenda-create/agenda-create.component';
import { AgendaReportsComponent } from './agenda-reports/agenda-reports.component';
import { AdminPermissionsComponent } from '../../auth/admin-permissions.component';
import { roleGuard } from '../../auth/auth.guard';
import { AgendaWelcomeComponent } from './agenda-welcome/agenda-welcome.component';

export const routes: Routes = [

  { path: '', redirectTo: 'list', pathMatch: 'full' },

  {
    path: 'create',
    component: AgendaCreateComponent,
    canActivate: [roleGuard],
    data: { roles: ['editor', 'administrador'] },
  },
  {
    path: 'list',
    component: AgendaListComponent,
  },
  {
    path: 'reports',
    component: AgendaReportsComponent,
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
  },
  {
    path: 'admin/permissions',
    component: AdminPermissionsComponent,
    canActivate: [roleGuard],
    data: { roles: ['administrador'] },
  },

  {
    path: 'welcome',
    component: AgendaWelcomeComponent,
  }
];
