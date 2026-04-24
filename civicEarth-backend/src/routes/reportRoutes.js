const express = require("express");
const router = express.Router();
// const upload = require("../config/multer");
const Report = require("../models/Report");
const upload = require("../middlewares/upload");

const { protect, authorizeRoles }  = require("../middlewares/authMiddleware");
const { createReport, 
        getReports, 
        getSingleReport, 
        updateReportStatus, 
        assignAuthority, 
        manualAssignAuthority, 
        getAssignedReportsForAuthority,
        getReportStats,
        getCategoryStats,
        getMyReports,
        addAuthorityResponse} = require("../controllers/reportController");
        
const Authority = require("../models/Authority");

//Create report
router.post("/", protect, upload.single("media"), createReport);

//View & filter reports
router.get("/", protect, getReports);


router.get("/my-reports", protect, getMyReports);


//get all authorities (admin only)
router.get("/authorities", protect, authorizeRoles("admin"), 
async (req, res) => {
    try{
        const authorities = await Authority.find({});
        res.status(200).json(authorities);
    } catch (error){
        res.status(500).json({
            message: "server error",
            error: error.message
        });
    }
});

router.get("/stats", getReportStats);
router.get("/stats/category", getCategoryStats);

// authority dashboard – assigned reports
router.get("/assigned/me", protect, authorizeRoles("authority"),
  getAssignedReportsForAuthority
);


//view single report
router.get("/:id", protect, getSingleReport);

//update report status
router.patch("/:id/status", protect, updateReportStatus);

router.post("/:id/assign", protect, authorizeRoles("admin", "moderator"), assignAuthority);

//manual assignment
router.post("/:id/manual-assign", protect, authorizeRoles("admin", "moderator"), manualAssignAuthority);

// ❤️ LIKE
router.put("/:id/like", protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const userId = req.user.id;

    if (report.likes.includes(userId)) {
      report.likes = report.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      report.likes.push(userId);
    }

    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 💬 COMMENT
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.comments.push({
      user: req.user.id,
      displayName: req.user.displayName,
      text
    });

    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ❤️ LIKE COMMENT
router.put("/:reportId/comment/:commentId/like", protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const comment = report.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user.id;

    // ✅ FIXED CHECK
    const alreadyLiked = comment.likes.some(
      (id) => id.toString() === userId
    );

    if (alreadyLiked) {
      // ❌ REMOVE LIKE
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      // ❤️ ADD LIKE
      comment.likes.push(userId);
    }

    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  "/:id/respond",
  protect,
  authorizeRoles("authority"),
  upload.single("image"),
  addAuthorityResponse
);


module.exports = router;