const mongoose = require('mongoose');

const authoritySchema = new mongoose.Schema({
    name: { type: String, required: true },

    type: {
        type: String,
        enum: ["municipal", "pollution_board", "road", "police", "general"],
        required: true
    },

    jurisdiction: { type: String, required: true },

    email: { type: String, required: true },

    assignedReports: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Report" }
    ],

    level: {
        type: Number,
        required: true,
        enum: [1, 2, 3]
    }
});

module.exports = mongoose.model("Authority", authoritySchema);