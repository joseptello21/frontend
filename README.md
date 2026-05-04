# Frontend IoT Management System

Sistema de gestión IoT para dispositivos, sensores, luminarias y usuarios.

## Despliegue en Railway

### Configuración automática
1. Conecta tu repositorio de GitHub a Railway
2. Railway detectará automáticamente la configuración desde `railway.toml` y `package.json`
3. El comando de inicio será: `npm run railway:start`

### Variables de entorno (opcional)
Si necesitas cambiar la URL de la API backend:
- `API_URL`: URL de tu API backend (por defecto usa la configurada en environment.prod.ts)

### Comandos disponibles
- `npm start`: Desarrollo local
- `npm run build`: Construir para producción
- `npm run serve:prod`: Construir y servir archivos estáticos
- `npm run railway:start`: Comando usado por Railway

### URL de producción
Una vez desplegado, Railway te dará una URL como:
`https://frontend-production-xxxx.up.railway.app`

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
