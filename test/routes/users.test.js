import request from "supertest";
import createApp from '../../src/app.js';
import userRepo from '../../src/repos/userRepository.js';
import pool from '../../src/pool.js';

beforeAll(() => {
    return pool.connect({
        host: 'localhost',
        port: 5432,
        database: 'socialnetwork',
        user: 'postgres',
        password: 'mypassword'
    });
});

it('creates a user', async () => {
    const beforeCount = await userRepo.count();
    expect(beforeCount).toEqual(0);

    await request(createApp())
        .post('/users')
        .send({ username: 'test', bio: 'stuff' })
        .expect(200);

    const afterCount = await userRepo.count();
    expect(afterCount).toEqual(1);
});