import { Pool as PgPool, type PoolClient, type QueryResultRow } from 'pg';

class Pool {
    #pool: PgPool | null = null;

    async connect(options: any) {
        this.#pool = new PgPool(options);

        const client = await this.#pool.connect();
        await this.#checkDbExists(client, options.database);
        client.release();
    }

    async #checkDbExists(client: PoolClient, database: string) {
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

    async query<T extends QueryResultRow>(sql: string, params: any[] = []) {
        if (this.#pool) {
            return this.#pool.query<T>(sql, params);
        }
        throw Error("Cap'n I cannae query withoot a pool");
    }
}

export default new Pool();