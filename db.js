var mongoose = require('mongoose');

console.log(process.env.DB);
mongoose.connect(
  process.env.DB,
  { useNewUrlParser: true },
  err => {
    if (err) {
      return console.log(err);
    }
    console.log('connected to db');
  }
);
