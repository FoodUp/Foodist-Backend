const fs = require('fs');
const Hapi = require('hapi');
const fp = require('lodash/fp');
const { Types } = require('mongoose');
const { ObjectId } = require('mongodb');
const path = require('path');

require('./db');
const { RecipeModel } = require('./model/recipe');

function savePublicImageFromBuffer(imageName, file) {
  //TODO: return error msg with image limit
  //TODO: check if dir exists
  console.log('check instance:', file instanceof fs.ReadStream);
  const imgPath = './image/recipes/' + imageName;
  const fileStream = fs.createWriteStream(imgPath);
  return new Promise((resolve, reject) => {
    file.on('error', function(err) {
      reject(err);
    });

    file.pipe(fileStream);

    file.on('end', function(err) {
      const fileDetails = {
        originalname: file.hapi.filename,
        filename: imageName,
        mimetype: file.hapi.headers['content-type'],
        destination: 'image/recipes',
        size: fs.statSync(imgPath).size
      };

      resolve(fileDetails);
    });
  });
  return;
}

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
//get all reipes
server.route({
  method: 'Get',
  path: '/recipes',
  handler: request => {
    // TODO: combine filename and image directory image/recipes
    return RecipeModel.find();
  }
});
// get recipe by id
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
// get recipe image url by filename
server.route({
  method: 'Get',
  path: '/recipe/image/{imageName}',
  handler: (request, h) => {
    return h.file('./image/recipes/' + request.params.imageName);
  }
});
// post a recipe
server.route({
  method: 'Post',
  path: '/recipes',
  handler: async (request, h) => {
    console.log(request.payload);
    try {
      const recipe = await RecipeModel.create(request.payload);
      return recipe;
    } catch (err) {
      console.log(err.message);
      return h.response(err.message).code(400);
    }
  }
});
// post a recipe image, recipeid required
server.route({
  method: 'Post',
  path: '/recipes/{id}/image',
  config: {
    payload: {
      output: 'stream',
      maxBytes: 4194304
    }
  },
  handler: async (request, h) => {
    // check if id exists in db
    console.log('request recipe id: ', request.params.id);
    const recipeId = request.params.id;
    const recipe = await RecipeModel.findOne({ _id: recipeId });
    if (!recipe) {
      return h.response('recipe not found').code(404);
    }

    // save image to disk
    const file = request.payload.image;
    const ext = path.extname(file.hapi.filename);
    const imageName = new ObjectId() + ext;
    const fileDetails = await savePublicImageFromBuffer(
      imageName,
      request.payload.image
    );
    console.log('saved file:', fileDetails);
    // update recipe with image path
    recipe.image = imageName;
    await recipe.save();
    return {
      status: 'success',
      content: recipe.image
    };
  }
});
// TODO: delete a recipe by id
// TODO: update a recipe online field
// TODO: update a recipe description...

async function init() {
  await server.register({
    plugin: require('hapi-pino'),
    options: {
      prettyPrint: true,
      logEvents: ['response']
    }
  });
  await server.register(require('inert'));
  await server.start();
  console.log(`server has started at: ${Host}:${Port}`);
}

process.on('unhandledRejection', err => {
  console.log(err);
});

init();
