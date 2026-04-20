import userRepo from '../repos/userRepository.js'

async function usersRoutes(fastify, _) {
    fastify.get('/users', async (_request, _reqply) => {
        return userRepo.find();
    });

    fastify.get('/users/:id', async (request, reply) => {
        const { id } = request.params;

        const user = await userRepo.findById(id);

        if (!user) return reply.code(404).send();
        return user;
    });

    fastify.post('/users', async (request, _reply) => {
        const { username, bio } = request.body;

        return userRepo.insert(username, bio);
    });

    fastify.put('/users/:id', async (request, reply) => {
        const { id } = request.params;
        const { username, bio } = request.body;

        const user = await userRepo.update(id, username, bio);

        if (!user) return reply.code(404).send();
        return user;
    });

    fastify.delete('/users/:id', async (request, reply) => {
        const { id } = request.params;

        const user = await userRepo.delete(id);

        if (!user) return reply.code(404).send();
        return user;
    });
}

export default usersRoutes;