const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({})
      .select('name total_expense')
      .sort({ total_expense: -1 })
      .limit(100); // Optional: limit the results

    // The API response needs a 'total_expenses' field to match the frontend JS
    const results = leaderboard.map(user => ({
        name: user.name,
        total_expenses: user.total_expense
    }));

    res.json(results);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getLeaderboard };