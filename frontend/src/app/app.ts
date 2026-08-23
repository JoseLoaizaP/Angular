import { Component, signal } from '@angular/core';
import { TaskList } from './features/task-list/task-list';

@Component({
  selector: 'app-root',
  imports: [TaskList],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Flowlist');
}
