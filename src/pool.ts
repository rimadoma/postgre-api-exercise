import { Pool as PgPool } from 'pg';

class Pool {
    #pool: PgPool;

    async connect(options) {
        this.#pool = new PgPool(options);

        const client = await this.#pool.connect();
        await this.#checkDbExists(client, options.database);
        client.release();
    }

    async #checkDbExists(client, database) {
        const { rows } = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [database]
        );

        if (rows.length === 0) {
            throw new Error(`Database "${database}" does not exist`);
        }
    }

    async close() {
        if (this.#pool) {
            await this.#pool.end();
        }
    }

    async query<T>(sql: string, params: any[] = []) {
        return this.#pool.query(sql, params);
    }
}

export default new Pool();