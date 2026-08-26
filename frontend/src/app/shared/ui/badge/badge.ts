import { Component, computed, input } from '@angular/core';
import { TaskStatus, TASK_STATUSES } from '../../../core/models/task.model';

@Component({
  selector: 'app-status-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class StatusBadge {
  /**
   * Property binding de entrada: `TaskItem` lo enlaza con
   * `[status]="task().status"` en `task-item.html`. Al cambiar el signal
   * `status`, `label` y la clase CSS de `badge.html` se recalculan solos.
   */
  readonly status = input.required<TaskStatus>();

  /** Deriva la etiqueta legible a partir de `status()`; se consume por interpolación (`{{ label() }}`) en `badge.html`. */
  readonly label = computed(
    () => TASK_STATUSES.find((s) => s.value === this.status())?.label ?? this.status(),
  );
}
