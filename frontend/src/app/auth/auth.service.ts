import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, finalize, tap } from 'rxjs';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'pendente' | 'leitor' | 'editor' | 'administrador';
}

interface GoogleLoginResponse {
  token: string;
  user: AuthUser;
}

export interface GoogleAuthConfig {
  clientId: string | null;
}

const API_URL = 'http://localhost:8000/api';
const TOKEN_KEY = 'portal_agenda_token';
const USER_KEY = 'portal_agenda_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private cachedUser: AuthUser | null = this.readUser();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  public get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public get user(): AuthUser | null {
    return this.cachedUser;
  }

  public get isAuthenticated(): boolean {
    return this.token !== null;
  }

  public getGoogleConfig(): Observable<GoogleAuthConfig> {
    return this.http.get<GoogleAuthConfig>(`${API_URL}/auth/config`);
  }

  public getCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API_URL}/auth/me`).pipe(
      tap((user) => {
        this.cachedUser = user;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  public loginWithGoogle(credential: string): Observable<GoogleLoginResponse> {
    return this.http.post<GoogleLoginResponse>(`${API_URL}/auth/google`, { credential }).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        this.cachedUser = response.user;
      }),
    );
  }

  public logout(): void {
    const request = this.token
      ? this.http.post(`${API_URL}/auth/logout`, {}).pipe(finalize(() => this.clearSession()))
      : null;

    if (request) {
      request.subscribe({ error: () => undefined });
    } else {
      this.clearSession();
    }
  }

  public clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.cachedUser = null;
    void this.router.navigate(['/login']);
  }

  private readUser(): AuthUser | null {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? (JSON.parse(savedUser) as AuthUser) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
