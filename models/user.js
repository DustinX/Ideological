var mongoose = require('mongoose');
//no we must provide passport local mongoose
var passportLocalMongoose = require('passport-local-mongoose');


//set up the user schema
var userSchema = new mongoose.Schema({
  username: String,
  password: String
});

//This line makes sure userschema makes use of passport local mongoose
userSchema.plugin(passportLocalMongoose);

//export the model
module.exports = mongoose.model('User', userSchema);
