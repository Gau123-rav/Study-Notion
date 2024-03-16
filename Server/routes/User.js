const express = require("express");
const router = express.Router();

const {sendOTP, signUp, login, changePassword} = require("../controllers/Auth");

const {resetPasswordToken, resetPassword} = require("../controllers/ResetPassword");

router.post("/login", login);
router.post("/signup", signUp);
router.post("/sendotp", sendOTP);
router.post("/changepassword", changePassword);

router.post("/resetpasswordtoken", resetPasswordToken);
router.post("/resetpassword", resetPassword);

module.exports = router;