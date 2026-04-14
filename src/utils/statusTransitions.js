const statusTransitions = {
    submitted: ["assigned"],
    assigned: ["in_progress"],
    in_progress: ["resolved", "rejected"],
    resolved: [],
    rejected: []
};


module.exports = statusTransitions;