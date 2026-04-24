const mongoose = require("mongoose");
const Report = require("../models/Report");
const validateStatusTransition = require("../utils/validateStatusTransition");
const Authority = require("../models/Authority");
const decideAuthority = require("../utils/authorityDecider");
const calculateDeadline = require("../utils/deadlineCalculator");
const Notification = require("../models/Notification");
const User = require("../models/User");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const mapCategoryToAuthorityType = (category) => {
  switch (category) {
    case "garbage":
      return "municipal";
    case "water":
    case "air":
      return "pollution_board";
    case "road":
      return "road";
    case "noise":
      return "police";
    default:
      return "general";
  }
};

const calculatePriority = (report) => {
  const text = (report.title + " " + report.description).toLowerCase();

  if (
    text.includes("fire") ||
    text.includes("accident") ||
    text.includes("flood")
  ) {
    return "high";
  }

  if (report.category === "road" || report.category === "water") {
    return "medium";
  }

  return "low";
};

function getSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(" ");
    const words2 = text2.toLowerCase().split(" ");

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));

    return intersection.size / Math.max(set1.size, set2.size);
}


const createReport = async (req, res) => {
  try {
    const {
      title,
      description,
      cause,
      city,
      area,
      latitude,
      longitude
    } = req.body;

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "Image is required for AI classification"
      });
    }

    // =========================
    // 🔥 ML CLASSIFICATION
    // =========================
    let aiCategory = "other";

    if (file.mimetype.startsWith("image")) {
      const formData = new FormData();
      if (file.path) {
          formData.append("image", file.buffer);
        } else {
          formData.append("image", file.buffer, file.originalname);
        }
      formData.append("title", JSON.stringify(title));

      try {
        const mlResponse = await axios.post(
          process.env.ML_API_URL,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 60000
          }
        );

        console.log("ML API Response:", mlResponse.data);
        aiCategory = mlResponse.data.category;

     } catch (err) {
      console.error("ML API error:", err.message);

      // 🔥 fallback based on title
      const text = title.toLowerCase();

      if (text.includes("water") || text.includes("leak")) {
        aiCategory = "water";
      } else if (text.includes("garbage") || text.includes("waste")) {
        aiCategory = "garbage";
      } else if (text.includes("road") || text.includes("pothole")) {
        aiCategory = "road";
      } else {
        aiCategory = "garbage"; // default safe fallback
      }
    }
    }

    // =========================
    // 🔥 MEDIA
    // =========================
    const media = [
      {
        type: file.mimetype.startsWith("video") ? "video" : "image",
        url: file.path   // 🔥 Cloudinary URL
      },
    ];

    // =========================
    // 🔥 VALIDATION
    // =========================
    if (
      !title ||
      !description ||
      !city ||
      !area ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    // =========================
    // 🔥 DUPLICATE CHECK
    // =========================
    const existingReports = await Report.find({
      city,
      area,
      category: aiCategory
    });

    for (let report of existingReports) {
      const similarity = getSimilarity(description, report.description);
      if (similarity > 0.7) {
        return res.status(409).json({
          message: "Duplicate complaint already exists",
          duplicate: true,
          existingReport: report
        });
      }
    }

    // =========================
    // 🔥 CREATE REPORT
    // =========================
    const newReportData = {
      title,
      description,
      category: aiCategory,
      cause,
      city,
      area,
      latitude,
      longitude,
      media,
      reportedBy: req.user.id,
      displayName: req.user.displayName,
      status: "submitted",
      statusHistory: [
        {
          from: null,
          to: "submitted",
          changedBy: req.user.id,
          changedAt: new Date()
        }
      ]
    };

    newReportData.priority = calculatePriority(newReportData);

    const report = await Report.create(newReportData);

    // =========================
    // 🔥 AUTO ASSIGN AUTHORITY
    // =========================
   const authorityType = mapCategoryToAuthorityType(report.category);

    if (authorityType) {
    const cleanCity = report.city.trim().toLowerCase();
      const authority = await Authority.findOne({
        type: authorityType,
        jurisdiction: {
            $regex: new RegExp(`^${cleanCity}$`, "i")
        },
        level: 1
        });
      if (authority) {
        report.assignedAuthority = authority._id;
        report.status = "assigned";
        report.level = 1;   // 🔥 IMPORTANT FIX

        report.statusHistory.push({
          from: "submitted",
          to: "assigned",
          changedBy: req.user.id,
          changedAt: new Date()
        });

        report.deadline = calculateDeadline(report.category);

        await report.save();

        // console.log("CITY RAW:", report.city);
        // console.log("CITY CLEAN:", cleanCity);
        // console.log("TYPE:", authorityType);

        console.log("REPORT CITY:", report.city);
        console.log("✅ AUTO ASSIGNED TO:", authority.name);
      } else {
        console.log("❌ No matching authority found");
      }
    }

    // =========================
    // 🔥 RESPONSE
    // =========================
    res.status(201).json({
      message: "Report created successfully",
      report
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({
      reportedBy: req.user.id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


const getReports = async(req, res) => {
    try{
        const { page = 1, limit = 10, status, category, city } = req.query;

        const query = {};

        //role based access
        if(req.user.role === "citizen") {
            // query.reportedByBy = req.user.id;
        }

        //filters
        if(status) {
            query.status = status;
        }
        if(category) {
            query.category = category;
        }
        if(city) {
            query.city = city;
        }

        const reports = await Report.find(query)
        .populate("assignedAuthority", "name type jurisdiction")
        .sort({ createdAt: -1 }) //latest first
        .skip((page - 1) * limit)
        .limit(Number(limit));

        const total = await Report.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            reports
        });




    } catch(error) {
        res.status(500).json({
            messgae: "server error",
            error: error.message
        });
    }
};


const getSingleReport = async(req, res) => {
    try{

        const{id} = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid report ID"
            });
        }

        const report = await Report.findById(id)
        .populate("reportedBy","displayName")
        .populate("assignedAuthority", "name type jurisdiction");

        if(!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }
        res.status(200).json(report);

    } catch(error){
        res.status(500).json({
            message: "Server error"
        });
    }
};

