import passport from 'passport';
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
        const user = await User.findById(jwtPayload.id);
        if (user) return done(null, user);
        return done(null, false);
      } catch (err) {
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