const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("../routes/auth");
const usersRoutes = require("../routes/users");
const destinationsRoutes = require("../routes/destinations");
const rentsRoutes = require("../routes/rents");

const app = express();
const port = +process.env.PORT || 8080;

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(authRoutes);
app.use(usersRoutes);
app.use(destinationsRoutes);
app.use(rentsRoutes);

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
