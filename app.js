//*******************************************************************************************************
//                                                 SETUP
//*******************************************************************************************************
//Express
var express = require('express');
var app = express();

//async
var async = require('async');

//request
var request = require('request');

//mongoose
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/ideological");

//schedule
//used to pull data from API's every 1 hour for start
var every = require('schedule').every;

//Body-parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

//Passport
var passport = require('passport');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');

//Models
var Article = require('./models/article');
var User = require('./models/user');

//Method-override
var methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.use(express.static('public'));

//Unfluff
var extractor = require('unfluff');

//*******************************************************************************************************
//                                        CONFIGURE PASSPORT
//*******************************************************************************************************
app.use(require('express-session')({
  secret: "ideological is a great site to weed out fake news",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
//User._____ comes from passportLocalMongoose
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// every('3s').do(function(){
//   //find the articles that currently have showcase set to true
//   Article.find({"showcase":"True"}, function(err, showcaseArticles) {
//     if(err) {
//       console.log("Error finding the showcase articles");
//       console.log(err);
//     } else {
//       //check to see if showcaseArticles is not empty -> if so, continue to set new showcase articles. if not, set the showcase of the current articles to false then continue
//       if(showcaseArticles.length != 0) {
//         showcaseArticles.forEach(function(article){
//           var articleId = article._id;
//           Article.findByIdAndUpdate(articleId, {showcase: "False"}, function(err, updatedArticle){
//             if(err) {
//               console.log("Error updating the showcase field on the article with id: " + articleId);
//               console.log(err);
//             } //else do nothing
//           })
//         });
//       }//ends if

//       //now it's time to set random articles shwocase field as True
//       Article.count().exec(function(err, count) {
//         if(err) {
//           console.log("Error finding the count of the articles in the MongoDB");
//           console.log(err);
//         } else {
//           for(var i=0; i<7; i++) {
//             //get a random number within the range
//             var randomNum = Math.floor(Math.random() * count);
            
//             //find a random article
//             Article.findOne().skip(randomNum).exec(function(err, randomArticle){
//               if(err) {
//                 console.log("Error finding random article");
//                 console.log(err);
//               } else {
//                 //random article is found. set the showcase value to true
//                 var articleId = randomArticle._id;
//                 Article.findByIdAndUpdate(articleId, {showcase: "True"}, function(err, updatedRandomArticle){
//                   if(err) {
//                     console.log("Error setting the showcase field for the article with id: " + articleId);
//                     console.log(err);
//                   } // else do nothing
//                 })
//               }
//             })
//           }
//         }
//       }) 
//     }
//   })
// });

//Makes sure all routes are able to see currentUser object
  //this is done by putting the var currentUser inside of res.locals
//again, this is a middleware, so we need to say next() in order for it to work correctly
//app.use calls this function on every route
app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  next();
});
//*******************************************************************************************************
//                                        SCHEDULED MONGODB LOAD
//*******************************************************************************************************
// every('5s').do(function(){
//   var sourceNames = ['al-jazeera-english','associated-press','bbc-news','bloomberg','breitbart-news','business-insider','cnn','google-news','independent','techcrunch','the-huffington-post','the-verge','the-new-york-times','time','the-wall-street-journal','the-washington-post','national-geographic','daily-mail'];
//   var apis = [];
//   for (var i = 0; i < sourceNames.length; i++) {
//     apis[i] = " https://newsapi.org/v1/articles?source="+sourceNames[i]+"&apiKey=14748e642d924db294e082aad37b715f"
//   }

//   async.each(apis, function(api, callback){
//     request(api, function(error, response, body){
//       if(error) {
//         console.log(error);
//       } else {
//         var info = JSON.parse(body);
//         var articleSource = info["source"];

//        info["articles"].forEach(function(article){

//             Article.find({"title": article.title}, function(err, foundArticle){
//               if(err) {
//                 console.log(err);
//               }

//               if(foundArticle == null) {
//                 console.log(article.title);
//                 console.log("found");
//                 //Don't add he article to the db
//               } else {
//                 //Set up vars to be used to create the article object
//                 var author = article.author;
//                 var title = article.title;
//                 var description = article.description;
//                 var url = article.url;
//                 var urlToImage = article.urlToImage;
//                 var publishedAt = article.publishedAt;
//                 var source = setSourceImage(articleSource);
//                 var truthRating = 0;
//                 var biasRatingArr = [];
//                 var biasRating = "_";
//                 var totalFeedback = 0;
//                 var showcase = "False";

//                 //Create an article object to be passed to the mongoose create api
//                 var newArticle = {
//                   author: author,
//                   title: title,
//                   description: description,
//                   url: url,
//                   urlToImage: urlToImage,
//                   publishedAt: publishedAt,
//                   source: source,
//                   truthRating: truthRating,
//                   biasRatingArr: biasRatingArr,
//                   biasRating: biasRating,
//                   totalFeedback: totalFeedback,
//                   showcase: showcase
//                 }

//                 //Create the article
//                 Article.create(newArticle, function(err, createdArticle){
//                    if(err) {
//                      console.log(err);
//                    } else {
//                      console.log(createdArticle);
//                    }
//                 });
//               }
//             });
//        });// ends forEach

//      }//ends else no error
//    }); //ends request
//  }); //ends async call
// });//ends every call








//*******************************************************************************************************
//                                                 ROUTES
//*******************************************************************************************************
app.get('/', function(req, res) {
//now find the topArticles
Article.find({showcase: "True"}, function(err, showcaseArticles) {
  if(err) {
    console.log("Error finding the showcaseArticles for the first load");
    console.log(err);
  } else {
    Article.find({}, function(err, topArticles) {
      if(err) {
        console.log("Can't find top articles");
        console.log(err);
      } else {
        res.render("pages/index", {allData: showcaseArticles,topArticles: topArticles});
      }
    }).sort('-truthrating').limit(8);
  }
})

});

app.get('/rate/:id', function(req, res){
    res.redirect('/');
});

app.put('/rate/:id', isLoggedIn, function(req, res){
    //get the id
    var articleId = req.params.id;

    //get the updatedData
    var updatedData = req.body;

    //get the review data
    var updatedValidity = updatedData.validity;
    var updatedBias = updatedData.bias;


     Article.findByIdAndUpdate(articleId, {$inc: {totalFeedback: 1, truthRating: updatedValidity}, $push: {biasRatingArr: updatedBias}}, function(err, updatedArticleMetrics){
       if(err) {
         console.log(err);
       } else {
         console.log(updatedArticleMetrics);
         findArticleAndUpdateBias(articleId);
        //  var returnableData = {
        //    totalFeedback: updatedArticleMetrics.totalFeedback;
        //    truthRating: updatedArticleMetrics.truthRating;
        //    biasRating: updatedArticleMetrics.biasRating;
        //  };
        //  var JSONdata = JSON.stringify(returnableData);
         res.redirect('/');
       }
     });
});


//get the article html body and parse
app.post('/:id/read/', function(req, res){
  //get the article id
  var articleId = req.params.id;
  var articleURL = req.body.articleURL;
  var articleTitle = "";

  //setup the fetch object
  const fetchURL = require('fetch').fetchUrl;

  //get the article title and send back to the front end
  Article.findById(articleId, function(err, foundArticle) {
    if(err) {
      console.log("Error finding the article with id: "+articleId);
      console.log(err);
    } else {
      articleTitle = foundArticle.title;
    }
  })

  fetchURL(articleURL, (error, meta, body) => {
    if(error) {
      return console.log('Error', error.message || error);
    }

    console.log('META INFO');
    console.log(meta);

    console.log('BODY');
    var bodyData = extractor(body.toString('utf-8'));
    console.log(bodyData);

    res.send({body:bodyData.text, title: articleTitle});
  });

});


//Auth ROUTES

//show login form
app.get('/login', function(req, res){
  res.render('pages/login');
});

//Login will submit to this route
//passport middleware is used to manage login logic
//takes strategy, successRedirect, and failureRedirect
//app,post('route', middleware, function)
//the authenticate method will call the authenticate we set up above
app.post('/login',passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'}) , function(req, res){

});

