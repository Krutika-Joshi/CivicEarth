const express = require("express");
const router = express.Router();
const { updateUser } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

router.put("/update", protect , updateUser);

module.exports = router;