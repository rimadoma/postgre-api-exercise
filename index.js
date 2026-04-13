import app from './src/app.js';
import pool from './src/pool.js';

pool.connect({
    host: 'localhost',
    port: 5432,
    database: 'socialnetwork',
    user: 'postgres',
    password: 'mypassword'
}).then(() => {
    app().listen(3005, () => {
        console.log('Listening on port 3005');
    });
}).catch((err) => console.error(err));

