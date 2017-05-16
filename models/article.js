var mongoose = require('mongoose');

//set up the schema
var articleSchema = new mongoose.Schema({
  author: String,
  title: String,
  description: String,
  url: String,
  urlToImage: String,
  publishedAt: String,
  source: String,
  truthRating: Number,
  biasRatingArr: [Number],
  biasRating: String,
  totalFeedback: Number
});


module.exports = mongoose.model("article", articleSchema);
