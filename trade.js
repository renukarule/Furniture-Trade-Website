const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {DateTime} = require('luxon');
const {v4 :uuidv4} = require('uuid');

const tradesSchema = new Schema({
itemname : {
        type: String,
        required:[true,"Item name is required"]
    },
owner: {type: Schema.Types.ObjectId, ref: 'User'},
itemCategory : {
        type: String,
        required:[true,"Category of item is required"]
    },
fullName : {
        type: String,
        required:[true,"Full name is required"]
    },
emailId : {
        type : String,
        required:[true,"Dimension is required"]
    },
materialType : {
        type : String,
        required:[true,"Material Type of item is required"]
    },
dimension : {
        type : String,
    },
status:{
        type : String,
        enum: ["available", "pending", "traded"],
        required : [true, "Status is required"],
        default : "available"
    },
details : {
        type: String,
        required:[true,"Details of item is required"],
        minLength : [30,"Description of item should be greater than 30 characters"]
    },
/*imageURL : {
        data : Buffer,
        contentType: String
    },*/
imageURL : {
        type : String,
        //required :[true,"Item image is required"],
    },
},
{timestamps : true}
);

module.exports = mongoose.model('Trades',tradesSchema);



