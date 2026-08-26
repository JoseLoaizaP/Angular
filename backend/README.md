# todo-backend

API REST para una lista de tareas (to-do list), construida con **Node.js**, **Express**, **TypeScript** y **Mongoose** (MongoDB).

## Requisitos

- Node.js
- Una instancia de MongoDB accesible (local o remota)

## Configuración

El servidor se configura mediante variables de entorno (archivo `.env` en la raíz del backend, cargado con `dotenv`):

| Variable       | Obligatoria | Descripción                                   |
|----------------|:-----------:|------------------------------------------------|
| `MONGODB_URI`  | Sí          | Cadena de conexión a MongoDB.                  |
| `PORT`         | No          | Puerto HTTP del servidor (por defecto `3000`). |

Si `MONGODB_URI` no está definida, el servidor no arranca y lanza un error explícito.

## Scripts

| Script              | Descripción                                                         |
|---------------------|----------------------------------------------------------------------|
| `npm run dev`        | Levanta el servidor en modo desarrollo con recarga automática (`nodemon` + `ts-node`). |
| `npm run build`      | Compila TypeScript a JavaScript en `dist/` (`tsc`).                  |
| `npm start`          | Ejecuta el build compilado (`dist/server.js`).                       |
| `npm test`           | Corre la suite de pruebas con Jest (`NODE_ENV=test`).                |
| `npm run test:watch` | Corre las pruebas en modo watch.                                     |

## Arquitectura

El proyecto sigue una **arquitectura en capas** clásica de un backend Express, con una separación estricta de responsabilidades entre entrada HTTP, lógica de negocio y acceso a datos:

```
Cliente HTTP
     │
     ▼
routes/            → define los endpoints y los asocia a un controlador
     │
     ▼
controllers/        → adapta Request/Response de Express, sin lógica de negocio
     │
     ▼
services/            → lógica de negocio y validaciones (capa central)
     │
     ▼
models/              → esquemas de Mongoose, acceso a MongoDB
```

Cada capa solo conoce a la inmediatamente inferior, lo que permite testear la lógica de negocio (`services`) sin depender de Express, y sustituir la capa HTTP sin tocar las reglas de negocio.

### Estructura de `src/`

```
src/
├── app.ts                     # Construye la instancia de Express (middlewares, rutas, manejo de errores)
├── server.ts                  # Punto de entrada: carga env vars, conecta a Mongo y arranca el servidor HTTP
├── config/
│   └── db.ts                  # Conexión/desconexión de Mongoose a MongoDB
├── routes/
│   └── task.routes.ts         # Definición de endpoints REST de tareas (montados en /list)
├── controllers/
│   └── task.controller.ts     # Traduce peticiones HTTP a llamadas al service de tareas
├── services/
│   └── task.service.ts        # Reglas de negocio: validaciones y operaciones CRUD sobre tareas
├── models/
│   └── task.model.ts          # Schema y modelo Mongoose de una tarea (Task)
├── middlewares/
│   └── errorHandler.ts        # Middleware de 404 y manejador de errores centralizado
└── utils/
    └── AppError.ts            # Clase de error de negocio con código HTTP asociado
```

### Flujo de una petición

1. **`server.ts`** es el punto de entrada del proceso: valida que exista `MONGODB_URI`, abre la conexión a MongoDB (`config/db.ts`) y, solo si tiene éxito, crea la app de Express (`app.ts`) y la pone a escuchar en `PORT`.
2. **`app.ts`** ensambla la aplicación Express: habilita CORS, parseo de JSON, expone `GET /health` como *health check*, monta las rutas de tareas bajo el prefijo `/list`, y registra al final el manejo de 404 y de errores.
3. **`routes/task.routes.ts`** mapea cada verbo/ruta HTTP a una función del controlador (sin lógica propia).
4. **`controllers/task.controller.ts`** recibe el `Request`, llama al service correspondiente, y responde con el `status` y JSON apropiados. Cualquier excepción se pasa a `next(error)` para que la resuelva el middleware de errores — los controladores nunca manejan errores directamente.
5. **`services/task.service.ts`** contiene toda la lógica de negocio: valida formato de `id` (ObjectId de Mongo), valida campos obligatorios y valores de `status`, y ejecuta las operaciones sobre el modelo `Task`. Cuando algo no es válido o no se encuentra, lanza un `AppError` con su código HTTP correspondiente (400 o 404).
6. **`models/task.model.ts`** define el schema de Mongoose (`title`, `description`, `status`, timestamps automáticos) y el enum `TaskStatus` (`pending`, `in-progress`, `completed`).
7. **`middlewares/errorHandler.ts`** es el punto único de manejo de errores: si el error es un `AppError` conocido, responde con su `statusCode` y mensaje; cualquier otro error se registra en consola y se responde con `500` genérico, evitando filtrar detalles internos al cliente.

### Manejo de errores

El proyecto centraliza los errores de negocio en la clase `AppError` (`utils/AppError.ts`), que extiende `Error` y añade un `statusCode`. Esto permite que:

- Los `services` lancen errores expresivos (`throw new AppError('mensaje', 400)`) sin acoplarse a Express.
- Los `controllers` no necesiten `try/catch` con lógica de respuesta: solo reenvían el error con `next(error)`.
- El `errorHandler` sea el único lugar que decide cómo se ve una respuesta de error, garantizando un formato consistente (`{ message: string }`) en toda la API.

## Endpoints

Todas las rutas de tareas están montadas bajo el prefijo `/list`.

| Método   | Ruta          | Descripción                                  | Body                                    |
|----------|---------------|-----------------------------------------------|------------------------------------------|
| `GET`    | `/health`     | Health check del servidor.                    | —                                        |
| `GET`    | `/list`       | Lista todas las tareas (más recientes primero).| —                                        |
| `GET`    | `/list/:id`   | Obtiene una tarea por id.                     | —                                        |
| `POST`   | `/list`       | Crea una tarea.                               | `{ title, description?, status? }`       |
| `PATCH`  | `/list/:id`   | Actualiza parcialmente una tarea.             | `{ title?, description?, status? }`      |
| `DELETE` | `/list/:id`   | Elimina una tarea y la devuelve.              | —                                        |

### Modelo de tarea

```ts
{
  title: string;        // obligatorio
  description: string;  // opcional, por defecto ''
  status: 'pending' | 'in-progress' | 'completed'; // por defecto 'pending'
  createdAt: Date;       // generado automáticamente
  updatedAt: Date;       // generado automáticamente
}
```

### Códigos de error

| Código | Cuándo ocurre                                                        |
|--------|------------------------------------------------------------------------|
| `400`  | Id con formato inválido, `title` vacío al crear, o `status` no permitido. |
| `404`  | Ruta no registrada, o tarea no encontrada por id.                      |
| `500`  | Error inesperado del servidor (no se expone el detalle al cliente).   |
