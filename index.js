const fs = require('fs');
const Hapi = require('hapi');
const fp = require('lodash/fp');
const { Types } = require('mongoose');

require('./db');
const { RecipeModel } = require('./model/recipe');

const Port = 3001;
const Host = 'localhost';
const server = Hapi.server({
  port: Port,
  host: Host,
  routes: {
    cors: true
  }
});

server.route({
  method: 'Get',
  path: '/',
  handler: request => {
    request.logger.info('In handler %s', request.path);
    return 'hello hello';
  }
});

server.route({
  method: 'Get',
  path: '/recipes',
  handler: request => {
    return RecipeModel.find();
  }
});

server.route({
  method: 'Get',
  path: '/recipes/{id}',
  handler: async (request, h) => {
    try {
      request.logger.info('In handler %s', request.path);
      const rslt = await RecipeModel.findOne({ _id: request.params.id });
      return rslt || h.response('recipe not found').code(404);
    } catch (err) {
      console.log(err);
      return h.response(err.message).code(404);
    }
  }
});

server.route({
  method: 'Post',
  path: '/recipes',
  handler: async (request, h) => {
    console.log(typeof request.payload);
    try {
      const recipe = await RecipeModel.create(request.payload);
      return recipe;
    } catch (err) {
      console.log(err.message);
      return h.response(err.message).code(400);
    }
  }
});

server.route({
  method: 'Post',
  path: '/recipes/{id}/image',
  handler: async (request, h) => {
    // TODO: save image to disk
    console.log(request.params.id);
    return 'nice id';
  }
});

async function init() {
  await server.register({
    plugin: require('hapi-pino'),
    options: {
      prettyPrint: true,
      logEvents: ['response']
    }
  });
  await server.start();
  console.log(`server has started at: ${Host}:${Port}`);
}

process.on('unhandledRejection', err => {
  console.log(err);
});

init();
