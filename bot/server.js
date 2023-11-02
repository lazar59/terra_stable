// Handling uncaught Exception -- console.log(youtube) -- youtube is not defined
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("shutting down the server");

  process.exit(1);
});

// DOTENV
const dotenv = require("dotenv");
dotenv.config();

const configsModel = require("./models/configs.model");

//MONGOOSE
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB CONNECTED");
  })
  .catch((err) => console.log(err));

// EXPRESS
const express = require("express");
const app = express();

// cookie-parser is a middleware which parses cookies attached to the client request object
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// For using Json
app.use(express.json());

// CORS -- Cross-Origin Resource Sharing -- a mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served
const cors = require("cors");
app.use(
  cors({
    origin: [
      "https://terrapexc.onrender.com",
      "https://terrapexc.onrender.com/*",
      "http://localhost:5173",
    ],
    preflightContinue: true,
    credentials: true,
  })
);

// LOCAL REQUIRES FILES
const auth = require("./routes/authentication.routes");
const transaction = require("./routes/transaction.routes");

app.use("/api/v1/auth", auth);
app.use("/api/v1/transaction", transaction);

// Serving Static File of frontend build -- index.html
const path = require("path");

app.use(express.static(path.join(__dirname, "./dist")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./dist/index.html"));
});

// Error Handler
const errorMiddleware = require("./middlewares/error");
app.use(errorMiddleware);

// LISTEN SERVER
let server = app.listen(process.env.PORT || 5000, () => {
  console.log("Backend server is running!");
});

// unhandled Promise Rejection of Database
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("shutting down the server");

  server.close(() => {
    process.exit(1);
  });
});
