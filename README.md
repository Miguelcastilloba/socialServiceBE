# socialServiceBE

Backend en Node.js + Express para el flujo de credencial digital mostrado en tu FE de Expo.

## Qué incluye

- Inicio de sesión fake (acepta cualquier usuario/contraseña no vacíos).
- Estado en memoria (sin base de datos, sin APIs externas).
- Creación de credencial escolar.
- Estado aleatorio `Activo` / `Inactivo` generado por backend.
- Flip de credencial (`front`/`back`) desde backend.
- Reset de credencial.

## Instalar y ejecutar

```bash
npm install
npm start
```

Servidor por defecto: `http://localhost:3000`

## Endpoints (todos definidos en `index.js`)

### 1) Login
`POST /api/auth/login`

Body:

```json
{
  "username": "alumno1",
  "password": "123456"
}
```

Response:

```json
{
  "token": "...",
  "user": {
    "username": "alumno1",
    "loggedAt": "2026-01-01T10:00:00.000Z"
  },
  "message": "Acceso correcto. Puedes registrar o consultar tu credencial.",
  "credentialId": null,
  "nextScreen": "home"
}
```

### 2) Home
`GET /api/home`

Headers:

- `x-session-token: <token>`
  o
- `Authorization: Bearer <token>`

### 3) Crear credencial
`POST /api/credentials`

Headers: token de sesión.

Body:

```json
{
  "firstName": "Ana",
  "lastName": "Lopez",
  "studentId": "2024001",
  "degree": "5",
  "major": "Programación",
  "group": "A",
  "bloodType": "O+",
  "photoUri": "file:///image.jpg"
}
```

### 4) Consultar credencial
`GET /api/credentials/:id`

### 5) Cambiar vista (flip)
`POST /api/credentials/:id/flip`

### 6) Resetear credencial
`POST /api/credentials/:id/reset`

---

> Nota: Todo se guarda en memoria. Si reinicias el servidor, se pierde la información.
