var mongoose = require("mongoose");
var Comment = require("./Comment");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  
  title: {
    type: String,
    required: true
  },
  
  link: {
    type: String,
    required: true
  },

  // `note` is an object that stores a Note id
  // The ref property links the ObjectId to the Note model
  // This allows us to populate the Article with an associated Note
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
