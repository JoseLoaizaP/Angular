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
    // Host property binding: equivale a poner [class.task-row--processing]
    // directamente en la etiqueta <app-task-item></app-task-item> desde el
    // padre, pero declarado aquí para que sea el propio componente quien
    // controle el estilo de su elemento raíz según su estado interno.
    '[class.task-row--processing]': 'processing()',
  },
})
export class TaskItem {
  /**
   * Property binding de entrada obligatoria: `TaskList` lo alimenta con
   * `[task]="task"` en `task-list.html`. Al ser `input.required`, Angular
   * falla en tiempo de compilación si algún consumidor olvida pasarlo.
   */
  readonly task = input.required<Task>();
  /** Property binding opcional: `[processing]="processingIds().has(task._id)"`. */
  readonly processing = input(false);

  /** Event binding de salida: el padre escucha con `(edit)="openEditForm($event)"`. */
  readonly edit = output<Task>();
  /** Event binding de salida: el padre escucha con `(remove)="handleDelete($event)"`. */
  readonly remove = output<Task>();

  /** Disparado por `(pressed)="onEdit()"` en el botón de editar de la plantilla. */
  onEdit(): void {
    this.edit.emit(this.task());
  }

  /** Disparado por `(pressed)="onRemove()"` en el botón de eliminar de la plantilla. */
  onRemove(): void {
    this.remove.emit(this.task());
  }
}
