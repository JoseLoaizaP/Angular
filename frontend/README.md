# Frontend — Flowlist

Aplicación Angular (standalone components, sin `NgModule`) para gestionar una lista de tareas ("Flowlist"). Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) versión 22.1.3.

## Estructura del proyecto

```
src/
├── app/
│   ├── app.ts / app.html / app.scss   → Componente raíz <app-root>
│   ├── app.config.ts                  → Providers de la app (DI raíz, router, HTTP, locale)
│   ├── app.routes.ts                  → Definición de rutas (actualmente vacía)
│   │
│   ├── core/                          → Capa transversal: modelos y acceso a datos
│   │   ├── models/task.model.ts       → Tipos `Task`, `TaskStatus`, payloads de creación/edición
│   │   └── services/task.service.ts   → `TaskService`: llamadas HTTP al backend (CRUD de tareas)
│   │
│   ├── features/                      → Componentes de dominio (lógica de negocio de "tareas")
│   │   ├── task-list/                 → `TaskList`: contenedor principal, orquesta todo
│   │   ├── task-item/                 → `TaskItem`: una fila de la tabla de tareas
│   │   └── task-form/                 → `TaskForm`: modal de creación/edición (formulario reactivo)
│   │
│   └── shared/ui/                     → Componentes de presentación reutilizables, sin lógica de negocio
│       ├── badge/                     → `StatusBadge`: etiqueta visual de estado
│       └── button/                    → `Button`: botón genérico con variantes
│
├── environments/                      → Configuración por entorno (`apiUrl`, etc.)
└── styles.scss                        → Estilos globales
```

La organización sigue una separación clásica en tres capas:

- **`core`**: qué es una tarea y cómo se habla con el backend. No conoce Angular templates ni UI.
- **`features`**: componentes "inteligentes" (smart components) que conocen el dominio (tareas), mantienen estado y coordinan servicios.
- **`shared/ui`**: componentes "tontos" (presentational/dumb components) que no saben qué es una "tarea"; solo reciben datos y emiten eventos genéricos, y por tanto son reutilizables en cualquier contexto.

## Relación entre componentes

```
App (app-root)
└── TaskList (app-task-list)                 — inyecta TaskService
    ├── Button "Nueva tarea"                 (app-button)
    ├── TaskItem *ngFor por cada tarea       (app-task-item)
    │   ├── StatusBadge                      (app-status-badge)
    │   └── Button "editar" / "eliminar" ×2  (app-button)
    └── TaskForm (modal, visible con @if)    (app-task-form)  — inyecta FormBuilder
        └── Button "cancelar" / "guardar" ×2 (app-button)
```

- **`App`** es el shell de la aplicación; solo renderiza `<app-task-list>`.
- **`TaskList`** es el componente contenedor: pide las tareas a `TaskService`, mantiene el estado de la pantalla (carga, error, formulario abierto, tarea en edición) y decide cuándo mostrar `TaskForm`.
- **`TaskItem`** representa una tarea individual; no llama al backend directamente, sino que delega en `TaskList` mediante eventos (`edit`, `remove`).
- **`TaskForm`** encapsula el formulario reactivo de alta/edición y solo comunica hacia afuera el resultado (`save`, `close`).
- **`Button`** y **`StatusBadge`** son piezas de UI puras, reutilizadas por los tres componentes de `features` sin duplicar HTML/CSS ni lógica.

Esta relación siempre fluye en el mismo sentido: los datos bajan de padre a hijo (`TaskList → TaskItem/TaskForm → Button/StatusBadge`) y los eventos suben de hijo a padre. Ningún componente hijo conoce ni referencia a su padre, lo que permite reutilizarlos y testearlos de forma aislada.

## Inyección de dependencias (DI)

El proyecto usa el sistema de inyección de dependencias de Angular con la API funcional `inject()` (en vez de recibir dependencias por constructor), tanto en servicios como en componentes:

| Dónde | Qué se inyecta | Con qué se registra |
|---|---|---|
| `core/services/task.service.ts` | `HttpClient` | `provideHttpClient(withFetch())` en `app.config.ts` |
| `features/task-list/task-list.ts` | `TaskService` | `@Injectable({ providedIn: 'root' })` en el propio servicio |
| `features/task-form/task-form.ts` | `FormBuilder` | Provisto por `ReactiveFormsModule` |

**¿Por qué se usa DI en este proyecto?**

1. **Desacoplar componentes de la implementación de HTTP.** `TaskList` no sabe si `TaskService` usa `HttpClient`, `fetch` nativo o datos simulados; solo depende de la interfaz pública del servicio (`getAll`, `create`, `update`, `delete`). Esto significa que la capa de presentación no cambia si mañana cambia la forma de hablar con el backend.
2. **Instancia única y compartida (singleton).** `providedIn: 'root'` hace que exista una sola instancia de `TaskService` en toda la app, evitando estados duplicados o múltiples clientes HTTP.
3. **Configuración centralizada.** `app.config.ts` es el único lugar donde se decide *cómo* se construye `HttpClient` (con `withFetch()`) o cuál es el `LOCALE_ID`; el resto del código simplemente inyecta el resultado ya configurado.
4. **Testabilidad.** Al depender de abstracciones inyectadas (`TaskService`, `FormBuilder`) en lugar de instanciarlas con `new`, es trivial sustituirlas por dobles de prueba (mocks/stubs) en tests unitarios sin tocar el componente.
5. **Menos código repetitivo.** `FormBuilder` evita construir a mano cada `FormControl`/`FormGroup`, y se obtiene igual que cualquier otro servicio, mediante el mismo mecanismo de DI.

