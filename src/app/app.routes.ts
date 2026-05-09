import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DataViewComponent } from './features/data-view/data-view.component';
import { Dispositivos } from './features/dispositivos/dispositivos';
import { RolesComponent } from './features/roles/roles';
import { UsuariosComponent } from './features/usuarios/usuarios';
import { Luminarias } from './features/luminarias/luminarias';
import { Sensores } from './features/sensores/sensores';
import { Baterias } from './features/baterias/baterias';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { AuthService } from './core/services/auth.service';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  return router.navigate(['/login']);
};

const loginGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    return true;
  }
  return router.navigate(['/dashboard']);
};

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [loginGuard] },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'data-view', component: DataViewComponent },
      { path: 'dispositivos', component: Dispositivos },
      { path: 'luminarias', component: Luminarias },
      { path: 'sensores', component: Sensores },
      { path: 'baterias', component: Baterias },
      { path: 'roles', component: RolesComponent },
      { path: 'usuarios', component: UsuariosComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];