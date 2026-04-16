const decideAuthority = (report) => {
  switch (report.category) {
    case "garbage":
      return "municipal";

    case "water":
      return "pollution_board";

    case "road":
      return "road";

    case "air":
      return "pollution_board";

    case "noise":
      return "police";

    case "other":
      return "general";

    default:
      return null;
  }
};

module.exports = decideAuthority;