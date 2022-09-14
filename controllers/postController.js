const createError = require('http-errors');
const { validationResult } = require('express-validator');
const fs = require('fs');
const url = require('url');
const path = require('path');

const Post = require('../models/postModel');
const User = require('../models/userModel');
const e = require('express');
const {
  fileUploadToAwsS3,
  fileDeleteAwsS3,
} = require('../middlewares/fileUpload');

/*
  @api:       GET /api/posts?user={user}&limit={limit}
  @desc:      get all posts
  @access:    public
*/
const getRecentPosts = async (req, res, next) => {
  try {
    const { user: userId, limit } = url.parse(req.url, true).query;

    const posts = await Post.find({ user: { $ne: userId }, isActive: true })
      .select({ __v: 0 })
      .sort({ updatedAt: 'desc' })
      .limit(limit);
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
  @api:       GET /api/posts/byQuery?user={user}&limit={limit}&date={asc}&search={himu}..
  @desc:      get posts by query
  @access:    public
*/
const getPostsByQuery = async (req, res, next) => {
  try {
    const {
      user: userId,
      limit,
      date: sortByDate,
      price: sortByPrice,
      division,
      district,
      area,
      exchangeOffer,
      sellOffer,
      search,
      category,
    } = url.parse(req.url, true).query;

    let secondaryFilter = {};

    if (division) {
      secondaryFilter.division = division;
    } else if (district) {
      secondaryFilter.district = district;
    } else if (area) {
      secondaryFilter.area = area;
    }

    if (category && category !== 'All') {
      secondaryFilter.category = category.replace('AND', '&');
    }

    if (!(exchangeOffer && sellOffer)) {
      if (exchangeOffer) {
        secondaryFilter.enableExchangeOffer = true;
      } else {
        secondaryFilter.enableExchangeOffer = false;
      }

      if (sellOffer) {
        secondaryFilter.enableSellOffer = true;
      } else {
        secondaryFilter.enableSellOffer = false;
      }
    }

    if (search) {
      const searchKeywords = search
        .split(' ')
        .map((keyword) => new RegExp(keyword, 'i'));

      secondaryFilter.$or = [
        { title: { $in: searchKeywords } },
        { writer: { $in: searchKeywords } },
      ];
    }

    let sortingMap = {};

    if (sortByDate) {
      sortingMap = { updatedAt: sortByDate };
    } else if (sortByPrice) {
      sortingMap = { price: sortByPrice };
    } else {
      sortingMap = { updatedAt: 'desc' };
    }

    const posts = await Post.find({
      user: { $ne: userId },
      isActive: true,
      ...secondaryFilter,
    })
      .select({ __v: 0 })
      .sort(sortingMap)
      .limit(limit);

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
    const post = await Post.findById(req.params.id)
      .select('-__v')
      .populate('user', '-password -isAdmin -isVerified -savedItems -__v');

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
    const user = await User.findById(req.params.id)
      .select('-password -__v')
      .populate({
        path: 'posts',
        options: { sort: { createdAt: -1 } },
      });
    res.status(200).json({ user });
  } catch (err) {
    const error = createError(500, 'No User/Post Found');
    next(error);
  }
};

/*
  @api:       GET /api/posts/saved/user/:id
  @desc:      get all posts of a user
  @access:    private
*/
const getSavedPosts = async (req, res, next) => {
  try {
    const posts = await User.findById(req.params.id)
      .select('savedItems')
      .populate({
        path: 'savedItems',
        select: '-__v',
        options: { sort: { updatedAt: 'desc' } },
      });
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
    const {
      category,
      writer,
      title,
      description,
      price,
      district,
      area,
      division,
      enableSellOffer,
      enableExchangeOffer,
      setLocationDefault,
    } = req.body;

    const newPost = new Post({
      category,
      writer,
      title,
      description,
      image1: req.files.image1
        ? await uploadedImageName(req.files.image1[0])
        : null,
      image2: req.files.image2
        ? await uploadedImageName(req.files.image2[0])
        : null,
      image3: req.files.image3
        ? await uploadedImageName(req.files.image3[0])
        : null,
      price,
      division,
      district,
      area,
      enableSellOffer,
      enableExchangeOffer,
      user: req.user.id,
    });

    const createdNewPost = await newPost.save();

    if (setLocationDefault == 'true') {
      await User.findOneAndUpdate(
        { _id: req.user.id },
        { division, district, area, $push: { posts: createdNewPost.id } }
      );
    } else if (setLocationDefault == 'false') {
      await User.findOneAndUpdate(
        { _id: req.user.id },
        { $push: { posts: createdNewPost.id } }
      );
    }

    res
      .status(201)
      .json({ message: 'Post created successfully', post: createdNewPost });
  } catch (err) {
    const error = createError(400, err.message);
    next(error);
  }
};

/*
  @api:       PATCH /api/posts/savePost/:id
  @desc:      Save a post for later
  @access:    private
*/
const savePostForLater = async (req, res, next) => {
  try {
    const action = url.parse(req.url, true).query.action;
    if (action === 'save') {
      await User.findOneAndUpdate(
        { _id: req.user.id },
        { $push: { savedItems: req.params.id } }
      );
      res.status(201).json({ message: 'User update successful' });
    } else if (action === 'delete') {
      await User.findOneAndUpdate(
        { _id: req.user.id },
        { $pull: { savedItems: req.params.id } }
      );
      res.status(201).json({ message: 'User update successful' });
    } else {
      const error = createError(400, 'User update failed');
      next(error);
    }
  } catch (err) {
    const error = createError(400, 'User update failed');
    next(error);
  }
};

/*
  @api:       PATCH /api/posts/removeImage/:id?image={image}
  @desc:      Remove an image from a post
  @access:    private
*/
const removeImageUrl = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const imageNum = url.parse(req.url, true).query.image;

    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      { [imageNum]: null },
      { new: true }
    );
    res.status(201).json({
      message: 'Post edited successfuly',
      updatedPost,
    });
  } catch (err) {
    const error = createError(400, 'Update failed');
    next(error);
  }
};