const updateReportStatus = async(req, res) => {
    try {

        const { id } = req.params;
        const { status, authorityComment } = req.body;

        //role check 
        if(!["authority", "admin"].includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        //validate report id
        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid report ID"
            });
        }

        //fetch report
        const report = await Report.findById(id);

        if(!report) {
            return res.status(404).json({
                message: "Report not found "
            });
        }

        if (!req.user.authorityId) {
        return res.status(403).json({
            message: "Invalid authority user"
        });
        }
        //  Restrict authority to only their reports
        if (req.user.role === "authority") {
                const isAssigned =
                    report.assignedAuthority &&
                    report.assignedAuthority.toString() === req.user.authorityId.toString();

                const authority = await Authority.findById(req.user.authorityId);

                const isEscalatedAuthority =
                    report.escalated &&
                    authority &&
                    authority.jurisdiction.toLowerCase() === report.city.toLowerCase() &&
                    authority.type === mapCategoryToAuthorityType(report.category);

                if (!isAssigned && !isEscalatedAuthority) {
                    return res.status(403).json({
                    message: "You are not authorized to update this report"
                    });
                }
                }

        // validate transition
        const isValid = validateStatusTransition(report.status, status);
        if(!isValid) {
            return res.status(400).json({
                message: `Cannot change status from ${report.status} to ${status}`,
            });
        }

        //side effects
        if(status === "in_progress") {
            report.assignedAt = new Date();
        }

        if (status === "resolved") {
            return res.status(400).json({
                message: "Please submit response before resolving"
            });
            }

        if(status === "rejected" && !authorityComment) {
            return res.status(400).json({
                message: "Rejection requires a comment"
            });
        }

        //audit trail 
        report.statusHistory.push({
            from: report.status,
            to: status,
            changedBy: req.user.id,
        });

        //update fields
        report.status = status;
        report.authorityComment = authorityComment || "";

        await report.save();

        return res.status(200).json({
            message: "Report status updated Successfully",
            report,
        });

    } catch(error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

const assignAuthority = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if(!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        if (report.assignedAuthority) {
            return res.status(400).json({
                message: "Authority already assigned to this report"
            });
        }
        if (report.status === "resolved") {
            return res.status(400).json({
                message: "Resolved reports cannot be reassigned"
            });
        }

        const authorityType = decideAuthority(report);
        if(!authorityType) {
            return res.status(400).json({
                message: "Cannot decide authority"
            });
        }

        const authority = await Authority.findOne({
            type: authorityType.toLowerCase(),
            jurisdiction: report.city.trim()
        });

        console.log("DEBUG → Report category:", report.category);
        console.log("DEBUG → Decided authority type:", authorityType);
        console.log("DEBUG → Report city:", report.city);
        if(!authority) {
            return res.status(404).json({
                message: `No authority found for type=${authorityType}, city=${report.city}`
            });
        }

        if (validateStatusTransition(report.status,"assigned")) {
            report.statusHistory.push({
                from: report.status,
                to: "assigned",
                changedBy: req.user.id,
                changedAt: new Date()
            });
        }


        report.assignedAuthority = authority._id;
        report.status = "assigned";
        //  Create notification for authority user
        const authorityUser = await User.findOne({
        authorityId: authority._id
        });

        if (authorityUser) {
        await Notification.create({
            user: authorityUser._id,
            message: `New report assigned: ${report.title}`,
            type: "assignment"
        });
        }
       report.deadline = calculateDeadline(report.category);
        await report.save();

        if (!authority.assignedReports.includes(report._id)){
            authority.assignedReports.push(report._id);
            await authority.save();
        }
        

        res.json({
            message: "Authority assigned successfully",
            authority: authority.name
        });
    } catch(error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
};

const manualAssignAuthority = async (req, res) => {
  const { authorityId } = req.body;
   if (!authorityId) {
      return res.status(400).json({
        message: "authorityId is required in request body"
      });
    }

  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

   if (report.assignedAuthority) {
        return res.status(400).json({
            message: "Report already has an assigned authority"
        });
    }

    if (report.status === "resolved") {
        return res.status(400).json({
            message: "Resolved reports cannot be reassigned"
        });
    }

    const authority = await Authority.findById(authorityId);
    if (!authority) {
        return res.status(404).json({ message: `Authority not found for id=${authorityId}` });
    }

    if (report.status !== "assigned") {
        report.statusHistory.push({
            from: report.status,
            to: "assigned",
            changedBy: req.user.id,
            changedAt: new Date()
        });
    }

  report.assignedAuthority = authority._id;
  report.status = "assigned";
    report.deadline = calculateDeadline(report.category);
  await report.save();

    if (!authority.assignedReports.includes(report._id)) {
        authority.assignedReports.push(report._id);
        await authority.save();
    }
  res.json({
    message: "Authority manually assigned",
    authority: authority.name
  });
};

// Authority dashboard – view assigned reports
const getAssignedReportsForAuthority = async (req, res) => {
  try {
    const authority = await Authority.findById(req.user.authorityId);

    if (!authority) {
      return res.status(404).json({
        message: "Authority not found"
      });
    }

    const reports = await Report.find({
        $or: [
            {
            assignedAuthority: new mongoose.Types.ObjectId(req.user.authorityId)
            },
            {
            escalated: true,
            city: { $regex: new RegExp(`^${authority.jurisdiction}$`, "i") },
            // category: authority.type
            }
        ]
        })
        .populate("reportedBy", "displayName")
        .populate("assignedAuthority", "name type jurisdiction")
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: reports.length,
      reports
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


const getReportStats = async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert array to object
    const result = {
      totalReports: 0,
      submitted: 0,
      assigned: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0
    };

    stats.forEach(item => {
      result[item._id] = item.count;
      result.totalReports += item.count;
    });

    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching stats",
      error: error.message
    });
  }
};


