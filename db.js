var mongoose = require('mongoose');

mongoose.connect(
  'mongodb://localhost:27017/foodist',
  { useNewUrlParser: true },
  err => {
    if (err) {
      return console.log(err);
    }
    console.log('connected to db');
  }
);
