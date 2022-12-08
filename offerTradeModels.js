const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const offerSchema = new Schema({
    requestFrom : {
        type: Schema.Types.ObjectId,ref:'User',
    },
    requestTo : {
        type: Schema.Types.ObjectId,ref:'User',
    }, 
    requestedTrade:{
        type: Schema.Types.ObjectId,ref:'Trades',
    },
    exchangeTrade :{
        type: Schema.Types.ObjectId,ref:'Trades',
    },
    status :{
        type : String,
        enum: ["opened", "closed", "rejected", "accepted","pending"],
        required : [true, "Status is required"],
    }
});

offerSchema.statics.rejectTradeRelateToArts = function (trade){
    let offerRequest = this;
    return offerRequest.update({
        status: "opened",
         requestedTrade: trade.requestedTrade._id,
        _id: {
          $ne: trade._id
        }
      }, {status: "rejected"}, {multi: true})
    
        .then(() => {
          return offerRequest.update({
            status: "opened",
            exchangeTrade: trade.requestedTrade._id
          }, {status: "closed"}, {multi: true});
        })
        .then(() => {
          if (trade.exchangeTrade) {
            return offerRequest.update({
              status: "opened",
              requestedTrade: trade.requestedTrade._id,
              _id: {
                $ne: trade._id
              }
            }, {status: "closed"}, {multi: true});
          }
        })
        .then(() => {
          if (trade.exchangeTrade) {
            return offerRequest.update({
              status: "opened",
              requestedTrade: trade.exchangeTrade._id
            }, {status: "closed"}, {multi: true});
          }
        });
}
module.exports = mongoose.model('Offers',offerSchema);
