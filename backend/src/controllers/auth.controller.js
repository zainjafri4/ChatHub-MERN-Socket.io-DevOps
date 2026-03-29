import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} from '../utils/jwt.utils.js';

export const register = async (req, res, next) => {
  try {
    const { username, email, password, name } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new ApiError(409, existing.email === email ? 'Email already registered' : 'Username taken');
    }

    const user = await User.create({ username, email, password, name });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(refreshToken, user._id, req.headers['user-agent'], req.ip);

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json(
      new ApiResponse(201, { user: user.toJSON() }, 'Account created successfully')
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(refreshToken, user._id, req.headers['user-agent'], req.ip);

    // Update online status
    await User.findByIdAndUpdate(user._id, { isOnline: true });

    setTokenCookies(res, accessToken, refreshToken);

    res.json(new ApiResponse(200, { user: user.toJSON() }, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
    }

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
    }

    clearTokenCookies(res);
    res.json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

export const refreshTokens = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new ApiError(401, 'Refresh token required');

    const storedToken = await RefreshToken.findOne({ token, isRevoked: false });
    if (!storedToken) throw new ApiError(401, 'Invalid or revoked refresh token');
    if (storedToken.expiresAt < new Date()) throw new ApiError(401, 'Refresh token expired');

    // Revoke old token (rotation)
    storedToken.isRevoked = true;
    await storedToken.save();

    const user = await User.findById(storedToken.userId);
    if (!user) throw new ApiError(401, 'User not found');

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken();
    await saveRefreshToken(newRefreshToken, user._id, req.headers['user-agent'], req.ip);

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json(new ApiResponse(200, { user: user.toJSON() }, 'Tokens refreshed'));
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json(new ApiResponse(200, { user: req.user }, 'User fetched'));
  } catch (error) {
    next(error);
  }
};
