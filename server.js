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


var PORT = process.env.PORT || 8000;

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

// const publicPath = path.join(__dirname, '/public');
// app.use('/', express.static(publicPath));
app.use(express.static("public"));

// Handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
  defaultLayout: "main",
  partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");



// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
var databaseUri = "mongodb://localhost/myapp";
mongoose.Promise = Promise;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect(databaseUri);
}


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

    $(".td_module_1").each(function (i, element) {

      // save empty result object
      var result = {};

      // adding data to result object
      result.title = $(this).children("h3").children("a").attr("title");
      result.link = $(this).children("h3").children("a").attr("href");
      result.date = $(this).children(".td-module-meta-info").children(".td-post-date").children(".entry-date").text();
    

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
    // populate comments with comment
    .populate("comments")
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
            res.send(err);
          } else {
            // send to client
            console.log(comment);
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
      res.send(err);
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
