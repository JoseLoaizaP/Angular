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
  private readonly taskService = inject(TaskService);

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly isFormOpen = signal(false);
  readonly editingTask = signal<Task | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly processingIds = signal<ReadonlySet<string>>(new Set());

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

  openCreateForm(): void {
    this.editingTask.set(null);
    this.formError.set(null);
    this.isFormOpen.set(true);
  }

  openEditForm(task: Task): void {
    this.editingTask.set(task);
    this.formError.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingTask.set(null);
    this.formError.set(null);
  }

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
