const User = require('../models/User');
const Razorpay = require('razorpay');
const dotenv =require('dotenv');

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (req, res) => {
  try {
    const options = {
      amount: 50000, // Amount in paise
      currency: 'INR',
      receipt: 'receipt_' + Date.now()
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order' });
  }
};

const updatePremiumStatus = async (req, res) => {
  const { email } = req.body;
  
  try {
    const result = await User.updateOne({ email: email }, { $set: { isPremium: true } });

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'User not found or already premium' });
    }

    res.json({ message: 'Premium status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating premium status' });
  }
};

const getPremiumStatus = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ isPremium: user.isPremium });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  updatePremiumStatus,
  getPremiumStatus
};