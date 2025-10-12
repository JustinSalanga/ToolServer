const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const model = require('../database/model');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await model.getUserById(jwt_payload.id);

        if (user) {
            // Check if user is blocked
            if (user.blocked === 0) {
                return done(null, false, { message: 'User is blocked' });
            }
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        return done(error, false);
    }
}));

module.exports = passport;
