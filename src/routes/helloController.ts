import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GetHelloRequest } from '../../types';

export default async function helloController(fastify: FastifyInstance) {
    fastify.get('/hello', async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.send({ hello: 'world' });
    });

    fastify.get<{
        Params: GetHelloRequest;
    }>('/hello/:name', async (request: FastifyRequest, reply: FastifyReply) => {
        let params = request.params as GetHelloRequest;

        return reply.send({ params: params });
    });
}
