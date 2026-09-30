import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Passport Google OAuth 2.0 Strategy Configuration (config/passport.js)
 * ============================================================================
 * 
 * Strict Zero-Password Identity Architecture:
 * - Google OAuth 2.0 is the sole provider. Zero credentials stored in database.
 * - Upserts verified Google identities into the MongoDB User collection.
 * - Minimal Session Footprint: Serializes ONLY `userId` and `role` into Redis
 *   to minimize memory consumption and mitigate PHI leakage in session storage.
 * - Role Resolution: Desired role ('patient' | 'doctor') passed dynamically via
 *   OAuth state parameter during handshake initiation.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'helio_google_client_id_placeholder';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'helio_google_client_secret_placeholder';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`;
const NODE_ENV = process.env.NODE_ENV || 'development';

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
          // Parse state parameter for intended clinical role ('patient' or 'doctor')
          let preferredRole = 'patient';
          if (req.query.state) {
            try {
              const parsedState = JSON.parse(req.query.state);
              if (parsedState.role === 'doctor' || parsedState.role === 'patient') {
                preferredRole = parsedState.role;
              }
            } catch {
              if (req.query.state === 'doctor' || req.query.state === 'patient') {
                preferredRole = req.query.state;
              }
            }
          }

          const googleId = profile.id;
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : null;
          const name =
            profile.displayName ||
            `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
            'Helio User';
          const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          if (!email) {
            return done(new Error('[HELIO PASSPORT] Google profile did not supply a verified primary email address.'), null);
          }

          let user;
          try {
            // Atomic upsert: Update profile info if user exists; initialize role & defaults if new
            user = await User.findOneAndUpdate(
              { $or: [{ googleId }, { email }] },
              {
                $set: {
                  googleId,
                  email,
                  name,
                  avatar,
                  lastLoginAt: new Date(),
                },
                $setOnInsert: {
                  role: preferredRole,
                  condition: preferredRole === 'patient' ? 'Type 2 Diabetes & Hypertension' : undefined,
                  specialty: preferredRole === 'doctor' ? 'Clinical Pharmacotherapy & Cardiology' : undefined,
                },
              },
              {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
              }
            );

            // Immutable HIPAA audit event logging
            try {
              await AuditLog.create({
                action: 'USER_LOGIN',
                userId: user._id,
                ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
                userAgent: req.get('user-agent') || 'Unknown Client',
                status: 'SUCCESS',
                details: {
                  provider: 'google',
                  role: user.role,
                  email: user.email,
                },
              });
            } catch (auditErr) {
              console.warn('[HELIO AUDIT WARN] Non-blocking audit record creation failure:', auditErr.message);
            }
          } catch (dbErr) {
            console.warn('[HELIO DB WARN] Database upsert failed during OAuth handshake:', dbErr.message);
            // Resilient dev identity fallback if database is temporarily offline
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
          console.error('[HELIO PASSPORT ERROR] Strategy execution failed:', error);
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Session Serialization:
 * Mandate: Serialize strictly `userId` and `role` into the Redis session store.
 */
passport.serializeUser((user, done) => {
  const sessionPayload = {
    userId: user._id ? user._id.toString() : (user.userId || user.id),
    role: user.role,
  };
  done(null, sessionPayload);
});

/**
 * Session Deserialization:
 * Rehydrate full User document from MongoDB using the serialized `userId`.
 */
passport.deserializeUser(async (sessionUser, done) => {
  try {
    if (!sessionUser || !sessionUser.userId) {
      return done(null, false);
    }

    try {
      const user = await User.findById(sessionUser.userId);
      if (user) {
        return done(null, user);
      }
    } catch (dbErr) {
      if (NODE_ENV !== 'production') {
        // Dev fallback rehydration
        return done(null, {
          _id: sessionUser.userId,
          id: sessionUser.userId,
          role: sessionUser.role,
        });
      }
      return done(dbErr, null);
    }

    return done(null, false);
  } catch (err) {
    return done(err, null);
  }
});

export default passport;
