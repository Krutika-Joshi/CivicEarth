require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env")
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Authority = require("../models/Authority");
const User = require("../models/User");

const seedAuthoritiesAndUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Authority.deleteMany({});
    await User.deleteMany({ role: "authority" });

    const hashedPassword = await bcrypt.hash("authority123", 10);

    const authoritiesData = [
      // ================= MUMBAI =================
      {
        name: "Municipal Corporation Mumbai",
        type: "municipal",
        jurisdiction: "Mumbai",
        email: "municipal@mumbai.gov.in",
        level: 1
      },
      {
        name: "Pollution Control Board Mumbai",
        type: "pollution_board",
        jurisdiction: "Mumbai",
        email: "pollution@mumbai.gov.in",
        level: 1
      },
      {
        name: "Road Department Mumbai",
        type: "road",
        jurisdiction: "Mumbai",
        email: "road@mumbai.gov.in",
        level: 1
      },
      {
        name: "Police Department Mumbai",
        type: "police",
        jurisdiction: "Mumbai",
        email: "police@mumbai.gov.in",
        level: 1
      },
      {
        name: "General Department Mumbai",
        type: "general",
        jurisdiction: "Mumbai",
        email: "general@mumbai.gov.in",
        level: 1
      },
      {
        name: "City Municipal Authority Mumbai",
        type: "municipal",
        jurisdiction: "Mumbai",
        email: "citymunicipal@mumbai.gov.in",
        level: 2
      },
      {
        name: "State Pollution Authority Mumbai",
        type: "pollution_board",
        jurisdiction: "Mumbai",
        email: "statepollution@mumbai.gov.in",
        level: 2
      },
      {
        name: "City Road Authority Mumbai",
        type: "road",
        jurisdiction: "Mumbai",
        email: "cityroad@mumbai.gov.in",
        level: 2
      },
      {
        name: "City Police Authority Mumbai",
        type: "police",
        jurisdiction: "Mumbai",
        email: "citypolice@mumbai.gov.in",
        level: 2
      },
      {
        name: "State General Authority Mumbai",
        type: "general",
        jurisdiction: "Mumbai",
        email: "stategeneral@mumbai.gov.in",
        level: 2
      },

      // ================= PUNE =================
      {
        name: "Pune Municipal Corporation",
        type: "municipal",
        jurisdiction: "Pune",
        email: "pmc@pune.gov.in",
        level: 1
      },
      {
        name: "Pollution Control Board Pune",
        type: "pollution_board",
        jurisdiction: "Pune",
        email: "pollution@pune.gov.in",
        level: 1
      },
      {
        name: "Road Department Pune",
        type: "road",
        jurisdiction: "Pune",
        email: "road@pune.gov.in",
        level: 1
      },
      {
        name: "Police Department Pune",
        type: "police",
        jurisdiction: "Pune",
        email: "police@pune.gov.in",
        level: 1
      },
      {
        name: "General Department Pune",
        type: "general",
        jurisdiction: "Pune",
        email: "general@pune.gov.in",
        level: 1
      },

      // ================= THANE =================
      {
        name: "Thane Municipal Corporation",
        type: "municipal",
        jurisdiction: "Thane",
        email: "tmc@thane.gov.in",
        level: 1
      },
      {
        name: "Pollution Control Board Thane",
        type: "pollution_board",
        jurisdiction: "Thane",
        email: "pollution@thane.gov.in",
        level: 1
      },
      {
        name: "Road Department Thane",
        type: "road",
        jurisdiction: "Thane",
        email: "road@thane.gov.in",
        level: 1
      },
      {
        name: "Police Department Thane",
        type: "police",
        jurisdiction: "Thane",
        email: "police@thane.gov.in",
        level: 1
      },
      {
        name: "General Department Thane",
        type: "general",
        jurisdiction: "Thane",
        email: "general@thane.gov.in",
        level: 1
      },

      {
        name: "City Municipal Authority Thane",
        type: "municipal",
        jurisdiction: "Thane",
        email: "citymunicipal@thane.gov.in",
        level: 2
      },
      {
        name: "State Pollution Authority Thane",
        type: "pollution_board",
        jurisdiction: "Thane",
        email: "statepollution@thane.gov.in",
        level: 2
      },
      {
        name: "City Road Authority Thane",
        type: "road",
        jurisdiction: "Thane",
        email: "cityroad@thane.gov.in",
        level: 2
      },
      {
        name: "City Police Authority Thane",
        type: "police",
        jurisdiction: "Thane",
        email: "citypolice@thane.gov.in",
        level: 2
      },
      {
        name: "State General Authority Thane",
        type: "general",
        jurisdiction: "Thane",
        email: "stategeneral@thane.gov.in",
        level: 2
      },

      // ================= DOMBIVLI =================
      {
        name: "Dombivli Municipal Corporation",
        type: "municipal",
        jurisdiction: "Dombivli",
        email: "dmc@dombivli.gov.in",
        level: 1
      },
      {
        name: "Pollution Control Board Dombivli",
        type: "pollution_board",
        jurisdiction: "Dombivli",
        email: "pollution@dombivli.gov.in",
        level: 1
      },
      {
        name: "Road Department Dombivli",
        type: "road",
        jurisdiction: "Dombivli",
        email: "road@dombivli.gov.in",
        level: 1
      },
      {
        name: "Police Department Dombivli",
        type: "police",
        jurisdiction: "Dombivli",
        email: "police@dombivli.gov.in",
        level: 1
      },
      {
        name: "General Department Dombivli",
        type: "general",
        jurisdiction: "Dombivli",
        email: "general@dombivli.gov.in",
        level: 1
      },

      // ================= AMBERNATH =================
      {
        name: "Ambernath Municipal Council",
        type: "municipal",
        jurisdiction: "Ambernath",
        email: "amc@ambernath.gov.in",
        level: 1
      },
      {
        name: "Pollution Control Board Ambernath",
        type: "pollution_board",
        jurisdiction: "Ambernath",
        email: "pollution@ambernath.gov.in",
        level: 1
      },
      {
        name: "Road Department Ambernath",
        type: "road",
        jurisdiction: "Ambernath",
        email: "road@ambernath.gov.in",
        level: 1
      },
      {
        name: "Police Department Ambernath",
        type: "police",
        jurisdiction: "Ambernath",
        email: "police@ambernath.gov.in",
        level: 1
      },
      {
        name: "General Department Ambernath",
        type: "general",
        jurisdiction: "Ambernath",
        email: "general@ambernath.gov.in",
        level: 1
      },
      // ================= AMBERNATH LEVEL 2 =================

    {
      name: "City Municipal Authority Ambernath",
      type: "municipal",
      jurisdiction: "Ambernath",
      email: "citymunicipal@ambernath.gov.in",
      level: 2
    },
    {
      name: "State Pollution Authority Ambernath",
      type: "pollution_board",
      jurisdiction: "Ambernath",
      email: "statepollution@ambernath.gov.in",
      level: 2
    },
    {
      name: "City Road Authority Ambernath",
      type: "road",
      jurisdiction: "Ambernath",
      email: "cityroad@ambernath.gov.in",
      level: 2
    },
    {
      name: "City Police Authority Ambernath",
      type: "police",
      jurisdiction: "Ambernath",
      email: "citypolice@ambernath.gov.in",
      level: 2
    },
    {
      name: "State General Authority Ambernath",
      type: "general",
      jurisdiction: "Ambernath",
      email: "stategeneral@ambernath.gov.in",
      level: 2
    }
    ];

    const createdAuthorities = await Authority.insertMany(authoritiesData);

    const authorityUsers = createdAuthorities.map((authority) => ({
      name: authority.name + " Officer",
      displayName: authority.name.replace(/\s+/g, "_") + "_Officer",
      city: authority.jurisdiction,
      email: authority.email,
      password: hashedPassword,
      role: "authority",
      authorityId: authority._id
    }));

    await User.insertMany(authorityUsers);

    console.log("✅ Authorities & Users seeded successfully");
    console.log("🔑 Password: authority123");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed", error);
    process.exit(1);
  }
};

seedAuthoritiesAndUsers();