const express = require("express");
const router = express.Router();

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
        getMyReports } = require("../controllers/reportController");
        
const Authority = require("../models/Authority");

//Create report
router.post("/", protect, createReport);

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



module.exports = router;