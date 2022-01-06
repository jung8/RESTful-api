const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('public'));
var session = require('express-session'); // Config express-session
var sess = {
    secret: 'super secret',
    cookie: {},
    resave: false,
    saveUninitialized: true
};
if (app.get('env') === 'production') {
    sess.cookie.secure = true;
    app.set('trust proxy', 1); // Https
}
app.use(session(sess));
var dotenv = require('dotenv'); // Load environment variables from .env
dotenv.config();
var passport = require('passport'); // Load Passport
var Auth0Strategy = require('passport-auth0'); // Configure Passport to use Auth0
var strategy = new Auth0Strategy({
        domain: process.env.AUTH0_DOMAIN,
        clientID: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        callbackURL: process.env.AUTH0_CALLBACK_URL || `${process.env.GCLOUD_URL}/callback`
    },
    function (accessToken, refreshToken, extraParams, profile, done) {
        profile.jwt = extraParams.id_token;
        return done(null, profile);
    }
);
passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());
// You can use this section to keep a smaller payload
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/users'));
app.use('/boats', require('./routes/boats'));
app.use('/loads', require('./routes/loads'));
// app.use('/owners', require('./routes/owners'));

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App running @ ${process.env.GCLOUD_URL}`);
});