//show registration form
app.get('/register', function(req, res){
  res.render('pages/register');
});

//Sign Up form will submit to this route
app.post('/register', function(req, res){
  //provided by passport-local-mongoose
  var newUser = new User({username: req.body.username});
  var userPass = req.body.password;
  //User.register takes 2 params
    //1: the username
    //2: the password. However, it stores this as a hash instead of the string literal
  User.register(newUser, userPass, function(err, user){
    if(err){
      console.log(err);
      //if there is an error, the return pulls out of the code loop and redirects them back to register
      return res.render('pages/register');
    }
    //passport.authenticate logs the user in and redirects them to home
    passport.authenticate('local')(req, res, function(){
        res.redirect('/');
    });
  })
});


//logout route
app.get('/logout', function(req, res){
  //The logout function comes from passport
  req.logout();
  res.redirect('/');
});

//*******************************************************************************************************
//                                              FUNCTIONS
//*******************************************************************************************************

//logged in middleware
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}


function setSourceImage(source) {
  if(source == "al-jazeera-english"){
    return 'https://besticon-demo.herokuapp.com/icon?url=http://www.aljazeera.com&size=70..120..200';
  } else if(source == "associated-press") {
    return "https://besticon-demo.herokuapp.com/icon?url=https://apnews.com/&size=70..120..200";
  } else if(source == "bbc-news") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.bbc.co.uk/news&size=70..120..200";
  } else if(source == "bloomberg") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.bloomberg.com&size=70..120..200";
  } else if(source == "breitbart-news") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.breitbart.com&size=70..120..200";
  } else if(source == "business-insider") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.businessinsider.com&size=70..120..200";
  } else if(source == "cnn") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://us.cnn.com&size=70..120..200";
  } else if(source == "google-news") {
    return "https://besticon-demo.herokuapp.com/icon?url=https://news.google.com&size=70..120..200";
  } else if(source == "independent") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.independent.co.uk&size=70..120..200";
  } else if(source == "techcrunch") {
    return "https://besticon-demo.herokuapp.com/icon?url=https://techcrunch.cn&size=70..120..200";
  } else if(source == "the-huffington-post") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.huffingtonpost.com&size=70..120..200";
  } else if(source == "the-verge") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.theverge.com&size=70..120..200";
  } else if(source == "the-new-york-times") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.nytimes.com&size=70..120..200";
  } else if(source == "time") {
    return "https://besticon-demo.herokuapp.com/icon?url=http://time.com&size=70..120..200";
  } else if(source == "the-wall-street-journal"){
    return "https://besticon-demo.herokuapp.com/icon?url=http://www.wsj.com&size=70..120..200";
  }
}


