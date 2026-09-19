import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Passport Google OAuth 2.0 Strategy (config/passport.js)
 * ============================================================================
 * 
 * Strict Zero-Password Architecture:
 * - Google OAuth 2.0 is the sole identity provider.
 * - Authenticates verified Google profiles.
 * - Stores stateful { id, role, email, name } in Redis session.
 * - Supports role designation ('patient' | 'doctor') passed via OAuth state parameter.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'helio_google_client_id_placeholder';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'helio_google_client_secret_placeholder';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`;

// Register Google Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Parse state parameter for intended role ('patient' or 'doctor')
          let preferredRole = 'patient';
          if (req.query.state) {
            try {
              const parsedState = JSON.parse(req.query.state);
              if (parsedState.role === 'doctor' || parsedState.role === 'patient') {
                preferredRole = parsedState.role;
              }
            } catch {
              // State was a simple string
              if (req.query.state === 'doctor' || req.query.state === 'patient') {
                preferredRole = req.query.state;
              }
            }
          }

          const googleId = profile.id;
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : null;
          const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Helio User';
          const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          if (!email) {
            return done(new Error('Google profile did not provide a primary email address.'), null);
          }

          // Locate or create user in MongoDB
          let user;
          try {
            user = await User.findOne({ $or: [{ googleId }, { email }] });

            if (!user) {
              // Create new verified identity
              user = await User.create({
                googleId,
                email,
                name,
                avatar,
                role: preferredRole,
                condition: preferredRole === 'patient' ? 'Type 2 Diabetes & Hypertension' : undefined,
                specialty: preferredRole === 'doctor' ? 'Clinical Pharmacotherapy & Cardiology' : undefined,
                lastLoginAt: new Date(),
              });

              // Log registration audit event if DB is operational
              try {
                await AuditLog.create({
                  action: 'USER_LOGIN',
                  userId: user._id,
                  ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
                  userAgent: req.get('user-agent') || 'Unknown',
                  status: 'SUCCESS',
                  details: { provider: 'google', role: preferredRole, isNewUser: true },
                });
              } catch (auditErr) {
                console.warn('[HELIO AUDIT WARN] Could not write registration audit log:', auditErr.message);
              }
            } else {
              // Update existing user profile info and login timestamp
              user.name = name || user.name;
              if (avatar) user.avatar = avatar;
              user.lastLoginAt = new Date();
              await user.save();

              try {
                await AuditLog.create({
                  action: 'USER_LOGIN',
                  userId: user._id,
                  ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
                  userAgent: req.get('user-agent') || 'Unknown',
                  status: 'SUCCESS',
                  details: { provider: 'google', role: user.role, isNewUser: false },
                });
              } catch (auditErr) {
                console.warn('[HELIO AUDIT WARN] Could not write login audit log:', auditErr.message);
              }
            }
          } catch (dbErr) {
            console.warn('[HELIO DB WARN] Database query failed during OAuth:', dbErr.message);
            // Resilient dev fallback user object
            user = {
              _id: `dev_${googleId}`,
              id: `dev_${googleId}`,
              googleId,
              email,
              name,
              avatar,
              role: preferredRole,
            };
          }

          return done(null, user);
        } catch (error) {
          console.error('[HELIO PASSPORT ERROR] Strategy verification failure:', error);
          return done(error, null);
        }
      }
    )
  );
}

// Session Serialization: Persist minimal identity footprint in Redis
passport.serializeUser((user, done) => {
  const sessionUser = {
    id: user._id ? user._id.toString() : user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  };
  done(null, sessionUser);
});

// Session Deserialization: Rehydrate full user model or session payload
passport.deserializeUser(async (sessionUser, done) => {
  try {
    if (!sessionUser || !sessionUser.id) {
      return done(null, false);
    }

    try {
      const user = await User.findById(sessionUser.id);
      if (user) {
        return done(null, user);
      }
    } catch {
      // If DB is offline or dev ID, use sessionUser payload
    }

    // Fallback to session user data
    return done(null, sessionUser);
  } catch (err) {
    return done(err, null);
  }
});

export default passport;
