import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CreateTaskPayload, Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { Button } from '../../shared/ui/button/button';
import { TaskItem } from '../task-item/task-item';
import { TaskForm } from '../task-form/task-form';

@Component({
  selector: 'app-task-list',
  imports: [Button, TaskItem, TaskForm],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList implements OnInit {
  /**
   * Inyección de dependencias: `inject(TaskService)` pide al inyector de
   * Angular la instancia singleton registrada en `providedIn: 'root'`
   * ([[task.service.ts]]). `TaskList` no sabe (ni le importa) que por debajo
   * hay un `HttpClient` haciendo peticiones REST; solo depende de la
   * abstracción `TaskService`. Esto permite testear el componente
   * inyectando un `TaskService` falso y mantiene la lógica de HTTP fuera del
   * componente (separación de responsabilidades).
   */
  private readonly taskService = inject(TaskService);

  // ---- Estado expuesto como signals -----------------------------------
  // Estos signals se leen en `task-list.html` mediante *interpolación*
  // (`{{ total() }}`, `{{ loadError() }}`) y *property binding*
  // (`[task]="task"`, `[disabled]="processing()"` en los hijos). Al ser
  // signals, cualquier cambio dispara automáticamente la actualización de
  // la vista sin necesidad de `ChangeDetectorRef` ni zonas manuales.
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly isFormOpen = signal(false);
  readonly editingTask = signal<Task | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly processingIds = signal<ReadonlySet<string>>(new Set());

  // `computed()` deriva nuevos valores reactivos a partir de `tasks()`.
  // También se consumen por interpolación en el pie de página de
  // estadísticas (`{{ total() }}`, `{{ pendingCount() }}`, ...).
  readonly total = computed(() => this.tasks().length);
  readonly pendingCount = computed(() => this.tasks().filter((t) => t.status === 'pending').length);
  readonly inProgressCount = computed(
    () => this.tasks().filter((t) => t.status === 'in-progress').length,
  );
  readonly completedCount = computed(
    () => this.tasks().filter((t) => t.status === 'completed').length,
  );

  ngOnInit(): void {
    this.fetchTasks();
  }

  /**
   * Carga la lista de tareas desde `TaskService`. Este método se dispara
   * desde la plantilla mediante *event binding* en el botón "Reintentar"
   * (`(pressed)="fetchTasks()"` en `task-list.html`), donde `pressed` es un
   * `output()` personalizado del componente `Button` (ver [[button.ts]]).
   */
  fetchTasks(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.taskService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tasks) => this.tasks.set(tasks),
        error: () => this.loadError.set('No se pudieron cargar las tareas. Verifica que el servidor esté disponible.'),
      });
  }

  /**
   * Invocado por *event binding* desde `task-list.html`
   * (`(pressed)="openCreateForm()"` en el botón "Nueva tarea"). Abre el
   * modal `TaskForm` en modo creación estableciendo `editingTask` a `null`,
   * valor que `TaskForm` recibe por *property binding* (`[task]="editingTask()"`)
   * y usa para decidir si arranca vacío o precargado.
   */
  openCreateForm(): void {
    this.editingTask.set(null);
    this.formError.set(null);
    this.isFormOpen.set(true);
  }

  /**
   * Manejador de un evento personalizado de `TaskItem`: en la plantilla se
   * enlaza como `(edit)="openEditForm($event)"`. `TaskItem` emite la tarea
   * completa a través de su `output<Task>() edit` (ver [[task-item.ts]]), y
   * `$event` aquí es exactamente el `Task` emitido. Es el mecanismo estándar
   * de *event binding* para comunicación hijo → padre en Angular.
   */
  openEditForm(task: Task): void {
    this.editingTask.set(task);
    this.formError.set(null);
    this.isFormOpen.set(true);
  }

  /**
   * Se enlaza como `(close)="closeForm()"` al `output<void>() close` de
   * `TaskForm`, que se dispara al pulsar "Cancelar", la "X", el fondo del
   * modal o la tecla Escape (ver `@HostListener` en [[task-form.ts]]).
   */
  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingTask.set(null);
    this.formError.set(null);
  }

  /**
   * Se enlaza como `(save)="handleSave($event)"` al `output<CreateTaskPayload>()
   * save` de `TaskForm`. `$event` es el valor tipado del formulario reactivo
   * emitido en `onSubmit()` ([[task-form.ts]]). Aquí decide, según si hay una
   * tarea en edición, si delega en `TaskService.create` o `TaskService.update`
   * (dependencia inyectada arriba).
   */
  handleSave(payload: CreateTaskPayload): void {
    const editing = this.editingTask();
    this.saving.set(true);
    this.formError.set(null);

    const request = editing
      ? this.taskService.update(editing._id, payload)
      : this.taskService.create(payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (savedTask) => {
        this.tasks.update((current) =>
          editing
            ? current.map((t) => (t._id === savedTask._id ? savedTask : t))
            : [savedTask, ...current],
        );
        this.closeForm();
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(err.error?.message ?? 'Ocurrió un error al guardar la tarea.');
      },
    });
  }

  /**
   * Se enlaza como `(remove)="handleDelete($event)"` al `output<Task>()
   * remove` de `TaskItem`. Mientras la petición está en curso, añade el id
   * de la tarea a `processingIds`, signal que `TaskItem` recibe por
   * *property binding* (`[processing]="processingIds().has(task._id)"`) para
   * deshabilitar sus botones de acción durante el borrado.
   */
  handleDelete(task: Task): void {
    this.processingIds.update((ids) => new Set(ids).add(task._id));

    this.taskService
      .delete(task._id)
      .pipe(
        finalize(() =>
          this.processingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(task._id);
            return next;
          }),
        ),
      )
      .subscribe({
        next: () => this.tasks.update((current) => current.filter((t) => t._id !== task._id)),
        error: () => this.loadError.set('No se pudo eliminar la tarea. Intenta nuevamente.'),
      });
  }
}
