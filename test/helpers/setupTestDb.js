import pool from '../../src/pool.js';

export function setupTestDb(schema = 'test') {
    beforeAll(() => {
        return pool.connect({
            host: 'localhost',
            port: 5432,
            database: 'socialnetwork-test',
            user: 'postgres',
            password: 'mypassword',
            options: `--search_path=${schema}`
        });
    });

    beforeEach(() => {
        pool.query(`DELETE FROM users`);
    });

    afterAll(() => {
        return pool.close();
    });
}
