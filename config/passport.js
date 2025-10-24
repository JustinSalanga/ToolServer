const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const model = require('../database/model');

// Admin JWT Strategy
const adminOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_ADMIN_SECRET || '75b97d33464a2b2474421f0e033fb23a6bb198f0d5ac63609e000c32443759e73b49e80596ca279e712a5443f0fa967ec0beafef5382fd85a5d91d862a22632f'
};

passport.use('admin-jwt', new JwtStrategy(adminOpts, async (jwt_payload, done) => {
    try {
        // Verify this is an admin token
        if (jwt_payload.authType !== 'admin') {
            return done(null, false, { message: 'Invalid token type for admin access' });
        }

        const user = await model.getUserById(jwt_payload.id);

        if (user) {
            // Check if user is blocked
            if (user.blocked === 0) {
                return done(null, false, { message: 'User is blocked' });
            }
            // Check if user has admin role
            if (user.role !== 'admin') {
                return done(null, false, { message: 'Admin privileges required' });
            }
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        return done(error, false);
    }
}));

// User JWT Strategy
const userOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_USER_SECRET || 'a29f1a79fd0558c6883cfe65a1aa1d81b19056f35275ba2c3985b6684eedcc165c23511613b3c0c43cfe0e092ad97fbb4f072a2189e151033234e2e0bf5b2767'
};

passport.use('user-jwt', new JwtStrategy(userOpts, async (jwt_payload, done) => {
    try {
        // Verify this is a user token
        if (jwt_payload.authType !== 'user') {
            return done(null, false, { message: 'Invalid token type for user access' });
        }

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

// Legacy JWT Strategy (for backward compatibility)
const legacyOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
};

passport.use('jwt', new JwtStrategy(legacyOpts, async (jwt_payload, done) => {
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
