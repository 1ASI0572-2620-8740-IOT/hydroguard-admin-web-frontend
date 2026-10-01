import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { QueryState } from '../../../application/state/query-state';
import { PageActions } from '../../state/page-actions';
import { notBlank } from '../../state/form-validators';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ActionFeedbackComponent } from '../../components/action-feedback/action-feedback.component';
import { FieldErrorComponent } from '../../components/field-error/field-error.component';
import { ConfigurationLabelPipe } from '../../state/labels';

import { CreateWorkGroupUseCase } from '../../../application/use-cases/create-work-group.use-case';
import { GetOrganizationContextUseCase } from '../../../application/use-cases/get-organization-context.use-case';
import { OrganizationContext } from '../../../domain/models/operational-catalog';
@Component({
  selector: 'hg-work-group-create-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    QueryFeedbackComponent,
    ActionFeedbackComponent,
    FieldErrorComponent,
    ConfigurationLabelPipe,
  ],
  providers: [PageActions],
  templateUrl: './work-group-create.page.html',
  styleUrl: '../../configuration-page.css',
})
export class WorkGroupCreatePage implements OnInit {
  private readonly create = inject(CreateWorkGroupUseCase);
  private readonly organization = inject(GetOrganizationContextUseCase);
  private readonly router = inject(Router);
  readonly actions = inject(PageActions);
  readonly state = new QueryState<OrganizationContext>();
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, notBlank, Validators.minLength(3), Validators.maxLength(120)]],
    purpose: [
      '',
      [Validators.required, notBlank, Validators.minLength(3), Validators.maxLength(500)],
    ],
    classification: ['', Validators.maxLength(120)],
  });
  ngOnInit() {
    void this.load();
  }
  load() {
    return this.state.load((signal) => this.organization.execute(signal));
  }
  async submit() {
    if (this.form.invalid || !this.state.data() || this.actions.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    await this.actions.run(
      'Crear grupo',
      async () => {
        const group = await this.create.execute(this.form.getRawValue());
        await this.router.navigate(['/groups', group.id]);
      },
      undefined,
      undefined,
      this.form,
    );
  }
}
