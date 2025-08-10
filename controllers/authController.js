const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Mailjet = require('node-mailjet');
const dotenv = require('dotenv');

dotenv.config();

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_API_SECRET
});

const saltRounds = 10;

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      res.status(200).json({
        success: true,
        message: 'Login successful',
        email: user.email,
        isPremium: user.isPremium
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: 'Signup successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ success: true, message: 'If email exists, reset link sent' });
        }

        const token = uuidv4();
        const expires = new Date(Date.now() + 3600000); // 1 hour

        const reset = new PasswordReset({ user: user._id, token, expires_at: expires });
        await reset.save();

        const resetLink = `http://localhost:${process.env.PORT || 5000}/reset-password/${token}`;
        
        const request = mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [{
                From: { Email: process.env.MAILJET_FROM_EMAIL, Name: process.env.MAILJET_FROM_NAME },
                To: [{ Email: email }],
                Subject: 'Password Reset',
                TextPart: `Reset your password: ${resetLink}`
            }]
        });

        request
            .then(() => {
                res.status(200).json({ success: true, message: 'Reset link has been sent to your email' });
            })
            .catch(() => {
                res.status(200).json({ success: true, message: 'Reset link generated. Check email.' });
            });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token and password required' });
    }

    try {
        const resetRequest = await PasswordReset.findOne({ token, expires_at: { $gt: Date.now() } });
        if (!resetRequest) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await User.updateOne({ _id: resetRequest.user }, { password: hashedPassword });
        
        await PasswordReset.deleteOne({ token });

        res.status(200).json({ success: true, message: 'Password reset successful' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


module.exports = { signup, login, forgotPassword, resetPassword };