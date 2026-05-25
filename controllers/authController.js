const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, targetClass } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: role || 'student',
      targetClass: targetClass || '',
      approved: role === 'admin' ? true : false,
    });

    await user.save();

    // Create JWT Token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        targetClass: user.targetClass,
        approved: user.approved
      },
      pending: user.approved === false
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // Check approval status
    if (user.role !== 'admin' && user.approved === false) {
      return res.status(401).json({ msg: 'Your account is pending admin approval. Please wait for administrator to approve your account.', pending: true });
    }

    // Create JWT Token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        targetClass: user.targetClass,
        approved: user.approved
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, msg: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, msg: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, msg: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
