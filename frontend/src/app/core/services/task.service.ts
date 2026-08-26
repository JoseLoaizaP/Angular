import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTaskPayload, Task, UpdateTaskPayload } from '../models/task.model';

/**
 * Servicio de acceso a datos para el recurso "Task".
 *
 * Inyección de dependencias: `@Injectable({ providedIn: 'root' })` registra
 * este servicio en el inyector raíz de la aplicación, lo que lo convierte en
 * un singleton compartido por todos los componentes que lo soliciten y
 * permite que el compilador lo elimine del bundle (tree-shaking) si nunca se
 * usa. Gracias a la DI, ningún componente instancia `TaskService` con `new`
 * ni conoce cómo se construye: solo declara que lo necesita y Angular se lo
 * entrega ya resuelto. Esto desacopla los componentes (`TaskList`, etc.) de
 * los detalles de HTTP y hace que el servicio sea sustituible por un mock en
 * pruebas unitarias sin tocar el código de los componentes.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  /**
   * `HttpClient` se obtiene con la función `inject()` en lugar de recibirlo
   * por constructor. Es la misma inyección de dependencias basada en el
   * inyector jerárquico de Angular, solo que con la API funcional
   * introducida a partir de Angular 14+: Angular resuelve la dependencia
   * consultando el árbol de inyectores (este servicio -> raíz) y entrega la
   * instancia singleton configurada por `provideHttpClient()` en
   * `app.config.ts`.
   */
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/list`;

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  getById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateTaskPayload): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<Task> {
    return this.http.delete<Task>(`${this.baseUrl}/${id}`);
  }
}
