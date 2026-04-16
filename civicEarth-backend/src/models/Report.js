const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true,
            enum: ["garbage", "water", "road", "air", "noise", "other"]
        },
        cause: {
            type: String
        },
        media: [
            {
                type: {
                    type: String,
                    enum: ["image", "video"],
                    required: true
                },
                url: {
                    type: String,
                    required: true
                }
            }
        ],
        city: {
            type: String,
            required: true
        },
        area: {
            type: String,
            required: true
        },
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        displayName: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["submitted","assigned", "in_progress", "resolved" ,"rejected"],
            default: "submitted"
        },
        statusHistory: [
            {
                from: String,
                to: String,
                changedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                changedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        assignedAt: {
            type: Date,
        },

        resolvedAt: {
            type: Date,
        },
        authorityComment: {
            type: String,
        },
        assignedAuthority: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Authority",
            default: null
        },
        deadline: {
            type: Date
        },
        escalated: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);


reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ city: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ reportedBy: 1 });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;