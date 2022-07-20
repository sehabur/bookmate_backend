const express = require('express');

const router = express.Router();

const {
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
  deleteFileByName,
} = require('../controllers/postController');

const { checkLogin } = require('../middlewares/authMiddleware');
const {
  postValidationMiddleware,
} = require('../middlewares/validationMiddlewares/postValidationMiddleware');

const { fileUpload } = require('../middlewares/fileUpload');

router
  .route('/')
  .get(getRecentPosts)
  .post(
    checkLogin,
    fileUpload.fields([
      { name: 'image1' },
      { name: 'image2' },
      { name: 'image3' },
    ]),
    postValidationMiddleware,
    createPost
  );

router.route('/byQuery').get(getPostsByQuery);

router
  .route('/:id')
  .get(getPostById)
  .patch(
    checkLogin,
    fileUpload.fields([
      { name: 'image1' },
      { name: 'image2' },
      { name: 'image3' },
    ]),
    postValidationMiddleware,
    editPost
  )
  .delete(checkLogin, deletePost);

router.route('/file/:name').delete(checkLogin, deleteFileByName);

router.route('/user/:id').get(getPostsByUser);

router.route('/saved/user/:id').get(checkLogin, getSavedPosts);

router.route('/savePost/:id').patch(checkLogin, savePostForLater);

router.route('/removeImage/:id').patch(checkLogin, removeImageUrl);

router.route('/deactivatePost/:id').patch(checkLogin, deactivatePost);

module.exports = router;
