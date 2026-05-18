import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ParticipationFestivalLocation, ParticipationSubmissionRequest } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { toApiErrorMessage } from '../../core/http/api-error-message';
import {
  ACTOR_OPTIONS,
  ActorType,
  CURRENT_YEAR_OPTIONS,
  FIELDSETS_BY_ACTOR,
  FESTIVAL_VENUE_OPTIONS,
  IDENTITY_BY_ACTOR,
  IDENTIFICATION_TYPE_OPTIONS,
  MONTH_OPTIONS,
  PARTICIPATION_DRAFT_STORAGE_KEY,
  ROLE_OPTIONS_BY_ACTOR,
  SCOPE_OPTIONS,
} from './participation-form.config';

type ValidationErrors = Record<string, string>;

@Component({
  selector: 'app-participation-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <header class="header">
        <h2>Participación</h2>
        <p>Formulario avanzado conectado a SQL vía backend .NET</p>
      </header>

      <div class="actor-grid">
        <button
          *ngFor="let actor of actorOptions"
          type="button"
          class="actor-item"
          [class.active]="form.actorType === actor.key"
          (click)="onActorTypeSelected(actor.key)"
        >
          <span>{{ actor.label }}</span>
          <small>{{ actor.description }}</small>
        </button>
      </div>

      <div class="toolbar">
        <button type="button" class="ghost" (click)="saveDraft()">Guardar borrador local</button>
        <button type="button" class="ghost" (click)="clearDraft()">Limpiar borrador</button>
      </div>

      <form (ngSubmit)="submit()" class="form" novalidate>
        <label *ngIf="identity.showIdentificationFields">
          Nombres
          <input [(ngModel)]="form.individualFirstName" name="individualFirstName" (ngModelChange)="clearError('individualFirstName')" required />
          <small class="error" *ngIf="errors['individualFirstName']">{{ errors['individualFirstName'] }}</small>
        </label>

        <label *ngIf="identity.showIdentificationFields">
          Apellidos
          <input [(ngModel)]="form.individualLastName" name="individualLastName" (ngModelChange)="clearError('individualLastName')" required />
          <small class="error" *ngIf="errors['individualLastName']">{{ errors['individualLastName'] }}</small>
        </label>

        <label *ngIf="identity.showIdentificationFields">
          Tipo de identificación
          <select [(ngModel)]="form.identificationType" name="identificationType" (ngModelChange)="clearError('identificationType')" required>
            <option value="">Selecciona una opción</option>
            <option *ngFor="let option of identificationTypeOptions" [value]="option">{{ option }}</option>
          </select>
          <small class="error" *ngIf="errors['identificationType']">{{ errors['identificationType'] }}</small>
        </label>

        <label *ngIf="identity.showIdentificationFields">
          Número de identificación
          <input [(ngModel)]="form.identificationNumber" name="identificationNumber" (ngModelChange)="clearError('identificationNumber')" required />
          <small class="error" *ngIf="errors['identificationNumber']">{{ errors['identificationNumber'] }}</small>
        </label>

        <label>
          {{ identity.actorNameLabel }}
          <input
            [(ngModel)]="form.actorName"
            name="actorName"
            [placeholder]="identity.actorNamePlaceholder"
            (ngModelChange)="clearError('actorName')"
            required
          />
          <small class="error" *ngIf="errors['actorName']">{{ errors['actorName'] }}</small>
        </label>

        <label *ngIf="identity.showResponsibleEntity">
          {{ identity.responsibleEntityLabel }}
          <input
            [(ngModel)]="form.responsibleEntity"
            name="responsibleEntity"
            [placeholder]="identity.responsibleEntityPlaceholder"
            (ngModelChange)="clearError('responsibleEntity')"
          />
          <small class="error" *ngIf="errors['responsibleEntity']">{{ errors['responsibleEntity'] }}</small>
        </label>

        <label *ngIf="identity.showContactFields">
          {{ identity.contactNameLabel }}
          <input [(ngModel)]="form.contactName" name="contactName" (ngModelChange)="clearError('contactName')" />
          <small class="error" *ngIf="errors['contactName']">{{ errors['contactName'] }}</small>
        </label>

        <label *ngIf="identity.showContactFields">
          {{ identity.contactRoleLabel }}
          <input [(ngModel)]="form.contactRole" name="contactRole" (ngModelChange)="clearError('contactRole')" />
          <small class="error" *ngIf="errors['contactRole']">{{ errors['contactRole'] }}</small>
        </label>

        <label>
          Correo
          <input [(ngModel)]="form.email" name="email" type="email" (ngModelChange)="clearError('email')" required />
          <small class="error" *ngIf="errors['email']">{{ errors['email'] }}</small>
        </label>

        <label>
          Teléfono
          <input [(ngModel)]="form.phone" name="phone" (ngModelChange)="clearError('phone')" required />
          <small class="error" *ngIf="errors['phone']">{{ errors['phone'] }}</small>
        </label>

        <label>
          Departamento
          <select [(ngModel)]="form.department" name="department" (change)="onDepartmentChanged()" required>
            <option value="">Selecciona departamento</option>
            <option *ngFor="let dept of departmentNames" [value]="dept">{{ dept }}</option>
          </select>
          <small class="error" *ngIf="errors['department']">{{ errors['department'] }}</small>
        </label>

        <label>
          Municipio
          <select [(ngModel)]="form.municipality" name="municipality" (ngModelChange)="clearError('municipality')" required>
            <option value="">Selecciona municipio</option>
            <option *ngFor="let muni of municipalities" [value]="muni">{{ muni }}</option>
          </select>
          <small class="error" *ngIf="errors['municipality']">{{ errors['municipality'] }}</small>
        </label>

        <label *ngIf="identity.showTerritoryScope">
          Alcance territorial
          <select [(ngModel)]="form.territoryScope" name="territoryScope" (ngModelChange)="clearError('territoryScope')">
            <option value="">Selecciona alcance</option>
            <option *ngFor="let option of scopeOptions" [value]="option">{{ option }}</option>
          </select>
          <small class="error" *ngIf="errors['territoryScope']">{{ errors['territoryScope'] }}</small>
        </label>

        <label *ngIf="identity.showWebsite">
          Sitio web (opcional)
          <input [(ngModel)]="form.website" name="website" />
        </label>

        <label *ngIf="identity.showSocialFields">
          Facebook (opcional)
          <input [(ngModel)]="form.facebookUrl" name="facebookUrl" />
        </label>

        <label *ngIf="identity.showSocialFields">
          Instagram (opcional)
          <input [(ngModel)]="form.instagramUrl" name="instagramUrl" />
        </label>

        <div class="full roles" *ngIf="identity.showRoleSection !== false">
          <p>Rol(es) en el ecosistema</p>
          <div class="tags">
            <label *ngFor="let role of roleOptions" class="tag">
              <input
                type="checkbox"
                [checked]="hasRole(role)"
                (change)="toggleRole(role, $any($event.target).checked)"
              />
              <span>{{ role }}</span>
            </label>
          </div>
          <small class="error" *ngIf="errors['roles']">{{ errors['roles'] }}</small>
        </div>

        <ng-container *ngFor="let field of dynamicFields">
          <label *ngIf="field.type === 'text' || field.type === 'number'" [class.full]="field.type === 'number' ? false : false">
            {{ field.label }}
            <input
              [type]="field.type"
              [attr.min]="field.min ?? null"
              [attr.max]="field.max ?? null"
              [ngModel]="readField(field.key)"
              [name]="field.key"
              (ngModelChange)="writeField(field.key, $event)"
            />
            <small class="error" *ngIf="errors[field.key]">{{ errors[field.key] }}</small>
          </label>

          <label *ngIf="field.type === 'select'">
            {{ field.label }}
            <select [ngModel]="readField(field.key)" [name]="field.key" (ngModelChange)="writeField(field.key, $event)">
              <option value="">Selecciona una opción</option>
              <option *ngFor="let option of field.options ?? []" [value]="option">{{ option }}</option>
            </select>
            <small class="error" *ngIf="errors[field.key]">{{ errors[field.key] }}</small>
          </label>

          <label *ngIf="field.type === 'date'">
            {{ field.label }}
            <input type="date" [ngModel]="readField(field.key)" [name]="field.key" (ngModelChange)="writeField(field.key, $event)" />
            <small class="error" *ngIf="errors[field.key]">{{ errors[field.key] }}</small>
          </label>

          <label *ngIf="field.type === 'textarea'" class="full">
            {{ field.label }}
            <textarea
              [rows]="field.rows ?? 4"
              [ngModel]="readField(field.key)"
              [name]="field.key"
              (ngModelChange)="writeField(field.key, $event)"
            ></textarea>
            <small class="error" *ngIf="errors[field.key]">{{ errors[field.key] }}</small>
          </label>
        </ng-container>

        <div class="full" *ngIf="showFestivalMonths">
          <p>Meses habituales del festival</p>
          <div class="tags">
            <label *ngFor="let month of monthOptions" class="tag">
              <input type="checkbox" [checked]="hasFestivalMonth(month)" (change)="toggleFestivalMonth(month, $any($event.target).checked)" />
              <span>{{ month }}</span>
            </label>
          </div>
          <small class="error" *ngIf="errors['festivalHabitualMonths']">{{ errors['festivalHabitualMonths'] }}</small>
        </div>

        <div class="full" *ngIf="showMarketMonths">
          <p>Meses habituales del mercado</p>
          <div class="tags">
            <label *ngFor="let month of monthOptions" class="tag">
              <input type="checkbox" [checked]="hasMarketMonth(month)" (change)="toggleMarketMonth(month, $any($event.target).checked)" />
              <span>{{ month }}</span>
            </label>
          </div>
          <small class="error" *ngIf="errors['marketHabitualMonths']">{{ errors['marketHabitualMonths'] }}</small>
        </div>

        <div class="full panel" *ngIf="showFestivalLocations">
          <p>Ubicaciones adicionales del festival</p>
          <div class="location-grid" *ngFor="let location of festivalAdditionalLocations; let index = index">
            <label>
              Departamento
              <select [ngModel]="location.department" (ngModelChange)="changeFestivalLocationDepartment(index, $event)">
                <option value="">Selecciona departamento</option>
                <option *ngFor="let dept of departmentNames" [value]="dept">{{ dept }}</option>
              </select>
            </label>
            <label>
              Municipio
              <select [ngModel]="location.municipality" (ngModelChange)="changeFestivalLocationMunicipality(index, $event)">
                <option value="">Selecciona municipio</option>
                <option *ngFor="let muni of locationMunicipalities(location.department)" [value]="muni">{{ muni }}</option>
              </select>
            </label>
            <button type="button" class="remove" (click)="removeFestivalLocation(index)">Eliminar</button>
          </div>
          <button type="button" class="ghost small" (click)="addFestivalLocation()">Agregar ubicación</button>
          <small class="error" *ngIf="errors['festivalAdditionalLocations']">{{ errors['festivalAdditionalLocations'] }}</small>
        </div>

        <div class="full panel" *ngIf="showFestivalDates">
          <label *ngIf="!usesFestivalRangeDate">
            Fecha del festival
            <input type="date" [(ngModel)]="form.festivalThisYearDate" name="festivalThisYearDate" />
          </label>
          <div class="location-grid" *ngIf="usesFestivalRangeDate">
            <label>
              Fecha inicio
              <input type="date" [(ngModel)]="form.festivalThisYearStartDate" name="festivalThisYearStartDate" />
            </label>
            <label>
              Fecha fin
              <input type="date" [(ngModel)]="form.festivalThisYearEndDate" name="festivalThisYearEndDate" />
            </label>
          </div>
          <small class="error" *ngIf="errors['festivalDates']">{{ errors['festivalDates'] }}</small>
        </div>

        <div class="full panel" *ngIf="showFestivalOpenCall">
          <label>
            ¿Convocatoria abierta vigente?
            <select [(ngModel)]="form.festivalCurrentOpenCall" name="festivalCurrentOpenCall">
              <option value="">Selecciona una opción</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </label>
          <label *ngIf="form.festivalCurrentOpenCall === 'Sí'">
            Fecha límite convocatoria
            <input type="date" [(ngModel)]="form.festivalOpenCallDeadline" name="festivalOpenCallDeadline" />
          </label>
          <small class="error" *ngIf="errors['festivalOpenCall']">{{ errors['festivalOpenCall'] }}</small>
        </div>

        <div class="full panel" *ngIf="showMarketStatusDates">
          <label *ngIf="form.marketThisYearStatus === currentYearOptions[1]">
            Mes estimado (mercado por realizar)
            <select [(ngModel)]="form.marketThisYearMonth" name="marketThisYearMonth">
              <option value="">Selecciona mes</option>
              <option *ngFor="let month of monthOptions" [value]="month">{{ month }}</option>
            </select>
          </label>
          <label *ngIf="form.marketThisYearStatus === currentYearOptions[0]">
            Fecha del mercado realizado
            <input type="date" [(ngModel)]="form.marketThisYearDate" name="marketThisYearDate" />
          </label>
          <small class="error" *ngIf="errors['marketStatus']">{{ errors['marketStatus'] }}</small>
        </div>

        <label *ngIf="form.linkedFestival === 'Sí'">
          Nombre del festival vinculado
          <input [(ngModel)]="form.linkedFestivalName" name="linkedFestivalName" />
          <small class="error" *ngIf="errors['linkedFestivalName']">{{ errors['linkedFestivalName'] }}</small>
        </label>

        <label class="full">
          Campos musicales
          <textarea [(ngModel)]="form.musicalFields" name="musicalFields" rows="3" required></textarea>
          <small class="error" *ngIf="errors['musicalFields']">{{ errors['musicalFields'] }}</small>
        </label>

        <label class="full">
          Descripción del proceso
          <textarea [(ngModel)]="form.description" name="description" rows="4" required></textarea>
          <small class="error" *ngIf="errors['description']">{{ errors['description'] }}</small>
        </label>

        <label class="full">
          ¿Cómo puedes aportar al PNMC?
          <textarea [(ngModel)]="form.contribution" name="contribution" rows="4" required></textarea>
          <small class="error" *ngIf="errors['contribution']">{{ errors['contribution'] }}</small>
        </label>

        <label class="full">
          Necesidades o requerimientos
          <textarea [(ngModel)]="form.needs" name="needs" rows="3"></textarea>
        </label>

        <label class="full consent">
          <input type="checkbox" [(ngModel)]="form.consent" name="consent" />
          <span>Autorizo tratamiento de la información.</span>
        </label>
        <small class="error full" *ngIf="errors['consent']">{{ errors['consent'] }}</small>

        <div class="actions full">
          <button type="submit" [disabled]="submitting">{{ submitting ? 'Enviando...' : 'Enviar' }}</button>
        </div>
      </form>

      <p *ngIf="message" class="state success">{{ message }}</p>
      <p *ngIf="error" class="state error">{{ error }}</p>
    </section>
  `,
  styles: [
    `
      .card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1.25rem;
      }
      .header h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      .header p {
        margin: 0.4rem 0 0;
        color: #64748b;
        font-size: 0.85rem;
      }
      .actor-grid {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 0.6rem;
      }
      .actor-item {
        border: 1px solid #cbd5e1;
        border-radius: 0.8rem;
        background: #fff;
        text-align: left;
        padding: 0.65rem;
        display: grid;
        gap: 0.25rem;
        cursor: pointer;
      }
      .actor-item span {
        font-weight: 600;
        color: #1f2937;
        font-size: 0.85rem;
      }
      .actor-item small {
        color: #64748b;
        font-size: 0.73rem;
        line-height: 1.3;
      }
      .actor-item.active {
        border-color: #291242;
        background: #f6f3ff;
      }
      .toolbar {
        margin-top: 0.75rem;
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }
      .ghost {
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #334155;
        border-radius: 999px;
        padding: 0.32rem 0.75rem;
        font-size: 0.78rem;
        cursor: pointer;
      }
      .ghost.small {
        margin-top: 0.5rem;
      }
      .form {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.7rem;
      }
      .full {
        grid-column: 1 / -1;
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.82rem;
        color: #334155;
      }
      input,
      select,
      textarea {
        border: 1px solid #cbd5e1;
        border-radius: 0.7rem;
        padding: 0.5rem 0.65rem;
        font-size: 0.85rem;
      }
      .roles {
        border: 1px dashed #cbd5e1;
        border-radius: 0.8rem;
        padding: 0.65rem;
      }
      .roles > p {
        margin: 0 0 0.5rem;
        font-weight: 600;
        color: #1f2937;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .tag {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        border: 1px solid #e2e8f0;
        border-radius: 999px;
        padding: 0.2rem 0.5rem;
        background: #fff;
        font-size: 0.76rem;
      }
      .panel {
        border: 1px solid #e2e8f0;
        border-radius: 0.8rem;
        padding: 0.7rem;
      }
      .panel > p {
        margin: 0 0 0.6rem;
        font-weight: 600;
      }
      .location-grid {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 0.5rem;
        align-items: end;
      }
      .remove {
        border: 1px solid #fecaca;
        background: #fff5f5;
        color: #b91c1c;
        border-radius: 0.6rem;
        padding: 0.42rem 0.6rem;
        font-size: 0.78rem;
        cursor: pointer;
        height: fit-content;
      }
      .consent {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
      }
      button[type='submit'] {
        border: 1px solid #291242;
        background: #291242;
        color: #fff;
        border-radius: 999px;
        padding: 0.45rem 1rem;
        font-size: 0.84rem;
        cursor: pointer;
      }
      button[type='submit']:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        color: #b91c1c;
        font-size: 0.73rem;
      }
      .state {
        margin: 1rem 0 0;
        font-size: 0.85rem;
      }
      .state.success {
        color: #166534;
      }
      .state.error {
        color: #b91c1c;
      }
      @media (max-width: 900px) {
        .form {
          grid-template-columns: 1fr;
        }
        .location-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ParticipationPageComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly actorOptions = ACTOR_OPTIONS;
  readonly identificationTypeOptions = IDENTIFICATION_TYPE_OPTIONS;
  readonly scopeOptions = SCOPE_OPTIONS;
  readonly monthOptions = MONTH_OPTIONS;
  readonly currentYearOptions = CURRENT_YEAR_OPTIONS;

  groupedLocations: Record<string, string[]> = {};
  departmentNames: string[] = [];
  municipalities: string[] = [];

  submitting = false;
  message = '';
  error = '';
  errors: ValidationErrors = {};

  form: ParticipationSubmissionRequest = this.buildEmptyForm();

  get identity() {
    return IDENTITY_BY_ACTOR[this.actorType];
  }

  get actorType(): ActorType {
    return (this.form.actorType as ActorType) || 'individual';
  }

  get roleOptions(): string[] {
    return ROLE_OPTIONS_BY_ACTOR[this.actorType] ?? ROLE_OPTIONS_BY_ACTOR['default'];
  }

  get dynamicFields() {
    return FIELDSETS_BY_ACTOR[this.actorType] ?? [];
  }

  get showFestivalMonths(): boolean {
    return this.actorType === 'festival' && ['Semestral', 'Trimestral'].includes(this.form.festivalFrequency ?? '');
  }

  get showMarketMonths(): boolean {
    return this.actorType === 'market' && ['Semestral', 'Trimestral'].includes(this.form.marketFrequency ?? '');
  }

  get showFestivalLocations(): boolean {
    return this.actorType === 'festival' && this.form.festivalVenueMode === FESTIVAL_VENUE_OPTIONS[1];
  }

  get showFestivalDates(): boolean {
    return this.actorType === 'festival' && ['Ya se realizó', 'Se va a realizar'].includes(this.form.festivalThisYearStatus ?? '');
  }

  get usesFestivalRangeDate(): boolean {
    return Number(this.form.festivalDurationDays ?? '0') > 1;
  }

  get showFestivalOpenCall(): boolean {
    return this.actorType === 'festival' && this.form.openCall === 'Sí' && this.form.festivalThisYearStatus === 'Se va a realizar';
  }

  get showMarketStatusDates(): boolean {
    return this.actorType === 'market' && ['Ya se realizó', 'Se va a realizar'].includes(this.form.marketThisYearStatus ?? '');
  }

  get festivalAdditionalLocations(): ParticipationFestivalLocation[] {
    return this.form.festivalAdditionalLocations ?? [];
  }

  ngOnInit(): void {
    this.loadLocations();
    this.loadDraft();
  }

  onActorTypeSelected(actorType: ActorType): void {
    this.form.actorType = actorType;
    this.form.actorTypeLabel = ACTOR_OPTIONS.find((x) => x.key === actorType)?.label ?? '';
    this.form.roles = [];
    if (actorType !== 'festival') {
      this.form.festivalAdditionalLocations = [];
      this.form.festivalHabitualMonths = [];
    }
    if (actorType !== 'market') {
      this.form.marketHabitualMonths = [];
    }
    this.errors = {};
  }

  loadLocations(): void {
    this.api.getDivipolaGrouped().subscribe({
      next: (grouped) => {
        this.groupedLocations = grouped ?? {};
        this.departmentNames = Object.keys(this.groupedLocations).sort((a, b) => a.localeCompare(b));
        if (this.form.department) this.onDepartmentChanged();
      },
      error: (error: unknown) => {
        this.error = toApiErrorMessage(error, 'No pudimos cargar departamentos y municipios.');
      },
    });
  }

  loadDraft(): void {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(PARTICIPATION_DRAFT_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<ParticipationSubmissionRequest>;
      this.form = {
        ...this.buildEmptyForm(),
        ...parsed,
      };
      this.form.actorType = (this.form.actorType as ActorType) || 'individual';
      this.form.roles = parsed.roles ?? [];
      this.form.festivalHabitualMonths = parsed.festivalHabitualMonths ?? [];
      this.form.marketHabitualMonths = parsed.marketHabitualMonths ?? [];
      this.form.festivalAdditionalLocations = parsed.festivalAdditionalLocations ?? [];
    } catch {
      window.localStorage.removeItem(PARTICIPATION_DRAFT_STORAGE_KEY);
    }
  }

  saveDraft(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PARTICIPATION_DRAFT_STORAGE_KEY, JSON.stringify(this.form));
    this.message = 'Borrador guardado localmente.';
    this.error = '';
  }

  clearDraft(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PARTICIPATION_DRAFT_STORAGE_KEY);
    }
    this.form = this.buildEmptyForm();
    this.municipalities = [];
    this.errors = {};
    this.message = 'Borrador eliminado.';
    this.error = '';
  }

  onDepartmentChanged(): void {
    this.municipalities = this.groupedLocations[this.form.department ?? ''] ?? [];
    if (!this.municipalities.includes(this.form.municipality ?? '')) {
      this.form.municipality = '';
    }
    this.clearError('department');
  }

  readField(key: string): string {
    const value = (this.form as unknown as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  }

  writeField(key: string, value: string): void {
    (this.form as unknown as Record<string, unknown>)[key] = value ?? '';
    this.clearError(key);
  }

  hasRole(role: string): boolean {
    return (this.form.roles ?? []).includes(role);
  }

  toggleRole(role: string, checked: boolean): void {
    const nextRoles = new Set(this.form.roles ?? []);
    if (checked) nextRoles.add(role);
    else nextRoles.delete(role);
    this.form.roles = [...nextRoles];
    this.clearError('roles');
  }

  hasFestivalMonth(month: string): boolean {
    return (this.form.festivalHabitualMonths ?? []).includes(month);
  }

  toggleFestivalMonth(month: string, checked: boolean): void {
    const next = new Set(this.form.festivalHabitualMonths ?? []);
    if (checked) next.add(month);
    else next.delete(month);
    this.form.festivalHabitualMonths = [...next];
    this.clearError('festivalHabitualMonths');
  }

  hasMarketMonth(month: string): boolean {
    return (this.form.marketHabitualMonths ?? []).includes(month);
  }

  toggleMarketMonth(month: string, checked: boolean): void {
    const next = new Set(this.form.marketHabitualMonths ?? []);
    if (checked) next.add(month);
    else next.delete(month);
    this.form.marketHabitualMonths = [...next];
    this.clearError('marketHabitualMonths');
  }

  addFestivalLocation(): void {
    this.form.festivalAdditionalLocations = [
      ...(this.form.festivalAdditionalLocations ?? []),
      { department: '', municipality: '' },
    ];
    this.clearError('festivalAdditionalLocations');
  }

  removeFestivalLocation(index: number): void {
    const list = [...(this.form.festivalAdditionalLocations ?? [])];
    list.splice(index, 1);
    this.form.festivalAdditionalLocations = list;
  }

  changeFestivalLocationDepartment(index: number, department: string): void {
    const list = [...(this.form.festivalAdditionalLocations ?? [])];
    const previous = list[index];
    if (!previous) return;
    list[index] = { department, municipality: '' };
    this.form.festivalAdditionalLocations = list;
    this.clearError('festivalAdditionalLocations');
  }

  changeFestivalLocationMunicipality(index: number, municipality: string): void {
    const list = [...(this.form.festivalAdditionalLocations ?? [])];
    const previous = list[index];
    if (!previous) return;
    list[index] = { ...previous, municipality };
    this.form.festivalAdditionalLocations = list;
    this.clearError('festivalAdditionalLocations');
  }

  locationMunicipalities(department: string): string[] {
    return this.groupedLocations[department] ?? [];
  }

  clearError(key: string): void {
    if (!this.errors[key]) return;
    const { [key]: _, ...rest } = this.errors;
    this.errors = rest;
  }

  submit(): void {
    const payload = this.sanitizeForm(this.form);
    this.errors = this.validateForm(payload);
    if (Object.keys(this.errors).length > 0) {
      this.error = 'Hay campos por corregir antes de enviar.';
      this.message = '';
      return;
    }

    this.submitting = true;
    this.message = '';
    this.error = '';

    this.api.createParticipationSubmission(payload).subscribe({
      next: (response) => {
        this.message = `Registro creado con referencia ${response.reference}.`;
        this.submitting = false;
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(PARTICIPATION_DRAFT_STORAGE_KEY);
        }
        this.form = this.buildEmptyForm();
        this.municipalities = [];
      },
      error: (error: unknown) => {
        this.error = toApiErrorMessage(error, 'No pudimos registrar la participación.');
        this.submitting = false;
      },
    });
  }

  private validateForm(form: ParticipationSubmissionRequest): ValidationErrors {
    const result: ValidationErrors = {};

    const require = (key: keyof ParticipationSubmissionRequest | string, value: unknown, message: string) => {
      if (typeof value === 'string') {
        if (!value.trim()) result[String(key)] = message;
        return;
      }
      if (Array.isArray(value)) {
        if (value.length === 0) result[String(key)] = message;
      }
    };

    require('actorType', form.actorType, 'Selecciona el tipo de actor.');
    require('actorName', form.actorName, 'Completa el nombre del actor.');
    require('email', form.email, 'Completa el correo.');
    require('phone', form.phone, 'Completa el teléfono.');
    require('department', form.department, 'Selecciona departamento.');
    require('municipality', form.municipality, 'Selecciona municipio.');
    require('musicalFields', form.musicalFields, 'Completa este campo.');
    require('description', form.description, 'Completa este campo.');
    require('contribution', form.contribution, 'Completa este campo.');

    if (!form.consent) result['consent'] = 'Debes autorizar el tratamiento de información.';

    if (this.identity.showIdentificationFields) {
      require('individualFirstName', form.individualFirstName, 'Completa los nombres.');
      require('individualLastName', form.individualLastName, 'Completa los apellidos.');
      require('identificationType', form.identificationType, 'Selecciona tipo de identificación.');
      require('identificationNumber', form.identificationNumber, 'Completa número de identificación.');
    }

    if (this.identity.showResponsibleEntity) {
      require('responsibleEntity', form.responsibleEntity, 'Completa la entidad responsable.');
    }

    if (this.identity.showContactFields) {
      require('contactName', form.contactName, 'Completa la persona de contacto.');
      require('contactRole', form.contactRole, 'Completa el rol de contacto.');
    }

    if (this.identity.showTerritoryScope) {
      require('territoryScope', form.territoryScope, 'Selecciona alcance territorial.');
    }

    if (this.identity.showRoleSection !== false) {
      require('roles', form.roles ?? [], 'Selecciona al menos un rol.');
    }

    for (const field of this.dynamicFields) {
      require(field.key, this.readFieldFromForm(form, field.key), 'Completa este campo.');
    }

    if (this.showFestivalMonths && (form.festivalHabitualMonths ?? []).length === 0) {
      result['festivalHabitualMonths'] = 'Selecciona al menos un mes habitual.';
    }

    if (this.showFestivalLocations) {
      const valid = (form.festivalAdditionalLocations ?? []).every(
        (location) => location.department?.trim() && location.municipality?.trim(),
      );
      if (!valid || (form.festivalAdditionalLocations ?? []).length === 0) {
        result['festivalAdditionalLocations'] = 'Completa todas las ubicaciones adicionales del festival.';
      }
    }

    if (this.showFestivalDates) {
      if (this.usesFestivalRangeDate) {
        if (!form.festivalThisYearStartDate || !form.festivalThisYearEndDate) {
          result['festivalDates'] = 'Completa fecha inicio y fecha fin del festival.';
        }
      } else if (!form.festivalThisYearDate) {
        result['festivalDates'] = 'Completa la fecha del festival.';
      }
    }

    if (this.showFestivalOpenCall) {
      if (!form.festivalCurrentOpenCall) {
        result['festivalOpenCall'] = 'Indica si la convocatoria está abierta.';
      } else if (form.festivalCurrentOpenCall === 'Sí' && !form.festivalOpenCallDeadline) {
        result['festivalOpenCall'] = 'Completa la fecha límite de convocatoria.';
      }
    }

    if (this.showMarketMonths && (form.marketHabitualMonths ?? []).length === 0) {
      result['marketHabitualMonths'] = 'Selecciona al menos un mes habitual.';
    }

    if (form.linkedFestival === 'Sí' && !form.linkedFestivalName?.trim()) {
      result['linkedFestivalName'] = 'Completa el nombre del festival vinculado.';
    }

    if (this.showMarketStatusDates) {
      if (form.marketThisYearStatus === 'Se va a realizar' && !form.marketThisYearMonth) {
        result['marketStatus'] = 'Selecciona el mes estimado del mercado.';
      }
      if (form.marketThisYearStatus === 'Ya se realizó' && !form.marketThisYearDate) {
        result['marketStatus'] = 'Selecciona la fecha en que se realizó el mercado.';
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      result['email'] = 'Ingresa un correo válido.';
    }

    if (!/^[0-9+\-()\s]{6,40}$/.test(form.phone)) {
      result['phone'] = 'Ingresa un teléfono válido.';
    }

    return result;
  }

  private sanitizeForm(form: ParticipationSubmissionRequest): ParticipationSubmissionRequest {
    const actorType = (form.actorType as ActorType) || 'individual';
    const actorTypeLabel = ACTOR_OPTIONS.find((x) => x.key === actorType)?.label ?? '';
    const individualName = `${form.individualFirstName ?? ''} ${form.individualLastName ?? ''}`.trim();
    const actorName =
      actorType === 'individual'
        ? this.normalizeText(individualName || form.actorName)
        : this.normalizeText(form.actorName);

    return {
      ...form,
      actorType,
      actorTypeLabel,
      actorName,
      individualFirstName: this.normalizeText(form.individualFirstName),
      individualLastName: this.normalizeText(form.individualLastName),
      identificationType: this.normalizeText(form.identificationType),
      identificationNumber: this.normalizeText(form.identificationNumber),
      responsibleEntity: this.normalizeText(form.responsibleEntity),
      contactName: this.normalizeText(form.contactName),
      contactRole: this.normalizeText(form.contactRole),
      email: this.normalizeEmail(form.email),
      phone: this.normalizePhone(form.phone),
      department: this.normalizeText(form.department),
      municipality: this.normalizeText(form.municipality),
      territoryScope: this.normalizeText(form.territoryScope),
      website: this.normalizeText(form.website),
      facebookUrl: this.normalizeText(form.facebookUrl),
      instagramUrl: this.normalizeText(form.instagramUrl),
      roles: this.cleanArray(form.roles),
      musicalFields: this.normalizeText(form.musicalFields),
      description: this.normalizeText(form.description),
      contribution: this.normalizeText(form.contribution),
      needs: this.normalizeText(form.needs),
      festivalAdditionalLocations: (form.festivalAdditionalLocations ?? [])
        .map((location) => ({
          department: this.normalizeText(location.department),
          municipality: this.normalizeText(location.municipality),
        }))
        .filter((location) => location.department && location.municipality),
      festivalHabitualMonths: this.cleanArray(form.festivalHabitualMonths),
      marketHabitualMonths: this.cleanArray(form.marketHabitualMonths),
      linkedFestivalName: this.normalizeText(form.linkedFestivalName),
      consent: !!form.consent,
    };
  }

  private readFieldFromForm(form: ParticipationSubmissionRequest, key: string): unknown {
    return (form as unknown as Record<string, unknown>)[key];
  }

  private cleanArray(values?: string[]): string[] {
    return (values ?? []).map((value) => this.normalizeText(value)).filter(Boolean);
  }

  private normalizeText(value: string | undefined): string {
    return String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeEmail(value: string | undefined): string {
    return this.normalizeText(value).toLowerCase();
  }

  private normalizePhone(value: string | undefined): string {
    return this.normalizeText(value).replace(/[^0-9+\-()\s]/g, '');
  }

  private buildEmptyForm(): ParticipationSubmissionRequest {
    return {
      actorType: 'individual',
      actorTypeLabel: '',
      actorName: '',
      individualFirstName: '',
      individualLastName: '',
      identificationType: '',
      identificationNumber: '',
      hasArtisticName: false,
      artisticName: '',
      responsibleEntity: '',
      contactName: '',
      contactRole: '',
      email: '',
      phone: '',
      department: '',
      municipality: '',
      territoryScope: '',
      website: '',
      facebookUrl: '',
      instagramUrl: '',
      roles: [],
      musicalFields: '',
      description: '',
      contribution: '',
      needs: '',
      organizationSubtype: '',
      yearFounded: '',
      legalStatus: '',
      mainPrograms: '',
      festivalDurationDays: '',
      festivalSetting: '',
      festivalVenueMode: '',
      festivalAdditionalLocations: [],
      festivalFrequency: '',
      festivalVersions: '',
      festivalHabitualMonths: [],
      festivalTicketing: '',
      openCall: '',
      festivalThisYearStatus: '',
      festivalThisYearDate: '',
      festivalThisYearStartDate: '',
      festivalThisYearEndDate: '',
      festivalCurrentOpenCall: '',
      festivalOpenCallDeadline: '',
      marketFrequency: '',
      marketEditionsCount: '',
      averageBuyers: '',
      linkedFestival: '',
      linkedFestivalName: '',
      marketHabitualMonths: [],
      marketThisYearStatus: '',
      marketThisYearMonth: '',
      marketThisYearDate: '',
      individualProfile: '',
      trajectoryYears: '',
      linkedProcesses: '',
      members: '',
      musicalPractice: '',
      circulationScope: '',
      collectiveTrajectory: '',
      spaceType: '',
      spaceCapacity: '',
      spaceUses: '',
      technicalEquipment: '',
      consent: false,
    };
  }
}
