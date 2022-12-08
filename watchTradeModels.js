const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const watchList = new Schema({
    userId : {
        type: Schema.Types.ObjectId,ref:'User'
    },
    tradeId : [{
        type: Schema.Types.ObjectId,ref:'Trade'
    }],     
});

module.exports = mongoose.model('WatchList',watchList);