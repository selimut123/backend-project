const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");

const blogController = require("../controllers/blog-controllers");

const router = express.Router();

router.get("/", blogController.getBlogs);

router.get("/:bId", blogController.getBlogById);

router.get("/user/:uId", blogController.getBlogByUserId);

router.post(
  "/write",
  fileUpload.single("image"),
  [check("title").not().isEmpty(), check("description").not().isEmpty()],
  blogController.createBlog
);
router.patch(
  "/update/:bId",
  [check("title").not().isEmpty(), check("description").not().isEmpty()],
  blogController.updateBlog
);
router.delete("/delete/:bId", blogController.deleteBlog);

module.exports = router;