function findArticleAndUpdateBias(articleId) {
  Article.findById(articleId, function(err, foundArticle){
    if(err) {
      console.log(err);
    } else{
      setBiasMode(foundArticle);
    }
  });
}

function setBiasMode(foundArticle) {
  if(foundArticle['biasRatingArr'].length != 0) {
    var freq = [0,0,0];

    for (var i = 0; i < foundArticle.biasRatingArr.length; i++) {
      if(foundArticle.biasRatingArr[i] == 0) {
        freq[0]++;
      } else if(foundArticle.biasRatingArr[i] == 1){
        freq[1]++;
      } else if(foundArticle.biasRatingArr[i] == 2){
        freq[2]++;
      }
    }

    var mode = 0;
    for (var i = 0; i < freq.length; i++) {
      if(freq[i] > freq[mode]){
        mode = i;
      }
    }
  } else {
    mode = null;
    if(mode == null) {
      Article.findByIdAndUpdate(foundArticle._id, {biasRating: "__"}, function(err, updatedArticleWithDefaultBias){
        if(err) {
          console.log(err);
        } else {
          console.log("Default");
          console.log(updatedArticleWithDefaultBias);
        }
      });
    }
  }

  if(mode == 0) {
    Article.findByIdAndUpdate(foundArticle._id, {biasRating: "None/NA"}, function(err, updatedArticleWithNoBias){
      if(err) {
        console.log(err);
      } else {
        console.log("Default");
        console.log(updatedArticleWithNoBias);
      }
    });
  } else if(mode == 1) {
    Article.findByIdAndUpdate(foundArticle._id, {biasRating: "Liberal"}, function(err, updatedArticleWithLibBias){
      if(err) {
        console.log(err);
      } else {
        console.log("Lib");
        console.log(updatedArticleWithLibBias);
      }
    });
  } else if(mode == 2){
    Article.findByIdAndUpdate(foundArticle._id, {biasRating: "Conservative"}, function(err, updatedArticleWithConsBias){
      if(err) {
        console.log(err);
      }else {
        console.log("Cons");
        console.log(updatedArticleWithConsBias);
      }
    });
  }
}//ends function

//*******************************************************************************************************
//                                                   SERVER
//*******************************************************************************************************
app.listen(3030, function(){
  console.log("News Server Is Running!");
});
