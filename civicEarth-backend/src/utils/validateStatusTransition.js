const statusTransitions = require("./statusTransitions");

function validateStatusTransition(currentStatus, newStatus) {
    const allowedNextStates = statusTransitions[currentStatus];

    if(!allowedNextStates) return false;

    return allowedNextStates.includes(newStatus);
}

module.exports = validateStatusTransition;