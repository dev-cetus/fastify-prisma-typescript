// server.ts
// Cetus, <dev-cetus@proton.me>

import fastify, { FastifyInstance, FastifyListenOptions } from 'fastify';
import fastifyCors, { FastifyCorsOptions } from '@fastify/cors';
import fastifyJwt, { FastifyJWTOptions } from '@fastify/jwt';
import fastifyAutoload from '@fastify/autoload';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import path from 'node:path';
import { fileURLToPath } from 'url';

// Verify all environment variables are set
const requiredEnvVars = ['NODE_ENV', 'DATABASE_URL'];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is not set`);
    }
}

// Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { datetime: new Date() },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV === 'development') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple()
        })
    );
}

// Set __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup server
const server: FastifyInstance = fastify({
    logger: false
})
    .register(fastifyCors, {
        origin: [
            'localhost:3000',
            `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`,
            process.env.SITE_NAME || ''
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    } as FastifyCorsOptions)
    .register(fastifyJwt, {
        secret: process.env.JWT_SECRET || 'secret',
        sign: {
            algorithm: 'HS256',
            expiresIn: process.env.FASTIFY_JWT_EXPIRES_IN || '7d'
        },
        verify: {
            algorithms: ['HS256']
        }
    } as FastifyJWTOptions)
    .register(fastifyAutoload, {
        dir: path.join(__dirname, 'routes'),
        forceESM: true,
    });

// Prisma
const prisma = new PrismaClient();

// Run server
try {
    server.listen({
        host: process.env.SERVER_HOST || 'localhost',
        port: process.env.SERVER_PORT || 3000
    } as FastifyListenOptions)

    logger.info(
        `Server listening on http://${process.env.SERVER_HOST || 'localhost'}:${process.env.SERVER_PORT || 3000}`
    );
    if (process.env.NODE_ENV === 'production')
        console.log(
            `Server listening on http://${process.env.SERVER_HOST || 'localhost'}:${process.env.SERVER_PORT || 3000}`
        );
} catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') {
        logger.error(err);
    } else if (process.env.NODE_ENV === 'production') {
        console.error(err);
        logger.error(err);
    } else {
        console.error(err);
    }
    process.exit(1);
}

export { prisma, server, logger };