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
  private readonly fb = inject(FormBuilder);

  readonly task = input<Task | null>(null);
  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly save = output<CreateTaskPayload>();
  readonly close = output<void>();

  readonly statuses = TASK_STATUSES;
  readonly isEditMode = computed(() => this.task() !== null);
  readonly heading = computed(() => (this.isEditMode() ? 'Editar tarea' : 'Nueva tarea'));

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    status: ['pending' as Task['status'], [Validators.required]],
  });

  ngOnInit(): void {
    const current = this.task();
    if (current) {
      this.form.patchValue({
        title: current.title,
        description: current.description,
        status: current.status,
      });
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }
}
