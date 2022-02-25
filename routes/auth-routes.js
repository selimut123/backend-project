const express = require("express");
const { check } = require("express-validator");

const authController = require("../controllers/auth-controllers");

const router = express.Router();

router.post(
  "/signup",
  [
    check("firstName").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  authController.signup
);
router.post("/login", authController.login);

module.exports = router;
