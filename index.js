require('dotenv').config();
const url = require('url');
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

const Port = process.env.PORT;
const server = Hapi.server({
  port: Port,
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
function patchRecipeImagePath(r) {
  if (typeof r.image !== 'undefined') {
    r.image = new url.URL(
      path.join(process.env.RECIPE_IMAGE_PUBLIC_PATH, r.image),
      `${process.env.FRONT_URL}:${process.env.PORT}`
    ).href;
  }
  return r;
}
//get all reipes
server.route({
  method: 'Get',
  path: '/recipes',
  handler: request => {
    return RecipeModel.find().then(rcps =>
      rcps.map(r => patchRecipeImagePath(r))
    );
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
      if (!rslt) {
        return h.response('recipe not found').code(404);
      } else {
        return patchRecipeImagePath(rslt);
      }
    } catch (err) {
      console.log(err);
      return h.response(err.message).code(404);
    }
  }
});
// search recipe by term
server.route({
  method: 'Get',
  path: '/recipes/search',
  handler: async (request, h) => {
    try {
      const { term } = request.query;
      if (term) {
      } else {
        return h.response([]);
      }
      request.logger.info('seerch handler', request.path);
      return RecipeModel.find({ $text: { $search: term } }).then(rcps =>
        rcps.map(r => patchRecipeImagePath(r))
      );
    } catch (err) {
      return h.response(err.message).code(500);
    }
  }
});
// get recipe image url by filename
server.route({
  method: 'Get',
  path: path.join(process.env.RECIPE_IMAGE_PUBLIC_PATH, '/{imageName}'),
  handler: (request, h) => {
    return h.file(
      path.join(process.env.RECIPE_IMAGE_LOCAL_PATH, request.params.imageName)
    );
  }
});
// post a recipe
server.route({
  method: 'Post',
  path: '/recipes',
  handler: async (request, h) => {
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
  console.log(`server has started at: ${Port}`);
}

process.on('unhandledRejection', err => {
  console.log(err);
});

init();
