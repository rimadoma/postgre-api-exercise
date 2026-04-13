import pool from '../pool.js';
import { keysToCamelCase } from './repoHelpers.js';

class UserRepository {
    #tableName = "users";

    async find() {
        const { rows } = await pool.query(`SELECT * FROM ${this.#tableName}`);

        return rows.map(row => keysToCamelCase(row));
    }

    async findById(id) {
        const { rows } = await pool.query(`SELECT * FROM ${this.#tableName} WHERE id=$1`, [id]);

        return rows.map(row => keysToCamelCase(row))[0];
    }

    async insert(userData) {

    }

    async update(id, userData) {

    }

    async delete(id) {

    }
}

export default new UserRepository();
