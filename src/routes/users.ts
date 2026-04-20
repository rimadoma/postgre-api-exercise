import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import userRepo from '../repos/userRepository.js'

interface UserBody {
    username: string;
    bio: string;
}

// TODO Add JSON schemas for id
async function usersRoutes(fastify : FastifyInstance, _) {
    fastify.get('/users', async (_request, _reply) => {
        return userRepo.find();
    });

    fastify.get('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const id = parseInt(request.params.id);

        const user = await userRepo.findById(id);

        if (!user) return reply.code(404).send();
        return user;
    });

    fastify.post('/users', async (request: FastifyRequest<{ Body: UserBody }>, _reply) => {
        const { username, bio } = request.body;

        return userRepo.insert(username, bio);
    });

    fastify.put('/users/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: UserBody }>, reply: FastifyReply) => {
        const id = parseInt(request.params.id);
        const { username, bio } = request.body;

        const user = await userRepo.update(id, username, bio);

        if (!user) return reply.code(404).send();
        return user;
    });

    fastify.delete('/users/:id', async (request, reply: FastifyReply<{ Params: { id: string } }>) => {
        const id = parseInt(request.params.id);

        const user = await userRepo.delete(id);

        if (!user) return reply.code(404).send();
        return user;
    });
}

export default usersRoutes;