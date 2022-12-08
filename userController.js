const express = require('express');
const Trade = require('../models/trade');
const model = require('../models/user');
const watchList = require('../models/watchTradeModels');

exports.login = (req, res, next)=>{
    let email = req.body.email;
    if(email){
        email = email.toLowerCase();
     }
     let password = req.body.password;
    model.findOne({ email: email})
    .then(user => {
        if (!user) {
            console.log('wrong email address');
            req.flash('error', 'wrong email address');  
            res.redirect('/users/login');
            } else {
            user.comparePassword(password)
            .then(result=>{
                if(result) {
                    req.session.user = user._id;
                    console.log(req.session.user);
                    req.flash('success', 'You have successfully logged in');
                    res.redirect('/users/profile');
            } else {
                req.flash('error', 'wrong password');      
                res.redirect('/users/login');
            }
            });     
        }     
    })
    .catch(err => next(err));
};

exports.profile = (req, res, next)=>{
    let itemID = req.query.itemid;
    let id = req.session.user;
    Promise.all([model.findById(id), Trade.find({owner: id})])
    .then(results=>{
        const [user, trades] = results;
        res.render('./users/profile', {user,trades})
    })
    .catch(err=>next(err));
};

exports.signUp = (req,res,next) => {
    res.render('./users/newUser');
}
exports.getUserLogin = (req, res, next) => {

    res.render('./users/login');

}

exports.create = (req, res, next)=>{
    let user = new model(req.body);
    let email = req.body.email;
    if(user.email)
     user.email = user.email.toLowerCase();
    user.save()
    .then(user=>{ 
        req.flash('success', 'You are signed up successfully')
        res.redirect('/users/login')
    } )
    .catch(err=>{
        console.log(err.code);
        if(err.name === 'ValidationError' ) {
            req.flash('error', err.message);  
            return res.redirect('/users/newUser');
        }
        if(err.code === 11000) {
            req.flash('error', 'Email has been used');  
            return res.redirect('/users/newUser');
        }
        next(err);
    });
};

exports.signout = (req, res, next)=>{
    req.session.destroy(err=>{
        if(err) 
           return next(err);
       else
            res.redirect('/');  
    });
   
 };


 exports.userWatchList = (request,response,next)=>{
    let id = request.session.user; 
    let trades=[],categories,user;
    Promise.all([watchList.findOne({userId:id})])
    .then((results)=>{
        const[trade,userDetails] = results;
        if(trade){
            Trade.find({_id:{$in :trade.tradeId}})
            .then((tradeDetails)=>{
            categories = [...
                new Set(tradeDetails.map(
                (object) => {
                    return object.itemCategory
                })
            )];
            trades = tradeDetails;
            user = userDetails
            response.render('./users/watchTrade', {trades,categories}) 
        })
        }else{
            response.render('./users/watchTrade', {trades,categories})
        }
        
    }).catch(err=>next(err));
}
exports.logout = (request,response,next)=>{
    request.session.destroy(error=>{
        if(error){
            return next(error)
        }else{
            response.redirect('/user/login')
        }
    })
};