import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Surf Rental Mar del Plata API',
      version: '1.0.0',
      description: 'API REST para la plataforma de alquiler de tablas de surf en Mar del Plata. Soporta roles Consumer, Owner y Agencia.',
      contact: {
        name: 'Soporte Surf Rental MDP',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Servidor local / desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.swagger.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
