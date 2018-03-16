var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Require Article and Comment models
var Article = require("./models/Article.js");
var Comment = require("./models/Comment.js");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var request = require("request");
var cheerio = require("cheerio");


var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
  extended: false
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
  defaultLayout: "index",
  partialsDir: path.join(__dirname, "/views/partials")
}));
app.set("view engine", "handlebars");

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/myapp");


var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function (error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function () {
  console.log("Mongoose connection successful.");
});


// // Routes
// GET to render handlebars pages
app.get("/", function (req, res) {
  Article.find({
    "saved": false
  }, function (error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject)
  });
});

app.get("/saved", function (req, res) {
  Article.find({
    "saved": true
  }).populate("comments").exec(function (error, articles) {
    var hbsObject = {
      article: articles
    };
    res.render("saved", hbsObject);
  });
});

// GET to scrape website
app.get("/scrape", function (req, res) {
  // grab body of html using request
  request("https://www.goodnewsnetwork.org/", function (error, response, html) {
    // load into cherrio and save as $
    var $ = cheerio.load(html);
    // grabbing articles and data

    $("h3").each(function (i, element) {

      console.log(element);
      // save empty result object
      var result = {};

      // adding data to result object
      result.title = $(this).children("a").attr("title");
      result.link = $(this).children("a").attr("href");

      // new entry using article model
      var entry = new Article(result);
      console.log(entry);

      // save to DB
      entry.save(function (err, doc) {
        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });

    });
    res.send("Scrape Complete");

  });
});

// GET articles scraped from the DB
app.get("/articles", function (req, res) {
  // grab docs in Articles array
  Article.find({}, function (error, doc) {
    if (error) {
      console.log(error);
    } else {
      res.json(doc);
    }
  });
});

// GET articles by it's ID

app.get("/articles/:id", function (req, res) {
  // find matching article in DB with query using ID
  Article.findOne({
      "_id": req.params.id
    })
    // populate comments with note
    .populate("comment")
    // execute query
    .exec(function (error, doc) {
      if (error) {
        console.log(error)
      } else {
        res.json(doc);
      }
    });
});

// Save an article
app.post("/articles/save/:id", function (req, res) {
  // use id to find and update boolean
  Article.findOneAndUpdate({
      "_id": req.params.id
    }, {
      "saved": true
    })

    .exec(function (err, doc) {
      if (err) {
        console.log(err);
      } else {
        res.send(doc);
      }
    });
});

// Delete Artcle

app.post("/articles/delete/:id", function (req, res) {
  // use id to update boolean and empty comments array
  Article.findOneAndUpdate({
      "_id": req.params.id
    }, {
      "saved": false,
      "comments": []
    })

    .exec(function (err, doc) {
      if (err) {
        console.log(err);
      } else {
        res.send(doc);
      }
    });
});

// Create Comment

app.post("/comments/save/:id", function (req, res) {
  // create new comment using model and pass req.body to it
  var newComment = new Comment({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  // save to DB
  newComment.save(function (error, comment) {
    if (error) {
      console.log(error);
    } else {
      // use article id to update comments
      Article.findOneAndUpdate({
          "_id": req.params.id
        }, {
          $push: {
            "comments": comment
          }
        })

        .exec(function (err) {
          if (err) {
            console.log(err);
          } else {
            // send to client
            res.send(comment);
          }
        });
    }
  });
});


// Delete Comment

app.delete("/comments/delete/:comment_id/:article_id", function (req, res) {
// use comment id to find and delete
  Comment.findOneAndRemove({
    "_id": req.params.comment_id
  }, function (err) {
    if (err) {
      console.log(err);
    } else {
      Article.findOneAndUpdate({
          "_id": req.params.article_id
        }, {
          $pull: {
            "comments": req.params.comment_id
          }
        })
        // exec query and either send error or response text
        .exec(function (err) {
          if (err) {
            console.log(err);
            res.send(err);
          } else {
            res.send("Comment Deleted");
          }
        });
    }
  });
});

// // Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});








// app.get('/', function(req, res) {
//   res.render('index');
// });

// // A GET route for scraping the echojs website
// app.get("/scrape", function(req, res) {
//   // First, we grab the body of the html with request
//   request.get("http://www.goodnewsnetwork.com/").then(function(response) {
//     // Then, we load that into cheerio and save it to $ for a shorthand selector
//     var $ = cheerio.load(response.data);

//     // Now, we grab every h2 within an article tag, and do the following:
//     $("h3.entry-title.td-module-title").each(function(i, element) {
//       // Save an empty result object
//       console.log(i, element);
//       var result = {};

//       // Add the text and href of every link, and save them as properties of the result object
//       result.title = $(this)
//         .children("a")
//         .text();
//       result.link = $(this)
//         .children("a")
//         .attr("href");

//       // Create a new Article using the `result` object built from scraping
//       db.Article.create(result)
//         .then(function(dbArticle) {
//           // View the added result in the console
//           console.log(dbArticle);
//         })
//         .catch(function(err) {
//           // If an error occurred, send it to the client
//           return res.json(err);
//         });
//     });

//     // If we were able to successfully scrape and save an Article, send a message to the client
//     res.send("Scrape Complete");
//   });
// });

// // Route for getting all Articles from the db
// app.get("/articles", function(req, res) {
//   // Grab every document in the Articles collection
//   db.Article.find({})
//     .then(function(dbArticle) {
//       // If we were able to successfully find Articles, send them back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });

// // Route for grabbing a specific Article by id, populate it with it's note
// app.get("/articles/:id", function(req, res) {
//   // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
//   db.Article.findOne({ _id: req.params.id })
//     // ..and populate all of the notes associated with it
//     .populate("note")
//     .then(function(dbArticle) {
//       // If we were able to successfully find an Article with the given id, send it back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });

// // Route for saving/updating an Article's associated Note
// app.post("/articles/:id", function(req, res) {
//   // Create a new note and pass the req.body to the entry
//   db.Note.create(req.body)
//     .then(function(dbNote) {
//       // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
//       // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
//       // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
//       return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
//     })
//     .then(function(dbArticle) {
//       // If we were able to successfully update an Article, send it back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });