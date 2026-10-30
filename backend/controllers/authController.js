const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Salesperson = require('../models/Salesperson');
const { isValidEmail, isValidPassword } = require('../utils/validation');
const LoginActivity = require('../models/LoginActivity');
const { reverseGeocode } = require('../utils/geocoding');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Salesperson.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' } // 30 minutes
    );

    // Set cookie for browsers that support it, but don't rely on it for mobile
    res.cookie('ctoken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });

    let loginLocationData = {};
    try {
      if (
        user.currentLocation &&
        typeof user.currentLocation.lat === 'number' &&
        typeof user.currentLocation.lng === 'number'
      ) {
        const result = await reverseGeocode(user.currentLocation.lat, user.currentLocation.lng);
        if (result && result.display_name) {
          loginLocationData.locationName = result.display_name;
          loginLocationData.location = {
            lat: user.currentLocation.lat,
            lng: user.currentLocation.lng
          };
        }
      }
    } catch (geoError) {
      console.error('Error reverse geocoding login location:', geoError.message || geoError);
    }

    await LoginActivity.create({
      salesperson: user._id,
      type: 'login',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      ...loginLocationData
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.cookies?.ctoken) {
      token = req.cookies.ctoken;
    }

    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        userId = null;
      }
    }

    // Clear the cookie
    res.clearCookie('ctoken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    if (userId) {
      let logoutLocationData = {};
      try {
        const user = await Salesperson.findById(userId);
        if (
          user &&
          user.currentLocation &&
          typeof user.currentLocation.lat === 'number' &&
          typeof user.currentLocation.lng === 'number'
        ) {
          const result = await reverseGeocode(user.currentLocation.lat, user.currentLocation.lng);
          if (result && result.display_name) {
            logoutLocationData.locationName = result.display_name;
            logoutLocationData.location = {
              lat: user.currentLocation.lat,
              lng: user.currentLocation.lng
            };
          }
        }
      } catch (geoError) {
        console.error('Error reverse geocoding logout location:', geoError.message || geoError);
      }

      await LoginActivity.create({
        salesperson: userId,
        type: 'logout',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        ...logoutLocationData
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const register = async (req, res) => {
  try {
    // Require custom header
    const appKey = req.headers["x-app-key"];

    if (!appKey || appKey !== process.env.APP_KEY) {
      return res.status(401).json({
        message: "Unauthorized - Missing or invalid custom header"
      });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['name', 'email', 'password']
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long'
      });
    }

    const existingUser = await Salesperson.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Salesperson({
      name,
      email,
      password: hashedPassword,
      role: role || 'salesperson'
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { login, logout, register };
