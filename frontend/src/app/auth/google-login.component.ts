import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }): void;
      renderButton(element: HTMLElement, options: Record<string, string | number>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-login.component.html',
})
export class GoogleLoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleButton', { static: true }) private googleButton!: ElementRef<HTMLElement>;

  public carregando = true;
  public erro = '';
  private viewReady = false;
  private clientId: string | null = null;
  private returnUrl = '/';

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly zone: NgZone,
  ) {}

  public ngOnInit(): void {
    const requestedReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (requestedReturnUrl?.startsWith('/') && !requestedReturnUrl.startsWith('//')) {
      this.returnUrl = requestedReturnUrl;
    }

    if (this.auth.isAuthenticated) {
      void this.router.navigateByUrl(this.returnUrl);
      return;
    }

    this.auth.getGoogleConfig().subscribe({
      next: ({ clientId }) => {
        if (!clientId) {
          this.erro = 'O login do Google ainda não está configurado no servidor.';
          this.carregando = false;
          return;
        }

        this.clientId = clientId;
        this.inicializarSePronto();
      },
      error: () => {
        this.erro = 'Não foi possível conectar ao servidor de autenticação.';
        this.carregando = false;
      },
    });
  }

  public ngAfterViewInit(): void {
    this.viewReady = true;
    this.inicializarSePronto();
  }

  private inicializarSePronto(): void {
    if (!this.viewReady || !this.clientId) return;

    this.carregando = true;
    this.carregarBibliotecaGoogle()
      .then(() => {
        const google = window.google;
        if (!google || !this.clientId) throw new Error('Google Identity Services não carregou.');

        google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response) => this.zone.run(() => this.entrar(response.credential)),
        });
        google.accounts.id.renderButton(this.googleButton.nativeElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 320,
          logo_alignment: 'left',
        });
        this.carregando = false;
      })
      .catch(() => {
        this.erro = 'Não foi possível carregar o botão do Google. Verifique sua conexão e tente novamente.';
        this.carregando = false;
      });
  }

  private carregarBibliotecaGoogle(): Promise<void> {
    if (window.google) return Promise.resolve();

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existingScript) {
      return new Promise((resolve, reject) => {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(), { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['googleIdentity'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private entrar(credential: string): void {
    this.erro = '';
    this.carregando = true;

    this.auth.loginWithGoogle(credential).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl),
      error: (error) => {
        this.erro = error.status === 503
          ? 'O login do Google ainda não está configurado no servidor.'
          : 'Não foi possível validar sua conta Google. Tente novamente.';
        this.carregando = false;
      },
    });
  }
}
