const jsonwebtoken = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// authenticate JWT
const jwt = jsonwebtoken({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    }),
    // Validate the audience and the issuer.
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
});

module.exports.jwt = jwt;