import { Routes } from '@angular/router';
import { LayoutComponent } from './layouts/layout/layout.component';
import { GoogleLoginComponent } from './auth/google-login.component';
import { PendingApprovalComponent } from './auth/pending-approval.component';
import { authChildGuard, authGuard, pendingAuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: GoogleLoginComponent,
  },
  {
    path: 'aguardando-aprovacao',
    component: PendingApprovalComponent,
    canActivate: [pendingAuthGuard],
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./modules/agenda/agenda.routes').then(m => m.routes),
      }
    ]
  },
  { path: '**', redirectTo: '' },
];
