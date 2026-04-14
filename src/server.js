const dotenv = require("dotenv");
dotenv.config();


const app  = require("./app");
const connectDB = require("./config/db");


const port = 5000;

connectDB();

app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});