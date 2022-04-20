const createError = require('http-errors');
const { validationResult } = require('express-validator');

const Post = require('../models/postModel');

/*
  @api:       GET /api/posts/
  @desc:      get all posts
  @access:    public
*/
const getRecentPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({})
      .select({ __v: 0 })
      .sort({ updatedAt: 'desc' })
      .limit(40);
    if (posts) {
      res.json({ posts });
    } else {
      const error = createError(404, 'No Posts Found');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'No Posts Found');
    next(error);
  }
};

/*
  @api:       GET /api/posts/:id
  @desc:      get a post by its Id
  @access:    public
*/
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select('-__v');
    if (post) {
      // setTimeout(() => {
      //   res.json({ post });
      // }, 3000);

      res.json({ post });
    } else {
      const error = createError(404, 'No Post Found with the Id Provided');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'No Post Found');
    next(error);
  }
};

/*
  @api:       GET /api/posts/user/:id
  @desc:      get all posts by a user
  @access:    public
*/
const getPostsByUser = async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.params.id }).select('-__v');
    if (posts.length > 0) {
      res.status(200).json({ posts });
    } else {
      const error = createError(404, 'No Post Found for this user');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'No Post Found');
    next(error);
  }
};

/*
  @api:       POST /api/posts/
  @desc:      Create a new post
  @access:    private
*/
const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      category: req.body.category,
      subCategory: req.body.subCategory,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      image1: req.body.image1,
      image2: req.body.image2,
      image3: req.body.image3,
      division: req.body.division,
      district: req.body.district,
      area: req.body.area,
      enableExchangeOffer: req.body.enableExchangeOffer,
      user: req.user.id,
    });
    const createdNewPost = await newPost.save();
    res
      .status(201)
      .json({ message: 'Post created successfully', post: createdNewPost });
  } catch (err) {
    const error = createError(400, err.message);
    next(error);
  }
};

/*
  @api:       PUT /api/posts/:id
  @desc:      Edit a post
  @access:    private
*/
const editPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    const post = await Post.findById(req.params.id);

    if (post) {
      if (post.user.toString() === req.user.id) {
        const updatedPost = await post
          .update({
            category: req.body.category,
            subCategory: req.body.subCategory,
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            image1: req.body.image1,
            image2: req.body.image2,
            image3: req.body.image3,
            division: req.body.division,
            district: req.body.district,
            area: req.body.area,
            enableExchangeOffer: req.body.enableExchangeOffer,
          })
          .exec();
        res.status(201).json({
          message: 'Post edited successfuly',
          updatedPost,
        });
      } else {
        res.status(401).json({
          message: 'Post edit failed',
        });
      }
    } else {
      res.status(400).json({
        message: 'Post edit failed as post not found',
      });
    }
  } catch (err) {
    const error = createError(400, err.message);
    next(error);
  }
};

/*
  @api:       DELETE /api/posts/:id
  @desc:      Delete a post
  @access:    private
*/
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (post) {
      if (post.user.toString() === req.user.id) {
        const deletePost = await Post.deleteOne({ _id: postId });

        if (deletePost.deletedCount === 1) {
          res.status(200).json({
            message: 'Post deletion successful',
            postId,
          });
        } else {
          res.status(401).json({
            message: 'Post deletion failed',
          });
        }
      } else {
        res.status(401).json({
          message: 'Post deletion failed',
        });
      }
    } else {
      res.status(400).json({
        message: 'Post delete failed as post not found',
      });
    }
  } catch (err) {
    const error = createError(400, err.message);
    next(error);
  }
};

module.exports = {
  getRecentPosts,
  getPostById,
  getPostsByUser,
  createPost,
  editPost,
  deletePost,
};
