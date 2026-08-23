import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Task } from '../../core/models/task.model';
import { Button } from '../../shared/ui/button/button';
import { StatusBadge } from '../../shared/ui/badge/badge';

@Component({
  selector: 'app-task-item',
  imports: [Button, StatusBadge, DatePipe],
  templateUrl: './task-item.html',
  styleUrl: './task-item.scss',
  host: {
    class: 'task-row',
    role: 'row',
    '[class.task-row--processing]': 'processing()',
  },
})
export class TaskItem {
  readonly task = input.required<Task>();
  readonly processing = input(false);

  readonly edit = output<Task>();
  readonly remove = output<Task>();

  onEdit(): void {
    this.edit.emit(this.task());
  }

  onRemove(): void {
    this.remove.emit(this.task());
  }
}
