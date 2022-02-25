const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const blogSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    creatorName: {type: String, required: true},
    creator: { type: mongoose.Types.ObjectId, require: true, ref: "User" },
  },
  { timestamps: true }
);

blogSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Blog", blogSchema);
