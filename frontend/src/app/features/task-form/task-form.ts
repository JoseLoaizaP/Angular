import { Component, HostListener, OnInit, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateTaskPayload, Task, TASK_STATUSES } from '../../core/models/task.model';
import { Button } from '../../shared/ui/button/button';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, Button],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm implements OnInit {
  /**
   * Inyección de dependencias: `FormBuilder` es un servicio provisto por
   * `ReactiveFormsModule` (importado arriba). En vez de construir cada
   * `FormControl`/`FormGroup` a mano con `new`, se pide la fábrica al
   * inyector de Angular con `inject()`. Esto simplifica la sintaxis para
   * crear formularios tipados (`fb.nonNullable.group(...)`) y hace que el
   * componente dependa de una abstracción reemplazable en pruebas.
   */
  private readonly fb = inject(FormBuilder);

  // ---- Property binding: entradas desde el componente padre -----------
  // `input()` declara señales de solo lectura que `TaskList` alimenta por
  // *property binding* en la plantilla:
  //   [task]="editingTask()" [saving]="saving()" [errorMessage]="formError()"
  // El flujo de datos es unidireccional padre -> hijo; el hijo nunca
  // modifica estos signals directamente.
  readonly task = input<Task | null>(null);
  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);

  // ---- Event binding: salidas hacia el componente padre ----------------
  // `output()` crea emisores que el padre escucha con *event binding*:
  //   (save)="handleSave($event)"  (close)="closeForm()"
  // Es el mecanismo inverso al `input()`: comunica hijo -> padre sin que
  // `TaskForm` conozca ni dependa de `TaskList`.
  readonly save = output<CreateTaskPayload>();
  readonly close = output<void>();

  readonly statuses = TASK_STATUSES;
  readonly isEditMode = computed(() => this.task() !== null);
  readonly heading = computed(() => (this.isEditMode() ? 'Editar tarea' : 'Nueva tarea'));

  /**
   * Binding bidireccional (two-way data binding): este formulario usa la
   * API de **Reactive Forms** en lugar de la sintaxis "banana en caja"
   * `[(ngModel)]="prop"`. En la plantilla (`task-form.html`), la directiva
   * `[formGroup]="form"` conecta este `FormGroup` con el elemento `<form>`,
   * y cada `formControlName="title"` liga un `<input>`/`<textarea>`/`<select>`
   * a su `FormControl` correspondiente. El dato fluye en ambos sentidos:
   *   - Modelo -> Vista: `patchValue()` (en `ngOnInit`) actualiza el DOM.
   *   - Vista -> Modelo: cada tecleo del usuario actualiza `form.value`.
   * Se eligió Reactive Forms (y no `ngModel`) porque permite validadores
   * declarativos y tipados (`Validators.required`, `minLength`, ...),
   * lectura síncrona del estado (`form.invalid`, `.touched`) y una
   * construcción centralizada e inmutable del formulario, algo más difícil
   * de lograr con formularios basados en plantillas.
   */
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    status: ['pending' as Task['status'], [Validators.required]],
  });

  ngOnInit(): void {
    const current = this.task();
    if (current) {
      // Modelo -> Vista del binding bidireccional: precarga el formulario
      // reactivo cuando `task` (property binding de entrada) trae una tarea
      // existente, es decir, cuando el modal se abrió en modo edición.
      this.form.patchValue({
        title: current.title,
        description: current.description,
        status: current.status,
      });
    }
  }

  /**
   * `@HostListener` es otra forma de *event binding*, pero declarada desde
   * la clase del componente en lugar de la plantilla: suscribe el método a
   * un evento del `document` (no del propio host) mientras el componente
   * esté vivo, y Angular se encarga de darlo de alta/baja automáticamente.
   * Permite cerrar el modal con la tecla Escape sin manipular el DOM
   * manualmente.
   */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  /** Enlazado en la plantilla como `(click)="onBackdropClick()"` sobre el fondo del modal (event binding). */
  onBackdropClick(): void {
    this.close.emit();
  }

  /**
   * Enlazado como `(ngSubmit)="onSubmit()"` en el `<form>` (event binding).
   * Si el formulario reactivo es inválido, marca todos los controles como
   * "touched" para que la plantilla muestre los mensajes de error
   * (`@if (form.controls.title.invalid && form.controls.title.touched)`).
   * Si es válido, emite el valor tipado por el `output() save`, que
   * `TaskList` recibe con `(save)="handleSave($event)"`.
   */
  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }
}
