import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-approval.component.html',
})
export class PendingApprovalComponent {
  public checking = false;
  public error = '';

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  public verificarAprovacao(): void {
    this.checking = true;
    this.error = '';
    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.checking = false;
        if (user.role !== 'pendente') void this.router.navigateByUrl('/list');
      },
      error: () => {
        this.checking = false;
        this.error = 'Não foi possível verificar o acesso. Tente novamente.';
      },
    });
  }
}
