const mongoose = require('mongoose');

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

const RecipeStepSchema = new mongoose.Schema(
  {
    image: String,
    text: {
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
  tags: [String],
  type: String,
  image: String,
  tools: [{ _id: false, name: String, quantity: String }],
  ingredients: {
    type: [
      {
        _id: false,
        name: String,
        amount: String,
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
  },
  online: {
    type: Boolean,
    default: false
  }
};

const RecipeSchema = new mongoose.Schema(Recipe, { timestamps: true });

const RecipeModel = mongoose.model('Recipes', RecipeSchema);

module.exports = {
  RecipeModel
};
