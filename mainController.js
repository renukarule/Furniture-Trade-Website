const express = require('express');

exports.about = (req,res,next) => {
    res.render('about');
}
exports.contact = (req,res,next) => {
    res.render('contact');
}