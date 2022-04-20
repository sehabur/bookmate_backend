const express = require('express');

const router = express.Router();

const {
  getRecentPosts,
  getPostById,
  getPostsByUser,
  createPost,
  editPost,
  deletePost,
} = require('../controllers/postController');

const { checkLogin } = require('../middlewares/authMiddleware');
const {
  postValidationMiddleware,
} = require('../middlewares/validationMiddlewares/postValidationMiddleware');

router
  .route('/')
  .get(getRecentPosts)
  .post(checkLogin, postValidationMiddleware, createPost);

router
  .route('/:id')
  .get(getPostById)
  .put(checkLogin, postValidationMiddleware, editPost)
  .delete(checkLogin, deletePost);

router.route('/user/:id').get(getPostsByUser);

module.exports = router;
