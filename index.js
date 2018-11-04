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
  host: Host
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
  config: {
    cors: {
      origin: ['*']
    }
  },
  handler: (request, h) => {
    console.log(JSON.stringify(request.payload));
    //TODO: create Repipe from payload, and save to db
    // TODO: save image to disk
    // TODO: return
    return { a: 'value' };
    // return RecipeModel.create(request.payload);
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