/*
  @api:       PATCH /api/posts/:id
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
        const {
          category,
          writer,
          title,
          description,
          price,
          division,
          district,
          area,
          enableSellOffer,
          enableExchangeOffer,
        } = req.body;

        const updatedPost = await post
          .update({
            category,
            writer,
            title,
            description,
            image1: await buildImagePath('image1', req),
            image2: await buildImagePath('image2', req),
            image3: await buildImagePath('image3', req),
            price,
            division,
            district,
            area,
            enableSellOffer,
            enableExchangeOffer,
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
  @api:       PATCH /api/posts/deactivatePost/:id
  @desc:      Deactivate a post
  @access:    private
*/
const deactivatePost = async (req, res, next) => {
  try {
    const isActive = Number(url.parse(req.url, true).query.active);
    const post = await Post.findById(req.params.id);
    if (post) {
      if (post.user.toString() === req.user.id) {
        const updatedPost = await post
          .update({
            isActive: isActive === 0 ? false : true,
          })
          .exec();
        res.status(201).json({
          message: 'Post deactivated successfuly',
        });
      } else {
        res.status(401).json({
          message: 'Post deactivate failed',
        });
      }
    } else {
      res.status(400).json({
        message: 'Post deactivate failed as post not found',
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
          const { image1, image2, image3 } = post;
          image1 && (await fileDeleteAwsS3(image1));
          image2 && (await fileDeleteAwsS3(image2));
          image3 && (await fileDeleteAwsS3(image3));

          await User.findByIdAndUpdate(post.user, {
            $pull: { posts: postId },
          });

          res.status(200).json({
            message: 'Post deletion successful',
            postId,
          });
        } else {
          res.status(400).json({
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

/*
  @api:       DELETE /api/posts/file/:name
  @desc:      Delete a file by its name
  @access:    private
*/
const deleteFileByKey = async (req, res, next) => {
  const fileKey = url.parse(req.url, true).query.fileKey;

  try {
    await fileDeleteAwsS3(fileKey);

    res.status(200).json({
      message: 'File deletion successful',
      fileKey,
    });
  } catch (err) {
    const error = createError(400, err.message);
    next(error);
  }
};

/*
  Helper Functions
*/

const uploadedImageName = async (file) => {
  try {
    const imageUploadResult = await fileUploadToAwsS3(file);
    return imageUploadResult.Key;
  } catch (err) {
    const error = createError(400, err.message);
    next(error);
  }
};

const buildImagePath = async (imageNum, req) => {
  let image;
  if (req.files[imageNum]) {
    image = await uploadedImageName(req.files[imageNum][0]);
  } else if (req.body[imageNum]) {
    image = req.body[imageNum];
  } else {
    image = null;
  }
  return image;
};

module.exports = {
  getRecentPosts,
  getPostsByQuery,
  getPostById,
  getPostsByUser,
  getSavedPosts,
  createPost,
  savePostForLater,
  removeImageUrl,
  editPost,
  deactivatePost,
  deletePost,
  deleteFileByKey,
};
