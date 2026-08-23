import { Component, computed, input } from '@angular/core';
import { TaskStatus, TASK_STATUSES } from '../../../core/models/task.model';

@Component({
  selector: 'app-status-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class StatusBadge {
  readonly status = input.required<TaskStatus>();

  readonly label = computed(
    () => TASK_STATUSES.find((s) => s.value === this.status())?.label ?? this.status(),
  );
}
