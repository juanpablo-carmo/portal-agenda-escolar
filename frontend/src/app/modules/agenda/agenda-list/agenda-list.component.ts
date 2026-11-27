import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { COMMONS_MODULES } from '../../../shared';
import {
  AnswerAgendaComponent,
  RespostaAgenda,
  FormularioRespostaAgenda,
} from '../components/answer-agenda/answer-agenda.component';
import { Agenda, ListAgendaComponent } from '../components/agenda-list/list-agenda.component';

@Component({
  standalone: true,
  imports: [COMMONS_MODULES, ListAgendaComponent, ReactiveFormsModule],
  templateUrl: './agenda-list.component.html',
})
export class AgendaListComponent implements OnInit {
  protected agendas: Agenda[] = [];
  protected carregando = true;
  protected erro = '';
  protected excluindoAgendaId: number | null = null;
  protected agendaSelecionadaId: number | null = null;
  protected respostas: RespostaAgenda[] = [];
  protected carregandoRespostas = false;
  protected enviandoResposta = false;
  protected mensagemResposta = '';
  protected formatoData = 'dd/MM/yyyy HH:mm';

  protected readonly formulario: FormularioRespostaAgenda = new FormGroup({
    nomeAluno: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/.*\S.*/), Validators.minLength(3)],
    }),
    comentarioResposta: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/.*\S.*/)],
    }),
    arquivoSelecionado: new FormControl<File | null>(null),
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private respostaDialogRef: DialogRef<unknown, AnswerAgendaComponent> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly translate: TranslateService,
    private readonly dialog: Dialog,
  ) {
    this.atualizarFormatoData();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.atualizarFormatoData());
  }

  protected get podeConsultarRespostas(): boolean {
    return this.auth.user?.role === 'editor' || this.auth.user?.role === 'administrador';
  }

  protected get isAdministrador(): boolean {
    return this.auth.user?.role === 'administrador';
  }

  protected get agendaSelecionada(): Agenda | undefined {
    return this.agendas.find((agenda) => agenda.id === this.agendaSelecionadaId);
  }

  public ngOnInit(): void {
    this.carregarAgendas();
  }

  private carregarAgendas(): void {
    this.http.get<Agenda[]>('http://localhost:8000/api/agendas').subscribe({
      next: (agendas) => {
        this.agendas = agendas;
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao buscar agendas:', erro);
        this.erro = 'Não foi possível carregar as agendas.';
        this.carregando = false;
      },
    });
  }

  private atualizarFormatoData(): void {
    this.formatoData = this.translate.currentLang() === 'en'
      ? 'MM/dd/yyyy hh:mm a'
      : 'dd/MM/yyyy HH:mm';
  }

  public onSelecionarAgenda(agendaId: number): void {
    if (this.respostaDialogRef) {
      this.respostaDialogRef.close();
    }

    this.agendaSelecionadaId = agendaId;
    this.respostas = [];
    this.mensagemResposta = '';
    this.formulario.reset({
      nomeAluno: '',
      comentarioResposta: '',
      arquivoSelecionado: null,
    });

    this.carregandoRespostas = this.podeConsultarRespostas;
    this.abrirModalResposta();

    if (this.podeConsultarRespostas) {
      this.carregarRespostas(agendaId);
    }
  }

  private abrirModalResposta(): void {
    const ref = this.dialog.open(AnswerAgendaComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      hasBackdrop: true,
      disableClose: false,
      backdropClass: 'bg-black/40',
    });

    this.respostaDialogRef = ref;
    const modal = ref.componentInstance;

    if (!modal) {
      ref.close();
      return;
    }

    modal.tituloAgenda = this.agendaSelecionada?.titulo ?? '';
    modal.descricaoAgenda = this.agendaSelecionada?.descricao ?? '';
    modal.formulario = this.formulario;
    modal.respostas = this.respostas;
    modal.carregandoRespostas = this.carregandoRespostas;
    modal.formatoData = this.formatoData;
    modal.podeConsultarRespostas = this.podeConsultarRespostas;

    modal.enviar.subscribe(() => this.onEnviarResposta());
    modal.arquivoAlterado.subscribe((event) => this.onArquivoSelecionado(event));

    ref.closed.pipe(take(1)).subscribe(() => {
      if (this.respostaDialogRef === ref) {
        this.respostaDialogRef = null;
        this.limparSelecao();
      }
    });
  }

  private limparSelecao(): void {
    this.agendaSelecionadaId = null;
    this.respostas = [];
    this.carregandoRespostas = false;
    this.mensagemResposta = '';
    this.formulario.reset({
      nomeAluno: '',
      comentarioResposta: '',
      arquivoSelecionado: null,
    });
  }

  private carregarRespostas(agendaId: number): void {
    this.carregandoRespostas = true;

    this.http.get<RespostaAgenda[]>(`http://localhost:8000/api/agendas/${agendaId}/respostas`).subscribe({
      next: (respostas) => {
        if (this.agendaSelecionadaId !== agendaId) return;
        this.respostas = respostas;
        this.carregandoRespostas = false;
        if (this.respostaDialogRef?.componentInstance) {
          this.respostaDialogRef.componentInstance.respostas = respostas;
          this.respostaDialogRef.componentInstance.carregandoRespostas = false;
        }
      },
      error: (erro) => {
        console.error('Erro ao carregar respostas:', erro);
        if (this.agendaSelecionadaId !== agendaId) return;
        this.mensagemResposta = 'Não foi possível carregar as respostas.';
        this.carregandoRespostas = false;
        if (this.respostaDialogRef?.componentInstance) {
          this.respostaDialogRef.componentInstance.mensagemResposta = this.mensagemResposta;
          this.respostaDialogRef.componentInstance.carregandoRespostas = false;
        }
      },
    });
  }

  public onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formulario.controls.arquivoSelecionado.setValue(input.files?.[0] ?? null);
  }

  public onEnviarResposta(): void {
    this.mensagemResposta = '';
    this.formulario.markAllAsTouched();
    this.formulario.markAllAsDirty();

    if (this.agendaSelecionadaId === null || this.formulario.invalid || this.enviandoResposta) {
      return;
    }

    const agendaId = this.agendaSelecionadaId;
    const { nomeAluno, comentarioResposta, arquivoSelecionado } = this.formulario.getRawValue();
    const dados = new FormData();
    dados.append('aluno_nome', nomeAluno.trim());
    dados.append('comentario', comentarioResposta.trim());
    if (arquivoSelecionado) {
      dados.append('arquivo', arquivoSelecionado);
    }

    this.enviandoResposta = true;
    if (this.respostaDialogRef?.componentInstance) {
      this.respostaDialogRef.componentInstance.enviandoResposta = true;
    }

    this.http.post<RespostaAgenda>(`http://localhost:8000/api/agendas/${agendaId}/respostas`, dados).subscribe({
      next: () => {
        this.formulario.reset({
          nomeAluno: '',
          comentarioResposta: '',
          arquivoSelecionado: null,
        });
        this.mensagemResposta = 'Resposta enviada com sucesso!';
        if (this.respostaDialogRef?.componentInstance) {
          this.respostaDialogRef.componentInstance.mensagemResposta = this.mensagemResposta;
          this.respostaDialogRef.componentInstance.arquivoSelecionado = null;
        }
        if (this.podeConsultarRespostas) {
          this.carregarRespostas(agendaId);
        }
        this.enviandoResposta = false;
        if (this.respostaDialogRef?.componentInstance) {
          this.respostaDialogRef.componentInstance.enviandoResposta = false;
        }
      },
      error: (erro) => {
        console.error('Erro ao enviar resposta:', erro);
        this.mensagemResposta = erro.status === 422
          ? 'Confira os campos preenchidos e o tamanho do arquivo (máximo 10 MB).'
          : 'Não foi possível enviar a resposta. Tente novamente.';
        this.enviandoResposta = false;
        if (this.respostaDialogRef?.componentInstance) {
          this.respostaDialogRef.componentInstance.mensagemResposta = this.mensagemResposta;
          this.respostaDialogRef.componentInstance.enviandoResposta = false;
        }
      },
    });
  }

  public onExcluirAgenda(agenda: Agenda): void {
    if (!this.isAdministrador || this.excluindoAgendaId !== null) return;

    const confirmar = this.translate.instant('listaDeAgendas.confirmarExclusao', {
      titulo: agenda.titulo,
    });
    if (!window.confirm(confirmar)) return;

    this.excluindoAgendaId = agenda.id;
    this.http.delete<void>(`http://localhost:8000/api/agendas/${agenda.id}`).subscribe({
      next: () => {
        this.agendas = this.agendas.filter((item) => item.id !== agenda.id);
        this.excluindoAgendaId = null;
        if (this.agendaSelecionadaId === agenda.id) {
          this.respostaDialogRef?.close();
        }
      },
      error: (erro) => {
        console.error('Erro ao excluir agenda:', erro);
        window.alert(this.translate.instant('listaDeAgendas.erroExclusao'));
        this.excluindoAgendaId = null;
      },
    });
  }
}
