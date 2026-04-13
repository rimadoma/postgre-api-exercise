import express, { json } from 'express';
import usersRouter from './routes/users.js';

export default function createApp() {
    const app = express();

    // parse request body to json
    app.use(json());
    app.use(usersRouter);

    return app;
}