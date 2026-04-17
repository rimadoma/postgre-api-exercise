# Refactoring from Express to Fastify

This document walks through a step-by-step plan for replacing Express with
[Fastify](https://fastify.dev) in this project. Each step explains *why* a
change is needed, not just *what* to change, so you can build a mental model
that carries over to future work.

---

## 1. Background: What Is Fastify?

Fastify is a Node.js web framework — the same category of tool as Express. Both
do the same basic job: they receive HTTP requests, route them to the right
handler function, and send back responses. The key differences are:

| | Express | Fastify |
|---|---|---|
| JSON body parsing | Opt-in middleware (`express.json()`) | Built-in, always on |
| Request validation | Not included | Built-in via JSON Schema |
| Performance | Good | Faster (benchmarks ~2× Express) |
| Async error handling | Manual `try/catch` or wrapper libs | Automatic — thrown errors become HTTP 500 |
| Plugin system | Middleware chain (`app.use`) | Encapsulated plugin tree |
| Testing | External tool (supertest) | Built-in `inject()` helper |

For this project the migration is small because the app is simple: one router,
five routes, no custom middleware beyond JSON parsing. That makes it a great
learning case — there is not much to distract from the structural differences.

---

## 2. Core Fastify Concepts You Need First

### 2.1 The Instance

In Express you call `express()` and get back an `app`. In Fastify you call
`Fastify()` (capital F, it is a constructor-like function) and get back a
`fastify` instance. The instance is both the server *and* the router — there is
no separate `Router` class.

```js
import Fastify from 'fastify';
const fastify = Fastify();
```

### 2.2 JSON Is Always On

Express requires you to add `app.use(express.json())` before any route can read
`req.body`. Fastify parses JSON request bodies by default — no setup required.
Similarly, when you `reply.send(someObject)`, Fastify serializes it to JSON
automatically.

### 2.3 Plugins Instead of Middleware

Express uses `app.use(fn)` to attach middleware or a sub-router to the
application. Fastify uses `fastify.register(plugin)` instead. A **plugin** is
just an async function with a specific signature:

```js
async function myPlugin(fastify, options) {
    fastify.get('/hello', async (request, reply) => {
        return { message: 'hello' };
    });
}

// Registering it:
fastify.register(myPlugin);
```

The reason Fastify uses a plugin tree instead of a flat middleware chain is
*encapsulation*: decorators, hooks, and schemas added inside a plugin are
scoped to that plugin and its children, and cannot accidentally bleed into the
rest of the application.

### 2.4 Async Handlers and `return`

In Fastify you can return a value from a route handler instead of calling
`reply.send()`:

```js
// These two are equivalent in Fastify:
fastify.get('/users', async (request, reply) => {
    return await userRepo.find();          // ← return value is sent as the response
});

fastify.get('/users', async (request, reply) => {
    reply.send(await userRepo.find());     // ← explicit send
});
```

Using `return` is the idiomatic Fastify style and is slightly cleaner.

### 2.5 The Lifecycle: `ready()` and `listen()`

Fastify registers plugins *asynchronously*. Before the server is ready to
accept connections, you must wait for all plugins to finish loading. Fastify
exposes two methods for this:

- `fastify.ready()` — resolves when all plugins are loaded; does **not** open
  a port. Used in tests.
- `fastify.listen({ port })` — calls `ready()` internally, then opens the port.
  Used in production.

This matters most for testing (see Section 6).

---

## 3. Dependencies

### 3.1 Install Fastify

```bash
npm install fastify
```

### 3.2 Remove Express

```bash
npm uninstall express
```

After this `package.json` should no longer list `express` under `dependencies`.

### 3.3 `supertest` (optional removal)

Fastify ships with a built-in HTTP injection helper called `fastify.inject()`
that does not open a real port. It is the recommended way to test Fastify apps
and removes the need for `supertest` entirely. The plan below migrates to
`inject()`, so you can also uninstall supertest:

```bash
npm uninstall supertest
```

If you prefer to keep `supertest` for now, Section 6.3 explains what extra
step is needed to make it work.

---

## 4. Refactoring `src/routes/users.js`

This is the most structurally interesting change, so we start here.

### 4.1 From Express Router to a Fastify Plugin

**Current Express code:**

```js
import { Router } from 'express';
import userRepo from '../repos/userRepository.js';

const router = Router();

router.get('/users', async (req, res) => {
    const users = await userRepo.find();
    res.send(users);
});
// ...more routes...

export default router;
```

Express `Router` is a mini-app you mount with `app.use()`. In Fastify the
equivalent pattern is an **async plugin function**. You do not need to
instantiate anything — the `fastify` instance is passed in by the framework
when the plugin is registered.

**Fastify equivalent:**

```js
import userRepo from '../repos/userRepository.js';

async function usersRoutes(fastify, options) {
    fastify.get('/users', async (request, reply) => {
        return userRepo.find();
    });
    // ...more routes...
}

export default usersRoutes;
```

Key things to notice:
- No import from Fastify needed inside this file.
- The function receives `fastify` as its first argument — this is how Fastify
  "injects" the scoped instance into every plugin.
- The second argument `options` is an object of any options passed via
  `fastify.register(usersRoutes, { ...options })`. We do not need it here.

### 4.2 Route-by-Route Translation

The request/response API is very similar to Express, with two naming
differences: `req` is conventionally called `request`, and `res` is called
`reply`. The properties (`request.params`, `request.body`) are the same.

**GET /users — list all**

```js
// Express
router.get('/users', async (req, res) => {
    const users = await userRepo.find();
    res.send(users);
});

// Fastify
fastify.get('/users', async (request, reply) => {
    return userRepo.find();
});
```

**GET /users/:id — find by id**

```js
// Express
router.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    const user = await userRepo.findById(id);
    user ? res.send(user) : res.sendStatus(404);
});

// Fastify
fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const user = await userRepo.findById(id);
    if (!user) return reply.code(404).send();
    return user;
});
```

`res.sendStatus(404)` in Express sets the status *and* sends a body with the
text "Not Found". In Fastify the equivalent is `reply.code(404).send()`.
`reply.code()` sets the status, and chaining `.send()` sends the response.

**POST /users — create**

```js
// Express
router.post('/users', async (req, res) => {
    const { username, bio } = req.body;
    const user = await userRepo.insert(username, bio);
    res.send(user);
});

// Fastify
fastify.post('/users', async (request, reply) => {
    const { username, bio } = request.body;
    return userRepo.insert(username, bio);
});
```

**PUT /users/:id — update**

```js
// Express
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, bio } = req.body;
    const user = await userRepo.update(id, username, bio);
    user ? res.send(user) : res.sendStatus(404);
});

// Fastify
fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const { username, bio } = request.body;
    const user = await userRepo.update(id, username, bio);
    if (!user) return reply.code(404).send();
    return user;
});
```

**DELETE /users/:id**

```js
// Express
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    const user = await userRepo.delete(id);
    user ? res.send(user) : res.sendStatus(404);
});

// Fastify
fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const user = await userRepo.delete(id);
    if (!user) return reply.code(404).send();
    return user;
});
```

### 4.3 Complete New File

```js
// src/routes/users.js
import userRepo from '../repos/userRepository.js';

async function usersRoutes(fastify, options) {
    fastify.get('/users', async (request, reply) => {
        return userRepo.find();
    });

    fastify.get('/users/:id', async (request, reply) => {
        const { id } = request.params;
        const user = await userRepo.findById(id);
        if (!user) return reply.code(404).send();
        return user;
    });

    fastify.post('/users', async (request, reply) => {
        const { username, bio } = request.body;
        return userRepo.insert(username, bio);
    });

    fastify.put('/users/:id', async (request, reply) => {
        const { id } = request.params;
        const { username, bio } = request.body;
        const user = await userRepo.update(id, username, bio);
        if (!user) return reply.code(404).send();
        return user;
    });

    fastify.delete('/users/:id', async (request, reply) => {
        const { id } = request.params;
        const user = await userRepo.delete(id);
        if (!user) return reply.code(404).send();
        return user;
    });
}

export default usersRoutes;
```

---

## 5. Refactoring `src/app.js`

**Current Express code:**

```js
import express, { json } from 'express';
import usersRouter from './routes/users.js';

export default function createApp() {
    const app = express();
    app.use(json());
    app.use(usersRouter);
    return app;
}
```

**Fastify equivalent:**

```js
import Fastify from 'fastify';
import usersRoutes from './routes/users.js';

export default function createApp() {
    const fastify = Fastify();
    fastify.register(usersRoutes);
    return fastify;
}
```

What changed:
- `express` → `Fastify` (default import from `'fastify'`).
- `app.use(json())` is removed — JSON parsing is built in.
- `app.use(usersRouter)` → `fastify.register(usersRoutes)` — this is how you
  mount a plugin.

The factory function pattern (`createApp()`) is preserved exactly because it is
still useful: every call returns a fresh, isolated Fastify instance, which is
exactly what the tests need.

---

## 6. Refactoring the Tests

This section is the most important departure from Express. The tests import
`createApp()` and make HTTP requests against it. The mechanism changes because
Fastify's lifecycle is asynchronous.

### 6.1 Why Supertest Does Not Plug In Directly

With Express, `createApp()` returns a fully synchronous object that supertest
can immediately start sending requests to:

```js
// Express — works because the app is synchronously ready
await request(createApp()).post('/users').send({...}).expect(200);
```

With Fastify, plugins are registered asynchronously. If you pass a Fastify
instance straight to supertest before calling `await app.ready()`, supertest
receives an instance that has not finished loading its routes yet, and the
requests will get 404 responses.

### 6.2 Recommended Approach: `fastify.inject()`

Fastify ships with a first-class testing helper called `inject()`. It simulates
an HTTP request internally without opening a real network port — faster, no
port conflicts, and no external dependency needed.

`inject()` calls `ready()` for you, so you do not need `beforeAll`.

**Example: migrating the "creates a user" test**

```js
// Before (Express + supertest)
import request from 'supertest';
import createApp from '../../src/app.js';
import userRepo from '../../src/repos/userRepository.js';
import { setupTestDb } from '../helpers/setupTestDb.js';

setupTestDb();

it('creates a user', async () => {
    const beforeCount = await userRepo.count();

    await request(createApp())
        .post('/users')
        .send({ username: 'test', bio: 'stuff' })
        .expect(200);

    const afterCount = await userRepo.count();
    expect(afterCount).toEqual(beforeCount + 1);
});
```

```js
// After (Fastify + inject)
import createApp from '../../src/app.js';
import userRepo from '../../src/repos/userRepository.js';
import { setupTestDb } from '../helpers/setupTestDb.js';

setupTestDb();

it('creates a user', async () => {
    const beforeCount = await userRepo.count();

    const app = createApp();
    const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'test', bio: 'stuff' },
    });
    expect(response.statusCode).toBe(200);

    const afterCount = await userRepo.count();
    expect(afterCount).toEqual(beforeCount + 1);
});
```

`app.inject()` returns a response object with:
- `response.statusCode` — the HTTP status code (note: not `.status` like in
  supertest)
- `response.json()` — parse the body as JSON
- `response.body` — the raw body string

### 6.3 Alternative: Keep Supertest

If you prefer to keep supertest for now, the fix is to call `await app.ready()`
before making requests, and then pass `app.server` (the underlying Node.js
`http.Server`) to supertest:

```js
const app = createApp();
await app.ready();

await request(app.server)
    .post('/users')
    .send({ username: 'test', bio: 'stuff' })
    .expect(200);

await app.close(); // important — release the server after the test
```

This works but requires a `beforeAll`/`afterAll` pair to manage the lifecycle
across tests in a file, making tests more verbose. The `inject()` approach is
simpler for unit/integration tests.

---

## 7. Refactoring `index.js`

**Current Express code:**

```js
import app from './src/app.js';
import pool from './src/pool.js';

pool.connect({ ... }).then(() => {
    app().listen(3005, () => {
        console.log('Listening on port 3005');
    });
});
```

In Express, `app.listen()` is synchronous (it returns immediately and fires a
callback when the port is open). In Fastify, `fastify.listen()` is
**asynchronous** — it returns a Promise that resolves when the server is
actually listening.

The existing code already uses `.then()`, so the change is straightforward:

```js
import createApp from './src/app.js';
import pool from './src/pool.js';

pool.connect({
    host: 'localhost',
    port: 5432,
    database: 'socialnetwork',
    user: 'postgres',
    password: 'mypassword'
}).then(async () => {
    const app = createApp();
    await app.listen({ port: 3005 });
    console.log('Listening on port 3005');
}).catch((err) => console.error(err));
```

Note that `fastify.listen()` logs the address itself by default, so the
`console.log` line is optional.

---

## 8. Step-by-Step Execution Order

Follow these steps in order to keep the app in a runnable state at each point:

1. **Install Fastify**
   ```bash
   npm install fastify
   ```

2. **Rewrite `src/routes/users.js`** (Section 4.3).
   At this point Express is still present; nothing will break yet.

3. **Rewrite `src/app.js`** (Section 5).
   The app now uses Fastify. `index.js` still calls `app().listen(...)` but
   that will fail because Fastify's `listen` API is different — do not run the
   server yet.

4. **Update `index.js`** (Section 7).
   The server should now start correctly:
   ```bash
   npm start
   ```
   Verify with `curl http://localhost:3005/users`.

5. **Migrate the tests** (Section 6).
   Update all three test files (`users.test.js`, `users-two.test.js`,
   `users-three.test.js`) to use `app.inject()`.
   ```bash
   npm test
   ```
   All tests should pass.

6. **Remove Express and supertest** (if using `inject()`):
   ```bash
   npm uninstall express supertest
   ```

---

## 9. What You Gain

- **Simpler app setup**: `app.use(json())` goes away; JSON is just on.
- **Cleaner async errors**: if a route handler throws an uncaught error, Fastify
  automatically returns a 500 JSON response. Express 4 would silently hang the
  request (Express 5, which this project uses, handles it too, but Fastify's
  behaviour is more explicit).
- **Built-in test helper**: `inject()` makes tests self-contained — no port
  management, no separate test HTTP client.
- **Schema validation** (future): Fastify can validate and document request
  bodies/params against a JSON Schema declared on the route. This is the main
  Fastify feature not explored here; it becomes valuable once the API has more
  complex inputs.
