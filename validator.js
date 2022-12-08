const {body} = require('express-validator');
const {validationResult} = require('express-validator');
exports.validateId = (req, res, next) =>{
    let id = req.params.id;
    if(!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid story id');
        err.status = 400;
        return next(err);
      
    } else {
        return next();
    }
};

exports.validateSignUp = [body('firstName', 'First name can not be empty').notEmpty().trim().escape(),
body('lastName', 'Last name can not be empty').notEmpty().trim().escape(),
body('email','Email must be a valid email address').isEmail().trim().escape().normalizeEmail(),
body('password', 'Password must be at least 8 characters and at most 64 characters').isLength({min:8, max:64})];

exports.validateLogIn = [body('email','Email must be the valid email address').isEmail().trim().escape().normalizeEmail(),
body('password','Password must be at least 8 characters and at most 64 characters').isLength({min:8, max:64})];

exports.validateResult = (req, res, next)=>{
    let errors = validationResult(req);
    if(!errors.isEmpty()){
        errors.array().forEach(error=>{
            req.flash('error',error.msg);
        });
        return res.redirect('back');
    } else {
        return next();
    }

};

exports.validateTrade = [body('fullName', 'fullName can not be empty').notEmpty().trim().escape(),
body('emailId', 'Email must be a valid email address').isEmail().trim().escape().normalizeEmail(),
body('itemCategory','Item Category can not be empty').notEmpty().trim().escape(),
body('itemname','Item name can not be empty').notEmpty().trim().escape(),
body('materialType','Material Type can not be empty').notEmpty().trim().escape(),
body('details','Description must be at least 30 characters').isLength({min:8})
];
