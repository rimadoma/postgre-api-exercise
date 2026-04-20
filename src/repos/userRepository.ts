import pool from '../pool.js';
import { keysToCamelCase } from './repoHelpers.js';
import type User from '../models/user.js';



class UserRepository {
    #tableName = "users";

    async find() {
        const { rows } = await pool.query<User>(`SELECT * FROM ${this.#tableName}`);

        return rows.map((row: User) => keysToCamelCase(row));
    }

    async findById(id: number) {
        const { rows } = await pool.query<User>(`SELECT * FROM ${this.#tableName} WHERE id=$1;`, [id]);

        return rows.map((row: User) => keysToCamelCase(row))[0];
    }

    async insert(username: string, bio: string) {
        const { rows } = await pool.query<User>(`INSERT INTO ${this.#tableName} (username, bio) VALUES ($1, $2) RETURNING *;`, [username, bio]);

        return rows.map((row: User) => keysToCamelCase(row))[0];
    }

    async update(id: number, username: string, bio: string) {
        const { rows } = await pool.query<User>(`UPDATE ${this.#tableName} SET username=$1, bio=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *;`, [username, bio, id]);

        return rows.map((row: User) => keysToCamelCase(row))[0];
    }

    async delete(id: number) {
        const { rows } = await pool.query<User>(`DELETE FROM ${this.#tableName} WHERE id=$1 RETURNING *;`, [id]);

        return rows.map((row: User) => keysToCamelCase(row))[0];
    }

    async count() {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM ${this.#tableName}`);

        return parseInt(rows[0].count); 
    }
}

export default new UserRepository();
