import passport from 'passport';
import mongoose from 'mongoose';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';

export const configurePassport = () => {
  const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (req) => req?.cookies?.jwt,
    ]),
    secretOrKey: process.env.JWT_SECRET || 'fallback_secret_key_for_helio_platform_123!',
  };

  passport.use(
    new JwtStrategy(jwtOpts, async (jwtPayload, done) => {
      try {
        if (jwtPayload.isMock || mongoose.connection.readyState !== 1) {
          const mockRole = jwtPayload.role || 'PATIENT';
          const isPatient = mockRole === 'PATIENT';
          return done(null, {
            _id: jwtPayload.id || (isPatient ? '64f8a1b2c3d4e5f607890123' : '64f8a1b2c3d4e5f607890456'),
            name: isPatient ? 'Sarah Jenkins (Demo Patient)' : 'Dr. Marcus Reid (Demo Doctor)',
            email: isPatient ? 'patient@helio.health' : 'doctor@helio.health',
            role: mockRole,
            phone: isPatient ? '+1-555-0192' : '+1-555-0847',
            specialty: isPatient ? '' : 'Endocrinology & Metabolic Medicine',
            licenseNumber: isPatient ? '' : 'MD-88421',
          });
        }

        const user = await User.findById(jwtPayload.id);
        if (user) return done(null, user);

        if (jwtPayload.email === 'patient@helio.health' || jwtPayload.email === 'doctor@helio.health') {
          const isPatient = jwtPayload.email === 'patient@helio.health';
          return done(null, {
            _id: jwtPayload.id || (isPatient ? '64f8a1b2c3d4e5f607890123' : '64f8a1b2c3d4e5f607890456'),
            name: isPatient ? 'Sarah Jenkins (Demo Patient)' : 'Dr. Marcus Reid (Demo Doctor)',
            email: jwtPayload.email,
            role: isPatient ? 'PATIENT' : 'DOCTOR',
            phone: isPatient ? '+1-555-0192' : '+1-555-0847',
            specialty: isPatient ? '' : 'Endocrinology & Metabolic Medicine',
          });
        }

        return done(null, false);
      } catch (err) {
        if (jwtPayload.email === 'patient@helio.health' || jwtPayload.email === 'doctor@helio.health' || jwtPayload.isMock) {
          const isPatient = jwtPayload.email === 'patient@helio.health' || jwtPayload.role === 'PATIENT';
          return done(null, {
            _id: jwtPayload.id || '64f8a1b2c3d4e5f607890123',
            name: isPatient ? 'Sarah Jenkins (Demo Patient)' : 'Dr. Marcus Reid (Demo Doctor)',
            email: isPatient ? 'patient@helio.health' : 'doctor@helio.health',
            role: isPatient ? 'PATIENT' : 'DOCTOR',
            phone: isPatient ? '+1-555-0192' : '+1-555-0847',
            specialty: isPatient ? '' : 'Endocrinology & Metabolic Medicine',
          });
        }
        return done(err, false);
      }
    })
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
              const email = profile.emails?.[0]?.value;
              user = await User.findOne({ email });

              if (user) {
                user.googleId = profile.id;
                await user.save();
              } else {
                user = await User.create({
                  name: profile.displayName || 'Google User',
                  email: email || `${profile.id}@google.user`,
                  googleId: profile.id,
                  avatar: profile.photos?.[0]?.value || '',
                  role: 'PATIENT',
                });
              }
            }
            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  }
};

export default configurePassport;