const getCategoryStats = async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};

    stats.forEach(item => {
      result[item._id] = item.count;
    });

    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching category stats",
      error: error.message
    });
  }
};

const addAuthorityResponse = async (req, res) => {
  try {
    console.log("FILE DATA:", req.file); 
    const { text } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Proof image is required"
      });
    }

    const report = await Report.findById(req.params.id);
    if (!req.user.authorityId) {
        return res.status(403).json({
            message: "Invalid authority user"
        });
        }

    if (!report) {
      return res.status(404).json({
        message: "Report not found"
      });
    }

    // 🔒 Only assigned authority can respond
    const isAssigned =
            report.assignedAuthority &&
            report.assignedAuthority.toString() === req.user.authorityId.toString();

            const authority = await Authority.findById(req.user.authorityId);

            const isEscalatedAuthority =
            report.escalated &&
            authority &&
            authority.jurisdiction.toLowerCase() === report.city.toLowerCase() &&
            authority.type === mapCategoryToAuthorityType(report.category);

            if (!isAssigned && !isEscalatedAuthority) {
            return res.status(403).json({
                message: "You are not authorized to respond to this report"
            });
            }


    if (!text || text.trim() === "") {
        return res.status(400).json({
            message: "Response text is required"
        });
        }

        //  Prevent duplicate response
        if (report.response && report.response.images?.length > 0) {
        return res.status(400).json({
            message: "Response already submitted"
        });
        }

        report.response = {
        text: text.trim(),
        images: [
          req.file.path   // 🔥 Cloudinary URL
        ],
        respondedAt: new Date()
        };

        // 🔥 AUTO RESOLVE AFTER RESPONSE
        report.statusHistory.push({
        from: report.status,
        to: "resolved",
        changedBy: req.user.id,
        changedAt: new Date()
        });

        report.status = "resolved";
        report.resolvedAt = new Date();

    await report.save();

    res.status(200).json({
      message: "Response submitted successfully",
      report
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

module.exports = { createReport, 
                    getReports, 
                    getSingleReport, 
                    updateReportStatus, 
                    assignAuthority, 
                    manualAssignAuthority, 
                    getAssignedReportsForAuthority,
                    getReportStats,
                    getCategoryStats,
                    getMyReports,
                    calculatePriority,
                    addAuthorityResponse };

