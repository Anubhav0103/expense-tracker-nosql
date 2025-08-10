const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db'); // Import the new DB connection

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const port = process.env.PORT || 5000;

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const userRoutes = require('./routes/userRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

app.use(authRoutes);
app.use(expenseRoutes);
app.use(premiumRoutes);
app.use(userRoutes);
app.use(leaderboardRoutes);

app.use(express.static(path.join(__dirname, 'views')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});