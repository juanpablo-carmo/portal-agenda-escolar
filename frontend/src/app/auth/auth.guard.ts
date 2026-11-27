import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService, AuthUser } from './auth.service';

type AuthCheck =
  | { authenticated: true; user: AuthUser }
  | { authenticated: false; redirect: UrlTree };

function checkAuthentication(): Observable<AuthCheck> {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    return of<AuthCheck>({ authenticated: false, redirect: router.createUrlTree(['/login']) });
  }

  return auth.getCurrentUser().pipe(
    map((user): AuthCheck => ({ authenticated: true, user })),
    catchError(() => of<AuthCheck>({ authenticated: false, redirect: router.createUrlTree(['/login']) })),
  );
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return checkAuthentication().pipe(
    map((result) => {
      if (!result.authenticated) return result.redirect;
      return result.user.role === 'pendente'
        ? router.createUrlTree(['/aguardando-aprovacao'])
        : true;
    }),
  );
};

export const authChildGuard: CanActivateChildFn = (_route, state) => {
  const router = inject(Router);
  return checkAuthentication().pipe(
    map((result) => {
      if (!result.authenticated) return result.redirect;
      return result.user.role === 'pendente'
        ? router.createUrlTree(['/aguardando-aprovacao'], { queryParams: { returnUrl: state.url } })
        : true;
    }),
  );
};

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as string[];

  return checkAuthentication().pipe(
    map((result) => {
      if (!result.authenticated) return result.redirect;
      if (result.user.role === 'pendente') {
        return router.createUrlTree(['/aguardando-aprovacao']);
      }
      return allowedRoles.includes(result.user.role)
        ? true
        : router.createUrlTree(['/list']);
    }),
  );
};

export const pendingAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  return checkAuthentication().pipe(
    map((result) => {
      if (!result.authenticated) return result.redirect;
      return result.user.role === 'pendente' ? true : router.createUrlTree(['/list']);
    }),
  );
};
