const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ msg: 'No authentication token, access denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user ? decoded.user.id : decoded.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    const approved = user.approved !== false || user.role === 'admin';
    if (!approved) {
      return res.status(401).json({ msg: 'Account pending admin approval' });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
