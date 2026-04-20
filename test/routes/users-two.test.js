import createApp from '../../src/app.js';
import userRepo from '../../src/repos/userRepository.js';
import { setupTestDb } from '../helpers/setupTestDb.js';

setupTestDb('test2');

it('creates a user', async () => {
    const beforeCount = await userRepo.count();

    const app = createApp();
    const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: { username: 'test', bio: 'stuff' },
    });
    expect(response.statusCode).toBe(200);

    const afterCount = await userRepo.count();
    expect(afterCount).toEqual(beforeCount + 1);
});