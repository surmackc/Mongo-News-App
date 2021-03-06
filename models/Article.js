var mongoose = require("mongoose");
var Comment = require("./Comment");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  
  title: {
    type: String,
    required: true,
    unique: true
  },
  
  link: {
    type: String,
    required: true
  },

  date: {
    type: String,
    required: false
  },



  // `comment` is an object that stores a comment id
  // The ref property links the ObjectId to the Comment model
  // This allows us to populate the Article with an associated Comment
  saved: {
    type: Boolean,
    default: false
  },

  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }],
  
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
