import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';

registerLocaleData(localeEs);

/**
 * Configuración raíz de inyección de dependencias de la aplicación
 * (arquitectura standalone, sin `NgModule`). Cada entrada de `providers`
 * registra en el inyector raíz un servicio o valor que luego puede
 * obtenerse en cualquier punto del árbol con `inject()`:
 *
 * - `provideHttpClient(withFetch())`: registra el `HttpClient` que
 *   [[task.service.ts]] consume vía `inject(HttpClient)`. Se centraliza
 *   aquí para poder cambiar su configuración (p. ej. usar `fetch` en vez
 *   de `XMLHttpRequest`) sin tocar los servicios que lo usan.
 * - `provideRouter(routes)`: registra el `Router` de Angular.
 * - `{ provide: LOCALE_ID, useValue: 'es' }`: sustituye el valor por
 *   defecto de `LOCALE_ID` para que pipes como `DatePipe` (usado en
 *   [[task-item.ts]]) formateen fechas en español sin que cada componente
 *   tenga que indicarlo.
 *
 * Este patrón (proveer en un único lugar y dejar que los consumidores
 * inyecten la abstracción) es lo que permite sustituir implementaciones
 * (por ejemplo, en tests) sin modificar el código que las usa.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    { provide: LOCALE_ID, useValue: 'es' }
  ]
};