## Data binding utilizado

La aplicación usa los cuatro tipos de databinding de Angular. A continuación se explica dónde aparece cada uno y por qué se eligió sobre las alternativas.

### 1. Interpolación (`{{ valor }}`)

Se usa para volcar texto derivado de signals directamente en el HTML, por ejemplo:

- `task-list.html`: `{{ loadError() }}`, `{{ total() }}`, `{{ pendingCount() }}`.
- `task-item.html`: `{{ task().title }}`, `{{ task().updatedAt | date: "d MMM, HH:mm" }}`.
- `task-form.html`: `{{ heading() }}`, `{{ saving() ? 'Guardando…' : ... }}`.
- `badge.html`: `{{ label() }}`.

**Por qué:** es la forma más simple y legible de mostrar datos de solo lectura en la plantilla. Al usar *signals* (`signal`, `computed`) en vez de propiedades planas, la interpolación se re-evalúa automáticamente cuando cambia el dato, sin disparar detección de cambios manual.

### 2. Property binding (`[propiedad]="expresión"`)

Se usa para pasar datos de un componente padre a un hijo, o para vincular atributos/propiedades del DOM a estado del componente:

- `task-list.html` → `task-item.html`: `[task]="task"`, `[processing]="processingIds().has(task._id)"`.
- `task-list.html` → `task-form.html`: `[task]="editingTask()"`, `[saving]="saving()"`, `[errorMessage]="formError()"`.
- `task-item.html` → `badge.html`: `[status]="task().status"`.
- `button.html`: `[class]="'btn--' + variant() + ' btn--' + size()"`, `[disabled]="disabled()"`, `[attr.aria-label]="ariaLabel()"`.
- `task-item.ts`: host binding `'[class.task-row--processing]': 'processing()'`.

Estas propiedades se declaran en TypeScript con la función `input()` (por ejemplo en `task-item.ts`, `task-form.ts`, `button.ts`, `badge.ts`).

**Por qué:** es el mecanismo estándar de Angular para comunicación padre → hijo con flujo de datos unidireccional y explícito. Usar `input()`/`input.required()` en vez de `@Input()` clásico da además tipado estricto y, al tratarse de signals, integra la entrada directamente con `computed()` sin pasos intermedios.

### 3. Event binding (`(evento)="metodo($event)"`)

Se usa para que un hijo notifique a su padre que algo ocurrió, o para reaccionar a eventos nativos del DOM:

- `task-list.html`: `(pressed)="openCreateForm()"`, `(edit)="openEditForm($event)"`, `(remove)="handleDelete($event)"`, `(save)="handleSave($event)"`, `(close)="closeForm()"`.
- `task-item.html`: `(pressed)="onEdit()"`, `(pressed)="onRemove()"`.
- `task-form.html`: `(click)="onBackdropClick()"`, `(ngSubmit)="onSubmit()"`.
- `button.html`: `(click)="handleClick($event)"`.
- `task-form.ts`: `@HostListener('document:keydown.escape')` para cerrar el modal con la tecla Escape.

Estas salidas se declaran con la función `output()` (`edit`, `remove`, `save`, `close`, `pressed`).

**Por qué:** permite que los componentes hijos (`Button`, `TaskItem`, `TaskForm`) sean genéricos y reutilizables: `Button` no sabe si al pulsarlo se debe "guardar", "eliminar" o "abrir un modal"; simplemente emite `pressed` y delega la decisión en quien lo use. Esto evita acoplar componentes de UI a la lógica de negocio concreta.

### 4. Binding bidireccional (two-way data binding)

En vez de la sintaxis "banana en caja" `[(ngModel)]`, el formulario de `task-form.ts` usa **Reactive Forms**: `[formGroup]="form"` en el `<form>` y `formControlName="title"` (también `description`, `status`) en cada campo. El dato fluye en ambos sentidos:

- **Modelo → Vista:** `this.form.patchValue({...})` en `ngOnInit()` precarga los campos cuando se edita una tarea existente.
- **Vista → Modelo:** cada tecla o selección del usuario actualiza automáticamente `form.value`, que luego se lee en `onSubmit()` con `form.getRawValue()`.

**Por qué Reactive Forms y no `ngModel`:** se necesitan validaciones declarativas y combinables (`Validators.required`, `minLength`, `maxLength`), lectura síncrona del estado de validación (`form.controls.title.invalid`, `.touched`) para mostrar errores en la plantilla, y una definición del formulario centralizada y tipada (mediante `FormBuilder`, inyectado por DI). Este enfoque escala mejor que `ngModel` a medida que crecen las reglas de validación del formulario.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
