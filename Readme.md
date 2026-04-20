A little exercise in creating a Node.js REST API to a PostgreSQL DB with Instagram-ish data. It's tested with fake integration tests written in Jest that illustrate problems in parallel testing.

# Local dev
* Node.js from https://nodejs.org/en/download/
* `npm install` to install dependencies
* Set the DATABASE_URL env var, e.g. `set DATABASE_URL=postgres://USERNAME:PASSWORD@localhost:5432/dbname` on Windows CMD
* Run migrations `npm run migrate up`
* Setup your Postgres config in `index.js`
* Run server at `localhost:3005` with `npm start`

# Testing
Annoyingly you can't programmatically run node-pg-migrate as the runner doesn't support ES modules yet. Have to do test migrations by hand (see below).

* Run migrations `npm run migrate -- up --schema test --create-schema` and same for `test2`, and `test3`
* Set the DATABASE_URL env var, e.g. `set DATABASE_URL=postgres://USERNAME:PASSWORD@localhost:5432/testdbname` on Windows CMD
* Setup your Postgres config in `setupTestDb.js`
* npm test

NB `--no-cache` Jest option is used to slow down test startup, making parallel race conditions reliably reproducible (before tests are isolated with schemas).
