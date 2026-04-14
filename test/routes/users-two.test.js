import request from "supertest";
import createApp from '../../src/app.js';
import userRepo from '../../src/repos/userRepository.js';
import { setupTestDb } from '../helpers/setupTestDb.js';

setupTestDb('test2');

it('creates a user', async () => {
    const beforeCount = await userRepo.count();

    await request(createApp())
        .post('/users')
        .send({ username: 'test', bio: 'stuff' })
        .expect(200);

    const afterCount = await userRepo.count();
    expect(afterCount).toEqual(beforeCount + 1);
});