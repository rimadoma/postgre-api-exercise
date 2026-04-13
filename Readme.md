A little exercise Node.js REST API to a PostgreSQL DB with Instagram like data

# Local dev
* Node.js from https://nodejs.org/en/download/
* `npm install node-pg-migrate pg` for PostGres migrations
* `npm install express` for Web server (express) in index.js
* Setup your Postgres config in `index.js`
* Run server at `localhost:3005` with `npm dev` -- uses `nodemon` so the server automatically restarts when changes are detected

# Migrations
Set your DATABASE_URL environment variable, e.g. `set DATABASE_URL=postgres://USERNAME:PASSWORD@localhost:5432/dbname` on Windows CMD.

`npm run migrate up` - runs all migrations that haven't been applied yet, in filename order (note timestamps)
