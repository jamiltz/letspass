var config      =       require('./../config.js');
var User        =       db.collection('user');

var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var ObjectID    =   require('mongodb').ObjectID;
function getId(id) {
    return new ObjectID(id);
};

module.exports.setup = function(app) {

    /*
     The serializing method. Basically, it should return all of the user object
     that is necessary to identify it. Usually, the id field will do just fine.
     */
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    /*
     This goes the other way around. This function should return a full user object.
     This is not only database agnostic, you can also use web services or whatever here.
     */
    passport.deserializeUser(function(id, done) {
        User.findOne({_id: getId(id)}, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        function(username, password, done) {
            User.findOne({email: username}, function(err, user) {
                console.log(user)
                if (err) {return done(err);}
                if (!user) {
                    return done(null, 'email-not-found');
                }
                if (user.password != password) {
                    return done(null, 'wrong-password');
                }
                return done(null, user);
            })
        }
    ));


};


module.exports.routes = function(app) {

    app.post('/1.0/login',
        function(req, res, next) {
            passport.authenticate('local', function(err, user) {
                if(user === 'email-not-found') {
                    res.status(404).send('Oops. Email was not found.');
                } else if (user === 'wrong-password') {
                    res.status(401).send('Oops. Wrong password.');
                } else {
                    req.user = user;
                    res.status(200).send('ok');
                    req.logIn(user, function(err) {
                        if (err) { return next(err); }
                        return res.redirect('/');
                    });
                }
            })(req, res, next)
        }
    );

    app.get('/auth/facebook', passport.authenticate('facebook', {scope: config.param('scope')}));
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/'
    }));

    app.get('/1.0/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });
};

module.exports.authRequired = function(req, res, next) {
    if(req.isAuthenticated()) next();
    else next('user-is-not-logged-in');
};

module.exports.logout = function(req, res) {
    req.logOut();
    res.status(200).send({status: 200});
};