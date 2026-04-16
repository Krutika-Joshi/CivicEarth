require("dotenv").config();

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

  // Garbage / Municipal
  {
    name: "Municipal Corporation Mumbai",
    type: "municipal",
    jurisdiction: "Mumbai",
    email: "municipal@mumbai.gov.in",
    level: 1
  },
  {
    name: "City Municipal Authority Mumbai",
    type: "municipal",
    jurisdiction: "Mumbai",
    email: "citymunicipal@mumbai.gov.in",
    level: 2
  },

  // Water / Air
  {
    name: "Pollution Control Board Mumbai",
    type: "pollution_board",
    jurisdiction: "Mumbai",
    email: "pollution@mumbai.gov.in",
    level: 1
  },
  {
    name: "State Pollution Authority Mumbai",
    type: "pollution_board",
    jurisdiction: "Mumbai",
    email: "statepollution@mumbai.gov.in",
    level: 2
  },

  // Road
  {
    name: "Road Department Mumbai",
    type: "road",
    jurisdiction: "Mumbai",
    email: "road@mumbai.gov.in",
    level: 1
  },
  {
    name: "City Road Authority Mumbai",
    type: "road",
    jurisdiction: "Mumbai",
    email: "cityroad@mumbai.gov.in",
    level: 2
  },

  // Noise (Police)
  {
    name: "Police Department Mumbai",
    type: "police",
    jurisdiction: "Mumbai",
    email: "police@mumbai.gov.in",
    level: 1
  },
  {
    name: "City Police Authority Mumbai",
    type: "police",
    jurisdiction: "Mumbai",
    email: "citypolice@mumbai.gov.in",
    level: 2
  },

  // Other
  {
    name: "General Department Mumbai",
    type: "general",
    jurisdiction: "Mumbai",
    email: "general@mumbai.gov.in",
    level: 1
  },
  {
    name: "State General Authority Mumbai",
    type: "general",
    jurisdiction: "Mumbai",
    email: "stategeneral@mumbai.gov.in",
    level: 2
  },

  // ================= PUNE =================

  // Garbage / Municipal
  {
    name: "Pune Municipal Corporation",
    type: "municipal",
    jurisdiction: "Pune",
    email: "pmc@pune.gov.in",
    level: 1
  },
  {
    name: "City Municipal Authority Pune",
    type: "municipal",
    jurisdiction: "Pune",
    email: "citymunicipal@pune.gov.in",
    level: 2
  },

  // Water / Air
  {
    name: "Maharashtra Pollution Control Board Pune",
    type: "pollution_board",
    jurisdiction: "Pune",
    email: "mpcb@maha.gov.in",
    level: 1
  },
  {
    name: "State Pollution Authority Pune",
    type: "pollution_board",
    jurisdiction: "Pune",
    email: "statepollution@pune.gov.in",
    level: 2
  },

  // Road
  {
    name: "Road Department Pune",
    type: "road",
    jurisdiction: "Pune",
    email: "road@pune.gov.in",
    level: 1
  },
  {
    name: "City Road Authority Pune",
    type: "road",
    jurisdiction: "Pune",
    email: "cityroad@pune.gov.in",
    level: 2
  },

  // Noise (Police)
  {
    name: "Police Department Pune",
    type: "police",
    jurisdiction: "Pune",
    email: "police@pune.gov.in",
    level: 1
  },
  {
    name: "City Police Authority Pune",
    type: "police",
    jurisdiction: "Pune",
    email: "citypolice@pune.gov.in",
    level: 2
  },

  // Other
  {
    name: "General Department Pune",
    type: "general",
    jurisdiction: "Pune",
    email: "general@pune.gov.in",
    level: 1
  },
  {
    name: "State General Authority Pune",
    type: "general",
    jurisdiction: "Pune",
    email: "stategeneral@pune.gov.in",
    level: 2
  }
];



    const createdAuthorities = await Authority.insertMany(authoritiesData);

    console.log("Authorities seeded successfully");
    
    //create authority users
    const authorityUsers = createdAuthorities.map((authority) => ({
      name: authority.name + " Officer",

      // REQUIRED by User schema
      displayName: authority.name.replace(/\s+/g, "_") + "_Officer",
      city: authority.jurisdiction,

      email: authority.email,
      password: hashedPassword,
      role: "authority",
      authorityId: authority._id
    }));

    await User.insertMany(authorityUsers);

    console.log("Authority users seeded");
    console.log("Authority login password (DEV): authority123");

    process.exit(0);

  } catch (error) {
    console.error("Seeding failed",error);
    process.exit(1);
  }
};

seedAuthoritiesAndUsers();
