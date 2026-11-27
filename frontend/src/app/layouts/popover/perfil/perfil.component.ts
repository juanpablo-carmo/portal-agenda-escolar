import { Component, OnInit, inject } from '@angular/core';
import { COMMONS_MODULES } from '../../../shared';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [COMMONS_MODULES],
  templateUrl: './perfil.component.html',
})
export class PerfilComponent implements OnInit {
  private readonly auth = inject(AuthService);
  perfilAberto = false;
  abaAtiva = 'perfil';
  modoEscuro = false;

  get nomeUsuario(): string {
    return this.auth.user?.name ?? 'Usuário';
  }

  get emailUsuario(): string {
    return this.auth.user?.email ?? '';
  }

  get avatarUsuario(): string {
    return 'assets/images/empty-avatar.png';
  }

  ngOnInit(): void {
    this.modoEscuro = localStorage.getItem('tema') === 'escuro';
    document.documentElement.classList.toggle('dark', this.modoEscuro);
  }

  onAlternarTema(): void {
    this.modoEscuro = !this.modoEscuro;
    document.documentElement.classList.toggle('dark', this.modoEscuro);
    localStorage.setItem('tema', this.modoEscuro ? 'escuro' : 'claro');
  }

  onAlternarPerfil(): void {
    this.perfilAberto = !this.perfilAberto;
  }

  onSelecionarAba(aba: string): void {
    this.abaAtiva = aba;
  }

  onSair(): void {
    this.perfilAberto = false;
    this.auth.logout();
  }
}
