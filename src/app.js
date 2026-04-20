import Fastify from 'fastify';
import usersRoutes from './routes/users.js';

export default function createApp() {
    const fastify = Fastify();
    fastify.register(usersRoutes);
    return fastify;
}