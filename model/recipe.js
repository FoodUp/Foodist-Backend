const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TimeSchema = new mongoose.Schema(
    {
        amount: {
            required: true,
            type: Number
        },
        unit: {
            required: true,
            type: String,
            enum: ['min'],
            default: 'min'
        }
    },
    { _id: false }
);

const Ingredients = {
    name: {
        type: String,
        required: true
    },
    category: String
};

const IngredientsSchema = new mongoose.Schema(Ingredients, {
    timestamps: true
});

const RecipeStepSchema = new mongoose.Schema(
    {
        image: String,
        description: {
            type: String,
            required: true
        }
    },
    { _id: false }
);

const Recipe = {
    name: {
        type: String,
        required: true
    },
    description: String,
    person: Number,
    time: TimeSchema,
    tag: [String],
    type: String,
    image: String,
    tool: [{ _id: false, name: String, quantity: String }],
    ingredients: {
        type: [
            {
                _id: false,
                id: {
                    type: Schema.Types.ObjectId,
                    ref: 'Ingredients'
                },
                amount: Number,
                unit: String
            }
        ],
        required: true
    },
    steps: {
        type: [RecipeStepSchema],
        required: true
    },
    color: {
        type: String,
        required: true
    }
};

const RecipeSchema = new mongoose.Schema(Recipe, { timestamps: true });

const IngredientsModel = mongoose.model('Ingredients', IngredientsSchema);
const RecipeModel = mongoose.model('Recipes', RecipeSchema);

module.exports = {
    IngredientsModel,
    RecipeModel
};
