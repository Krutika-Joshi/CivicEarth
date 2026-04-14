const express = require("express");
const authRoutes = require("./routes/authRoutes");
// const testRoutes = require("./routes/testRoutes");
const reportRoutes = require("./routes/reportRoutes");
const cron = require("node-cron");
const escalateReports = require("./services/escalationService");
const notificationRoutes = require("./routes/notificationRoutes");
const cors = require("cors");


const app = express();

// middleware to parse JSON
app.use(express.json());


app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

//temporary test route
app.get("/", (req, res) => {
    res.send("Civic Earth Backend is running");
});

app.use("/api/auth", authRoutes);
// app.use("/api/test", testRoutes);
app.use("/api/reports", reportRoutes);

app.use("/api/notifications", notificationRoutes);

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
    console.log("⏰ Running scheduled escalation check...");
    await escalateReports();
});

module.exports = app;