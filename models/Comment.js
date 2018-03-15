var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  
  body: {
    type: String
  },
  article: {
    type: Schema.Types.ObjectId,
    ref: "Article"
  }
});

// This creates our model from the above schema, using mongoose's model method
var Comment = mongoose.model("Comment", CommentSchema);

// Export the Comment model
module.exports = Comment;
