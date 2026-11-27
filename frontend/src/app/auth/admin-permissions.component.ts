import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { COMMONS_MODULES } from '../shared';

type UserRole = 'pendente' | 'leitor' | 'editor' | 'administrador';

interface PermissionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  savedRole?: UserRole;
  created_at: string;
  saving?: boolean;
  error?: string;
}

@Component({
  selector: 'app-admin-permissions',
  standalone: true,
  imports: [COMMONS_MODULES],
  templateUrl: './admin-permissions.component.html',
})
export class AdminPermissionsComponent implements OnInit {
  itemAtivo: number = 1;
  public users: PermissionUser[] = [];
  public loading = true;
  public error = '';
  public statusMessage = '';
  private savesInFlight = 0;
  public readonly roles: { value: UserRole }[] = [
    { value: 'pendente' },
    { value: 'leitor' },
    { value: 'editor' },
    { value: 'administrador' },
  ];

  public get formatoDataCadastro(): string {
    return this._translate.currentLang() === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
  }

  public get salvandoAlteracoes(): boolean {
    return this.savesInFlight > 0;
  }

  constructor(
    private readonly http: HttpClient,
    private _translate: TranslateService,
  ) {
    const idiomaSalvo = localStorage.getItem('idioma') || 'pt-BR';

    this.itemAtivo = idiomaSalvo === 'pt-BR' ? 1 : 2;

    this._translate.use(idiomaSalvo);
  }

  public ngOnInit(): void {
    this.carregarUsuarios();
  }

  public onSelecionarIdioma(item: number, idioma: string): void {
    this.itemAtivo = item;

    this._translate.use(idioma).subscribe({
      next: () => console.log('Idioma alterado:', idioma),
      error: (erro) => console.error('Erro ao alterar idioma:', erro),
    });

    localStorage.setItem('idioma', idioma);
  }


  public carregarUsuarios(): void {
    if (this.salvandoAlteracoes) return;

    this.loading = true;
    this.error = '';
    this.http.get<PermissionUser[]>('http://localhost:8000/api/auth/users').subscribe({
      next: (users) => {
        this.users = users.map((user) => ({ ...user, savedRole: user.role }));
        this.loading = false;
      },
      error: () => {
        this.error = this._translate.instant('permissoes.erro-carregar');
        this.loading = false;
      },
    });
  }

  public alterarPerfil(user: PermissionUser, newRole: UserRole): void {
    if (this.salvandoAlteracoes) return;

    if (!this.roles.some((role) => role.value === newRole)) {
      user.role = user.savedRole ?? user.role;
      return;
    }

    const oldRole = user.savedRole ?? user.role;
    user.saving = true;
    user.error = '';
    this.error = '';
    this.statusMessage = '';
    this.savesInFlight++;

    this.http
      .patch<PermissionUser>(`http://localhost:8000/api/auth/users/${user.id}/role`, {
        role: newRole,
      })
      .subscribe({
        next: (updatedUser) => {
          user.role = updatedUser.role;
          user.savedRole = updatedUser.role;
          user.saving = false;
          this.savesInFlight--;
          this.statusMessage = this._translate.instant('permissoes.salvo', {
            name: updatedUser.name,
          });
          this.carregarUsuarios();
        },
        error: (response) => {
          user.role = oldRole;
          const apiMessage: string = response.error?.message ?? '';
          if (apiMessage.includes('remover sua própria')) {
            user.error = this._translate.instant('permissoes.manter-proprio-administrador');
          } else if (apiMessage.includes('pelo menos um administrador')) {
            user.error = this._translate.instant('permissoes.manter-um-administrador');
          } else {
            user.error = this._translate.instant('permissoes.erro-alterar');
          }
          user.saving = false;
          this.savesInFlight--;
        },
      });
  }

  public contarRole(role: UserRole): number {
    return this.users.filter((user) => user.role === role).length;
  }
}
