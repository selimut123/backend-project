const fs = require("fs");

const { validationResult } = require("express-validator");
const Blog = require("../models/blog");
const User = require("../models/user");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");

const getBlogs = async (req, res, next) => {
  let blogs;
  try {
    blogs = await Blog.find({});
  } catch (err) {
    return next(
      new HttpError("Fetching blogs failed, please try again later.", 500)
    );
  }
  res.json({ blogs: blogs.map((blog) => blog.toObject({ getters: true })) });
};

const getBlogById = async (req, res, next) => {
  const blogId = req.params.bId;

  let blog;
  try {
    blog = await Blog.findById(blogId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not find the blog.", 500)
    );
  }

  if (!blog) {
    return next(
      new HttpError("Could not find the blog for the provided id.", 404)
    );
  }

  res.json({ blog: blog.toObject({ getters: true }) });
};

const getBlogByUserId = async (req, res, next) => {
  const userId = req.params.uId;

  let userWithBlogs;
  try {
    userWithBlogs = await User.findById(userId).populate("blogs");
  } catch (err) {
    return next(
      new HttpError("Fetching blogs failed, please try again later", 500)
    );
  }

  if (!userWithBlogs || userWithBlogs.blogs.length === 0) {
    return next(
      new HttpError("Could not find blogs for the provided user id.", 404)
    );
  }

  res.json({
    blogs: userWithBlogs.blogs.map((blog) => blog.toObject({ getters: true })),
  });
};

const createBlog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { title, description, genre, creator } = req.body;

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }
  const createdBlog = new Blog({
    title,
    description,
    genre,
    image: req.file.path,
    creatorName: user.name,
    creator,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdBlog.save({ session: sess });
    user.blogs.push(createdBlog);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Creating blog failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ blog: createdBlog });
};

const updateBlog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { title, description } = req.body;
  const blogId = req.params.bId;

  let updatedBlog;
  try {
    updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        title: title,
        description: description,
      },
      { new: true }
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update blog.",
      500
    );
    return next(error);
  }
  if (!updatedBlog) {
    return next(
      new HttpError(
        "Could not update blog with the given ID, please try again.",
        404
      )
    );
  }

  res.status(200).json({ blog: updatedBlog });
};

const deleteBlog = async (req, res, next) => {
  const blogId = req.params.bId;

  let blog;
  try {
    blog = await Blog.findById(blogId).populate("creator");
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete blog.", 500)
    );
  }
  if (!blog) {
    return next(new HttpError("Could not find place for this id.", 404));
  }

  const imagePath = blog.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await blog.remove({ session: sess });
    blog.creator.blogs.pull(blog);
    await blog.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not delete blog.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted blog." });
};

exports.getBlogs = getBlogs;
exports.getBlogById = getBlogById;
exports.getBlogByUserId = getBlogByUserId;
exports.createBlog = createBlog;
exports.updateBlog = updateBlog;
exports.deleteBlog = deleteBlog;
