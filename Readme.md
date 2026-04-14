A little exercise in creating a Node.js REST API to a PostgreSQL DB with Instagram like data and testing that with parallel tests in Jest.

# Local dev
* Node.js from https://nodejs.org/en/download/
* `npm install node-pg-migrate pg` for PostGres migrations
* `npm install express` for Web server (express) in index.js
* Set the DATABASE_URL env var, e.g. `set DATABASE_URL=postgres://USERNAME:PASSWORD@localhost:5432/dbname` on Windows CMD
* Run migrations `npm run migrate up`
* Setup your Postgres config in `index.js`
* Run server at `localhost:3005` with `npm dev` -- uses `nodemon` so the server automatically restarts when changes are detected

# Testing
* `npm install supertest`
* Set the DATABASE_URL env var, e.g. `set DATABASE_URL=postgres://USERNAME:PASSWORD@localhost:5432/testdbname` on Windows CMD
* Run migrations for your separate testdb `npm run migrate up`
* Setup your Postgres config in the test .js files
* npm test
