const Report = require("../models/Report");
const Authority = require("../models/Authority");
const Notification = require("../models/Notification");
const User = require("../models/User");

const escalateReports = async () => {
    try {
        console.log("Running escalation check...");

        const now = new Date();

        // 6 hour buffer
        const bufferTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);

        // Find reports to escalate
        const reports = await Report.find({
            status: { $ne: "resolved" },
            deadline: { $lt: bufferTime },
            escalated: false,
            assignedAuthority: { $ne: null }
        }).populate("assignedAuthority");

        for (let report of reports) {

            const currentAuthority = report.assignedAuthority;

            // Find higher authority (level + 1)
            const higherAuthority = await Authority.findOne({
                type: currentAuthority.type,
                jurisdiction: report.city,
                level: currentAuthority.level + 1
            });

            if (!higherAuthority) {
                console.log(`No higher authority found for report ${report._id}`);
                continue;
            }

            // Update report
            report.assignedAuthority = higherAuthority._id;
            report.escalated = true;
            
            // Notify higher authority
            const authorityUser = await User.findOne({
            authorityId: higherAuthority._id
            });

            if (!authorityUser) continue;

            // Check if notification already exists
            const existingNotification = await Notification.findOne({
            user: authorityUser._id,
            message: `Report escalated: ${report.title}`,
            type: "escalation"
            });

            if (!existingNotification) {
            const notification = await Notification.create({
                user: authorityUser._id,
                message: `Report escalated: ${report.title}`,
                type: "escalation"
            });

            console.log("Escalation notification created:", notification);
            }
            
        
    

            // Add history
            report.statusHistory.push({
                from: report.status,
                to: report.status,
                changedBy: null, // system action
                changedAt: new Date()
            });

            await report.save();

            console.log(`Report ${report._id} escalated to level ${higherAuthority.level}`);
        }

    } catch (error) {
        console.error("Escalation error:", error.message);
    }
};

module.exports = escalateReports;