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
every('5s').do(function(){
  var sourceNames = ['al-jazeera-english','associated-press','bbc-news','bloomberg','breitbart-news','business-insider','cnn','google-news','independent','techcrunch','the-huffington-post','the-verge','the-new-york-times','time','the-wall-street-journal','the-washington-post','national-geographic','daily-mail'];
  var apis = [];
  for (var i = 0; i < sourceNames.length; i++) {
    apis[i] = " https://newsapi.org/v1/articles?source="+sourceNames[i]+"&apiKey=14748e642d924db294e082aad37b715f"
  }

  async.each(apis, function(api, callback){
    request(api, function(error, response, body){
      if(error) {
        console.log(error);
      } else {
        var info = JSON.parse(body);
        var articleSource = info["source"];

       info["articles"].forEach(function(article){

            Article.find({"title": article.title}, function(err, foundArticle){
              if(err) {
                console.log(err);
              }

              if(foundArticle == null) {
                console.log(article.title);
                console.log("found");
                //Don't add he article to the db
              } else {
                //Set up vars to be used to create the article object
                var author = article.author;
 		        var title = article.title;
                var description = article.description;
                var url = detectLogo(article.url);   //boogle
 		        var urlToImage = article.urlToImage;
                var publishedAt = article.publishedAt;
                var source = setSourceImage(articleSource);
                var truthRating = 0;
                var biasRatingArr = [];
                var biasRating = "_";
                var totalFeedback = 0;
                var showcase = "False";

                //Create an article object to be passed to the mongoose create api
                var newArticle = {
                  author: author,
                  title: title,
                  description: description,
                  url: url,
                  urlToImage: urlToImage,
                  publishedAt: publishedAt,
                  source: source,
                  truthRating: truthRating,
                  biasRatingArr: biasRatingArr,
                  biasRating: biasRating,
                  totalFeedback: totalFeedback,
                  showcase: showcase
                }

                //Create the article
                Article.create(newArticle, function(err, createdArticle){
                   if(err) {
                     console.log(err);
                   } else {
                     console.log(createdArticle);
                   }
                });
              }
            });
       });// ends forEach

     }//ends else no error
   }); //ends request
 }); //ends async call
});//ends every call








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
  console.log(req.body.articleURL);

  //setup the fetch object
  const fetchURL = require('fetch').fetchUrl;

  fetchURL(articleURL, (error, meta, body) => {
    if(error) {
      return console.log('Error', error.message || error);
    }

    console.log('META INFO');
    console.log(meta);

    console.log('BODY');
    var bodyData = extractor(body.toString('utf-8'));
    console.log(bodyData);

    res.send(bodyData);
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




//*******************************************************************************************************
//                                                   API
//*******************************************************************************************************
/*
function detectLogo(imgSource){

	fetch(imgSource)
	.then(res => res.blob()) // Gets the response and returns it as a blob
	.then(blob => {
		// Here's where you get access to the blob
		// And you can use it for whatever you want
		// Like calling ref().put(blob)

		// Here, I use it to make an image appear on the page
		let objectURL = URL.createObjectURL(blob);
		let myImage = new Image();
		myImage.src = objectURL;

		return myImage;
	}).then(myImage =>{


		function selectReadfile(myImage) {
			var reader = new FileReader();
			reader.readAsDataURL(myImage);
			reader.onload = function(){
				readDrawImg(reader, canvas, 0, 0);
			}
		}

		
		// draw image
		function readDrawImg(reader){
			var img = readImg(reader);
			img.onload = function(){
				var w = img.width;
				var h = img.height;
				var resize = resizeWidthHeight(320, w, h);
				fastSearch(canvas, resize.w, resize.h);
			}
		}

		// read image
		function readImg(reader){
			var result_dataURL = reader.result;
			var img = new Image();
			img.src = result_dataURL;
			return img;
		}

		// fast search
		function fastSearch(canvas, w, h){
			var context = canvas.getContext("2d");
			var img_data = context.getImageData(0, 0, w, h);
			var xhr = new XMLHttpRequest();
			var boundary = generateUuid();
			var group_id = document.forms.form1.group_id.value
			if (group_id == "") group_id = 0;
			xhr.open("POST" , "https://www3.arche.blue/mvp5/v1/" + group_id + "/fastSearch");
			console.log("https://www3.arche.blue/mvp5/v1/" + group_id + "/fastSearch");
			xhr.onload=function(){
				if (xhr.readyState === 4) {
				console.log( xhr.response );
				if (xhr.status === 200) {
					var data = JSON.parse(xhr.response);
					var div = document.getElementById("result1");
					div.textContent = JSON.stringify(data, null , "\t");
				} else if (xhr.status === 404) {
					var div = document.getElementById("result1");
					div.textContent = "404 The requested URL was not found on the server.\n It may be caused by inncorrect Group ID.\n Please check your Group ID in LOGIN/PROFILE page.";
				}
				}
			};
			xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary="+boundary);

			// part #1 headder
			var headder_str = "--" + boundary + "\r\n";
			headder_str += "Content-Disposition: form-data; name=\"image\"; filename=\"ArcheLiteImage.data\"\r\n";
			headder_str += "Content-Type: application/octet-stream\r\n";
			headder_str += "Content-Transfer-Encoding: binary\r\n\r\n";

			// mime footer
			var footer_str = "--" + boundary + "--\r\n";

			// part #1 data
			var data = new ArrayBuffer(headder_str.length + 16 + w * h + 2 + footer_str.length);
			var data_view = new DataView( data );
			var ptr = 0;

			for (var i = 0; i < headder_str.length; i++ ) {
				data_view.setUint8( i, headder_str.charCodeAt(i) );
			}
			ptr += headder_str.length;

			var mode = 1;
			var para = 0;
			var little_endian = true;
			data_view.setUint32( ptr + 0 , mode , little_endian );
			data_view.setUint32( ptr + 4 , para , little_endian );
			data_view.setUint32( ptr + 8 , h , little_endian );
			data_view.setUint32( ptr + 12 , w , little_endian );
			ptr += 16;

			for (var y = 0; y < h; y++) {
				for (var x = 0; x < w; x++) {
				var i = (y * w + x) * 4;
				var p = (img_data.data[i] + img_data.data[i+1] + img_data.data[i+2]) /3;
				data_view.setUint8( ptr + y * w + x , p );
				}
			}
			ptr += w * h;

			data_view.setUint8( ptr , "\r".charCodeAt(0) );
			data_view.setUint8( ptr + 1 , "\n".charCodeAt(0) );
			ptr += 2;

			for (var i = 0; i < footer_str.length; i++ ) {
				data_view.setUint8( ptr + i, footer_str.charCodeAt(i) );
			}

			xhr.send( data );
		}

	});
}
*/


/*


  (function() {
      var canvas = document.getElementById('mycanvas');
      window.onload = function(){
        if ( checkFileApi() && checkCanvas(canvas) ){
          // select file
          var file_image = document.getElementById('file-image');
          file_image.addEventListener('change', selectReadfile, false);
        }
      }
      // // check canvas support
      // function checkCanvas(canvas){
      //   if (canvas && canvas.getContext){
      //     return true;
      //   }
      //   alert('Not Supported Canvas.');
      //   return false;
      // }
      // // check FileAPI support
      // function checkFileApi() {
      //   // Check for the various File API support.
      //   if (window.File && window.FileReader && window.FileList && window.Blob) {
      //     // Great success! All the File APIs are supported.
      //     return true;
      //   }
      //   alert('The File APIs are not fully supported in this browser.');
      //   return false;
      // }
      // read file
      function selectReadfile(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(){
          readDrawImg(reader, canvas, 0, 0);
        }
      }

      // read image
      function readImg(reader){
        var result_dataURL = reader.result;
        var img = new Image();
        img.src = result_dataURL;
        return img;
      }
      // calc resize
      function resizeWidthHeight(target_length_px, w0, h0){
        var length = Math.max(w0, h0);
        if(length <= target_length_px){
          return{
            flag: false,
            w: w0,
            h: h0
          };
        }
        var w1;
        var h1;
        if(w0 >= h0){
          w1 = target_length_px;
          h1 = h0 * target_length_px / w0;
        }else{
          w1 = w0 * target_length_px / h0;
          h1 = target_length_px;
        }
        return {
          flag: true,
          w: parseInt(w1),
          h: parseInt(h1)
        };
      }
      // print width and height
      function printWidthHeight( width_height_id, flag, w, h) {
        var wh = document.getElementById(width_height_id);
        if(!flag){
          wh.innerHTML = "Not Resized";
          return;
        }
        wh.innerHTML = 'width:' + w + ' height:' + h;
      }
      // draw image on the canvas
      function drawImgOnCav(canvas, img, x, y, w, h) {
        var ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, x, y, w, h);
      }
      // fast search
      function fastSearch(canvas, w, h){
        var context = canvas.getContext("2d");
        var img_data = context.getImageData(0, 0, w, h);
        var xhr = new XMLHttpRequest();
        var boundary = generateUuid();
        var group_id = document.forms.form1.group_id.value
        if (group_id == "") group_id = 0;
        xhr.open("POST" , "https://www3.arche.blue/mvp5/v1/" + group_id + "/fastSearch");
        console.log("https://www3.arche.blue/mvp5/v1/" + group_id + "/fastSearch");
        xhr.onload=function(){
          if (xhr.readyState === 4) {
            console.log( xhr.response );
            if (xhr.status === 200) {
              var data = JSON.parse(xhr.response);
              var div = document.getElementById("result1");
              div.textContent = JSON.stringify(data, null , "\t");
            } else if (xhr.status === 404) {
              var div = document.getElementById("result1");
              div.textContent = "404 The requested URL was not found on the server.\n It may be caused by inncorrect Group ID.\n Please check your Group ID in LOGIN/PROFILE page.";
            }
          }
        };
        xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary="+boundary);

        // part #1 headder
        var headder_str = "--" + boundary + "\r\n";
        headder_str += "Content-Disposition: form-data; name=\"image\"; filename=\"ArcheLiteImage.data\"\r\n";
        headder_str += "Content-Type: application/octet-stream\r\n";
        headder_str += "Content-Transfer-Encoding: binary\r\n\r\n";

        // mime footer
        var footer_str = "--" + boundary + "--\r\n";

        // part #1 data
        var data = new ArrayBuffer(headder_str.length + 16 + w * h + 2 + footer_str.length);
        var data_view = new DataView( data );
        var ptr = 0;

        for (var i = 0; i < headder_str.length; i++ ) {
            data_view.setUint8( i, headder_str.charCodeAt(i) );
        }
        ptr += headder_str.length;

        var mode = 1;
        var para = 0;
        var little_endian = true;
        data_view.setUint32( ptr + 0 , mode , little_endian );
        data_view.setUint32( ptr + 4 , para , little_endian );
        data_view.setUint32( ptr + 8 , h , little_endian );
        data_view.setUint32( ptr + 12 , w , little_endian );
        ptr += 16;

        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            var i = (y * w + x) * 4;
            var p = (img_data.data[i] + img_data.data[i+1] + img_data.data[i+2]) /3;
            data_view.setUint8( ptr + y * w + x , p );
          }
        }
        ptr += w * h;

        data_view.setUint8( ptr , "\r".charCodeAt(0) );
        data_view.setUint8( ptr + 1 , "\n".charCodeAt(0) );
        ptr += 2;

        for (var i = 0; i < footer_str.length; i++ ) {
            data_view.setUint8( ptr + i, footer_str.charCodeAt(i) );
        }

        xhr.send( data );
      }
      // get unique strings
      function generateUuid() {
        let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
        for (let i = 0, len = chars.length; i < len; i++) {
          switch (chars[i]) {
            case "x":
              chars[i] = Math.floor(Math.random() * 16).toString(16);
              break;
            case "y":
              chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
              break;
          }
        }
        return chars.join("");
      }
	})();
	
	*/