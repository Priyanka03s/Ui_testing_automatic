import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { ROLES, DEFAULT_USER_PERMISSIONS } from '../config/constants.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/auditService.js';

const googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ userId }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      authProvider: 'local',
      role: ROLES.USER,
      permissions: DEFAULT_USER_PERMISSIONS,
      lastLoginAt: new Date(),
    });

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    await logAudit({
      actorUserId: user._id,
      action: 'user.register',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { email: user.email },
      req,
    });

    return sendSuccess(
      res,
      { user: user.toJSON(), token },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
    }

    if (user.authProvider === 'google' && !user.passwordHash) {
      return sendError(
        res,
        'This account was created via Google Sign-In. Please sign in with Google.',
        400,
        'USE_GOOGLE_LOGIN'
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    await logAudit({
      actorUserId: user._id,
      action: 'user.login',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { email: user.email },
      req,
    });

    return sendSuccess(res, { user: user.toJSON(), token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    let payload;

    // Verify token using google-auth-library
    if (ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: ENV.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (authErr) {
        return sendError(res, 'Invalid Google ID token', 401, 'INVALID_GOOGLE_TOKEN');
      }
    } else {
      // Safe development decode fallback if no client ID set
      const decoded = jwt.decode(credential);
      if (!decoded || !decoded.email) {
        return sendError(res, 'Invalid credential structure', 400, 'INVALID_CREDENTIAL');
      }
      payload = decoded;
    }

    const { email, name, sub: googleId, picture: avatar } = payload;
    let user = await User.findOne({ email });

    if (user) {
      // Security prevention: Check account takeover
      if (user.authProvider === 'local' && !user.googleId) {
        return sendError(
          res,
          'An account with this email already exists with password authentication. Please log in with password to prevent account takeover.',
          409,
          'ACCOUNT_LINKING_REQUIRED'
        );
      }

      if (!user.isActive) {
        return sendError(res, 'Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
      }

      user.lastLoginAt = new Date();
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'both';
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
    } else {
      // Create new Google user
      user = await User.create({
        name: name || 'Google User',
        email,
        googleId,
        avatar: avatar || '',
        authProvider: 'google',
        role: ROLES.USER,
        permissions: DEFAULT_USER_PERMISSIONS,
        lastLoginAt: new Date(),
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    await logAudit({
      actorUserId: user._id,
      action: 'user.google_login',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { email: user.email },
      req,
    });

    return sendSuccess(res, { user: user.toJSON(), token }, 'Google sign-in successful');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  return sendSuccess(res, null, 'Logged out successfully');
};

export const getMe = async (req, res) => {
  return sendSuccess(res, { user: req.user.toJSON() });
};
