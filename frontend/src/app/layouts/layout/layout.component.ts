import { Dialog } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { COMMONS_MODULES } from '../../shared';
import { PerfilComponent } from '../popover/perfil/perfil.component';
import { AuthService } from '../../auth/auth.service';
import { SupportComponent } from '../../shared/componets/modal/support/support.component';

@Component({
  imports: [COMMONS_MODULES, PerfilComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  itemAtivo: number = 1;

  constructor(
    private _translate: TranslateService,
    public router: Router,
    private readonly auth: AuthService,
    private _dialog: Dialog,
  ) {
    const idiomaSalvo = localStorage.getItem('idioma') || 'pt-BR';

    this.itemAtivo = idiomaSalvo === 'pt-BR' ? 1 : 2;

    this._translate.use(idiomaSalvo);
  }

  public get podeEditarAgendas(): boolean {
    return this.auth.user?.role === 'editor' || this.auth.user?.role === 'administrador';
  }

  public get isAdministrador(): boolean {
    return this.auth.user?.role === 'administrador';
  }

  public onSelecionarIdioma(item: number, idioma: string): void {
    this.itemAtivo = item;

    this._translate.use(idioma).subscribe({
      next: () => console.log('Idioma alterado:', idioma),
      error: (erro) => console.error('Erro ao alterar idioma:', erro),
    });

    localStorage.setItem('idioma', idioma);
  }
  public onAbrirModal(): void {
    this._dialog.open(SupportComponent, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'bg-black/40',
    });
  }
}
