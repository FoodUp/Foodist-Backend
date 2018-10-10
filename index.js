const Hapi = require('hapi');
const fp = require('lodash/fp');
const { Types } = require('mongoose');

require('./db');
const { RecipeModel, IngredientsModel } = require('./model/recipe');

const Port = 3000;
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
        request.logger.info('In handler %s', request.path);
        return RecipeModel.find().populate('ingredients.id');
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
        try {
            request.logger.info('In handler %s', request.path);
            const rslt = await saveRecipe(Recipe, Ingredients);
            return rslt;
        } catch (err) {
            console.log(err);
            return h.response(err.message).code(500);
        }
    }
});

const Recipe = {
    name: 'Coco Mango Cube',
    description: 'Refreshing dessert in summer day',
    person: 1,
    time: {
        amount: '20',
        unit: 'min'
    },
    tag: ['tropical'],
    type: 'dessert',
    image: '1.jpg',
    tool: [
        {
            name: 'Glass Box',
            quantity: 1
        }
    ],
    ingredients: [
        {
            id: 1,
            amount: 100,
            unit: 'ml'
        },
        {
            id: 2,
            amount: 1,
            unit: 'piece'
        },
        {
            id: 3,
            amount: 50,
            unit: 'ml'
        },
        {
            id: 4
        },
        {
            id: 5,
            amount: 200,
            unit: 'g'
        }
    ],
    steps: [
        {
            description: 'Get a fresh mango, cut it into little cube.'
        },
        {
            description:
                'Mix gelatine powder with water, boil it and stir to distribute the powder'
        },
        {
            description:
                'Add milk and coco cream into the liquide mixed ,add some surger or honey as you prefer.'
        },
        {
            description:
                'Pour the boiling coco milk into a glass container, put the mango cube in it. The mango would float slightly '
        },
        {
            description:
                'Leave it cool down and thenfreeze in the fridge for more than 2 hours. Be patient :)'
        },
        {
            description:
                'Take the box out of the fridge, cut the pudding into little cube. Enjoy this freshing dessert. '
        }
    ],
    color: '#EFD36E'
};

const Ingredients = {
    1: {
        name: 'Coco Cream'
    },
    2: {
        name: 'Fresh Mango',
        type: 'fruit'
    },
    3: {
        name: 'Milk',
        type: 'beverage'
    },
    4: {
        name: 'Suger'
    },
    5: {
        name: 'gelatine'
    },
    6: {
        name: 'Ripe banana',
        type: 'fruit'
    },
    7: {
        name: 'Ripe avocado',
        type: 'fruit'
    },
    8: {
        name: 'Yaourt'
    }
};

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

function keyObjectToArray(obj) {
    return fp.map(v => ({ ...obj[v], id: v }))(Object.keys(obj));
}

function saveIngredients(ingredients) {
    return IngredientsModel.insertMany(ingredients);
}

function replaceWithDatabaseId(
    ingredient,
    ingredientsArray,
    ingredientsDocuments
) {
    if (!Types.ObjectId.isValid(String(ingredient.id))) {
        const idx2 = fp.findIndex(val => val.id === String(ingredient.id))(
            ingredientsArray
        );
        if (idx2 !== -1) {
            ingredient.id = ingredientsDocuments[idx2]._id;
        } else {
            console.log('ingredients not found: ', ingredient);
        }
    }
}

async function saveRecipe(recipe, ingredients) {
    const ingredientsArray = keyObjectToArray(ingredients);
    const ingredientsDocuments = await saveIngredients(ingredientsArray);
    fp.forEach(v =>
        replaceWithDatabaseId(v, ingredientsArray, ingredientsDocuments)
    )(recipe.ingredients);
    return RecipeModel.create(recipe);
}

process.on('unhandledRejection', err => {
    console.log(err);
});

init();
