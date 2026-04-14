const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");

router.get("/protected", protect, (req, res) => {
    res.json({
        messgae: "You have accessed a protected route",
        user: req.user
    });
});

module.exports = router;