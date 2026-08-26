import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm' | 'icon';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  // Property bindings de entrada: cada consumidor (`task-list.html`,
  // `task-item.html`, `task-form.html`) los fija con atributos como
  // `variant="primary"` o `[disabled]="processing()"`. Todos tienen valor
  // por defecto, por lo que son opcionales para quien use `<app-button>`.
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);

  /**
   * Event binding de salida: este botón es un componente de presentación
   * reutilizable que no conoce la lógica de negocio de quien lo usa. Emite
   * un evento genérico `pressed` (en vez de un método propio como
   * "guardar" o "eliminar") para que cada padre decida, vía
   * `(pressed)="loQueSea()"`, qué acción ejecutar.
   */
  readonly pressed = output<Event>();

  /** Enlazado en `button.html` como `(click)="handleClick($event)"`; reenvía el clic como `pressed` solo si el botón no está deshabilitado. */
  handleClick(event: Event): void {
    if (this.disabled()) {
      return;
    }
    this.pressed.emit(event);
  }
}
