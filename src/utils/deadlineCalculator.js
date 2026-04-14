const categoryDeadlines = {
    water: 1,     // urgent
    garbage: 2,
    road: 3,
    air: 2,
    noise: 2,
    other: 4
};

function calculateDeadline(category) {
    const days = categoryDeadlines[category] || categoryDeadlines.other;

    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

module.exports = calculateDeadline;