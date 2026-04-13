import pool from '../pool.js';
import { keysToCamelCase } from './repoHelpers.js';

class UserRepository {
    #tableName = "users";

    async find() {
        const { rows } = await pool.query(`SELECT * FROM ${this.#tableName}`);

        return rows.map(row => keysToCamelCase(row));
    }

    async findById(id) {
        const { rows } = await pool.query(`SELECT * FROM ${this.#tableName} WHERE id=$1;`, [id]);

        return rows.map(row => keysToCamelCase(row))[0];
    }

    async insert(username, bio) {
        const { rows } = await pool.query(`INSERT INTO ${this.#tableName} (username, bio) VALUES ($1, $2) RETURNING *;`, [username, bio]);

        return rows.map(row => keysToCamelCase(row))[0];
    }

    async update(id, username, bio) {
        const { rows } = await pool.query(`UPDATE ${this.#tableName} SET username=$1, bio=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *;`, [username, bio, id]);

        return rows.map(row => keysToCamelCase(row))[0];
    }

    async delete(id) {
        const { rows } = await pool.query(`DELETE FROM ${this.#tableName} WHERE id=$1 RETURNING *;`, [id]);

        return rows.map(row => keysToCamelCase(row))[0];
    }
}

export default new UserRepository();
