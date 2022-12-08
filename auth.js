const Trade = require('../models/trade');
const User = require('../models/user');
//check if user is a guest
exports.isGuest = (req, res, next) =>{
    if(!req.session.user){
        return next();
    } else {
        req.flash('error', 'You are logged in already');
        return res.redirect('/users/profile');
    }
};

//check if user is authenticated

exports.isLoggedIn = (req, res, next) =>{
    if(req.session.user){
        console.log('entered in validation');
        console.log(req.session.user);
        return next();
    } else {
        req.flash('error', 'You need to logged in first');
        return res.redirect('/users/login');
    }
};

//check if user is author of the story
exports.isAuthor = (req, res, next) =>{
    let id = req.params.id;
    Trade.findById(id)
    .then(trade=>{
        if(trade) {
            if(trade.owner == req.session.user){
                return next();
            } else {
                req.flash('error', 'Unauthorized to access the resource');
                return res.redirect('/users/trades');
            }
        }
    })
    .catch(err=>next(err));
};

//check if email address is unique

exports.isEmailUnique = (req, res, next) => {
    if(validationResult(req)){
        return next()
    } else {
        req.flash('error', 'Email already exists');
        return res.redirect('/users/newUser');
    }
};