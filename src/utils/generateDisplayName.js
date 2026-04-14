const generateDisplayName = (city) => {
    const randomNumber = Math.floor(100 + Math.random() * 900);
    return `Citizen_${city}_${randomNumber}`;
};

module.exports = generateDisplayName;