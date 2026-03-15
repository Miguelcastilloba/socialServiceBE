const express = require('express');
const cors = require('cors');
const { randomUUID } = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  studentId: '',
  degree: '',
  major: '',
  group: '',
  bloodType: ''
};

const sessions = new Map();
const credentials = new Map();
const userCredentialMap = new Map();
const cardSideByCredential = new Map();

const loginMessages = [
  'Inicio de sesión exitoso. Bienvenido al panel del alumno.',
  'Acceso correcto. Puedes registrar o consultar tu credencial.',
  'Sesión iniciada. Continúa con el flujo de credencial digital.'
];

const statusPool = ['Activo', 'Inactivo'];

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createDisplayValues(form) {
  const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim();

  return {
    displayName: fullName || 'Nombre y apellido',
    displayId: form.studentId?.trim() || 'Matrícula del alumno',
    displayDegree: form.degree?.trim() || 'Grado',
    displayGroup: form.group?.trim() || 'Grupo',
    displayMajor: form.major?.trim() || 'Carrera',
    displayBlood: form.bloodType?.trim() || 'Tipo de sangre'
  };
}

function getSessionToken(req) {
  return req.header('x-session-token') || req.header('authorization')?.replace('Bearer ', '');
}

function getSession(req) {
  const token = getSessionToken(req);
  if (!token) {
    return null;
  }

  return sessions.get(token) || null;
}

app.get('/api', (_req, res) => {
  res.json({
    service: 'socialServiceBE',
    message: 'Backend in-memory para flujo de credencial digital',
    endpoints: {
      login: 'POST /api/auth/login',
      home: 'GET /api/home',
      createCredential: 'POST /api/credentials',
      getCredential: 'GET /api/credentials/:id',
      flipCredential: 'POST /api/credentials/:id/flip',
      resetCredential: 'POST /api/credentials/:id/reset'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      error: 'username y password son obligatorios'
    });
  }

  const token = randomUUID();
  const user = {
    username: String(username).trim(),
    loggedAt: new Date().toISOString()
  };

  sessions.set(token, user);

  const credentialId = userCredentialMap.get(user.username) || null;

  return res.json({
    token,
    user,
    message: pickRandom(loginMessages),
    credentialId,
    nextScreen: 'home'
  });
});

app.get('/api/home', (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Sesión inválida o ausente' });
  }

  const credentialId = userCredentialMap.get(session.username) || null;
  const credential = credentialId ? credentials.get(credentialId) : null;

  return res.json({
    screen: 'home',
    hasCredential: Boolean(credential),
    credential: credential || null
  });
});

app.post('/api/credentials', (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Debes iniciar sesión primero' });
  }

  const payload = req.body || {};
  const form = {
    ...INITIAL_FORM,
    firstName: payload.firstName || '',
    lastName: payload.lastName || '',
    studentId: payload.studentId || '',
    degree: payload.degree || '',
    major: payload.major || '',
    group: payload.group || '',
    bloodType: payload.bloodType || ''
  };

  const credentialId = randomUUID();
  const status = pickRandom(statusPool);

  const credential = {
    id: credentialId,
    ...form,
    photoUri: payload.photoUri || null,
    status,
    issuedAt: new Date().toISOString(),
    owner: session.username,
    ...createDisplayValues(form)
  };

  credentials.set(credentialId, credential);
  userCredentialMap.set(session.username, credentialId);
  cardSideByCredential.set(credentialId, 'front');

  return res.status(201).json({
    message: 'Credencial creada correctamente',
    cardSide: 'front',
    credential
  });
});

app.get('/api/credentials/:id', (req, res) => {
  const credential = credentials.get(req.params.id);
  if (!credential) {
    return res.status(404).json({ error: 'Credencial no encontrada' });
  }

  return res.json({
    cardSide: cardSideByCredential.get(req.params.id) || 'front',
    credential
  });
});

app.post('/api/credentials/:id/flip', (req, res) => {
  const credential = credentials.get(req.params.id);
  if (!credential) {
    return res.status(404).json({ error: 'Credencial no encontrada' });
  }

  const currentSide = cardSideByCredential.get(req.params.id) || 'front';
  const nextSide = currentSide === 'front' ? 'back' : 'front';
  cardSideByCredential.set(req.params.id, nextSide);

  return res.json({
    cardSide: nextSide,
    rotation: nextSide === 'front' ? 0 : 180,
    credential
  });
});

app.post('/api/credentials/:id/reset', (req, res) => {
  const credential = credentials.get(req.params.id);
  if (!credential) {
    return res.status(404).json({ error: 'Credencial no encontrada' });
  }

  const resetCredential = {
    ...credential,
    ...INITIAL_FORM,
    photoUri: null,
    ...createDisplayValues(INITIAL_FORM)
  };

  credentials.set(req.params.id, resetCredential);
  cardSideByCredential.set(req.params.id, 'front');

  return res.json({
    message: 'Formulario de credencial reiniciado',
    cardSide: 'front',
    credential: resetCredential
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`socialServiceBE listening on http://localhost:${PORT}`);
});
