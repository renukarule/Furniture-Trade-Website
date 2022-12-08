const tradeModel = require ('../models/trade');
const offerModel = require('../models/offerTradeModels');
const userModel = require('../models/user');
const watchListModel = require('../models/watchTradeModels')
const flash = require('connect-flash/lib/flash');
exports.createTrade = (request,response,next)=>{
    let id = request.session.user;
    let tradeId = request.params.id;
    console.log(request.body)
    tradeModel.find({owner:id,status:"available"})
    .then((trades)=>{
        response.render('./tradeviews/offerTradeList', {trades,tradeId})
    }).catch(error=>{
        if(error.name === "ValidationError")
            error.status = 400;
        next(error);
    })
}

exports.createTradeRequest = (request,response,next)=>{
    let offerOnTrade = request.body.offerOn;
    let fromUId = request.session.user;
    let offerFor = request.body.offerFor;
    tradeModel.findOne({_id:offerOnTrade})
    .then((trades)=>{
        let toUserId = trades.owner;
        let tradeDetails = {
            requestFrom : fromUId,
            requestTo : toUserId,
            exchangeTrade : offerOnTrade,
            requestedTrade : offerFor,
            status : "pending"
        }
        let offerModelDetails = new offerModel(tradeDetails);
        offerModelDetails.save(tradeDetails)
        .then((offerDetails)=>{
            console.log("offerDetails",offerDetails)
            tradeModel.update({_id:offerFor},{$set:{status:"pending"}},{multi: true})
            .then((tradesUpdated)=>{
                console.log("Trade updated",tradesUpdated)
                offerModel.find({"requestFrom":fromUId,"status":{$ne:"closed"}}).populate('requestFrom')
                .populate('requestTo')
                .populate('exchangeTrade')
                .populate('requestedTrade')
                .then(myOffers=>{
                    response.redirect('/tradeRequest/userRequestedTrades')
                }).catch(error=>{
                    console.log(error)
                    request.flash('error',"Error in retrieving your trade request");
                    response.redirect('/')
                })
                
            }).catch(error=>{
                error.status = 400;
                next(error);
            })
        })
        .catch(error=>{
            console.log(error)
            request.flash('error',"Error in making trade request");
            next(error);
        })
        
    })
    .catch(error=>{
        error.status = 400;
        request.flash('error',"Cannot find trade id: "+offerOnTrade);
        next(error);
    })
}


exports.getInboundTradeRequest = (request,response,next)=>{
    let userId = request.session.user
    offerModel.find({'requestTo':userId,"status":{$nin:["closed","accepted","rejected"]}})
        .populate('requestFrom')
        .populate('requestTo')
        .populate('exchangeTrade')
        .populate('requestedTrade').then(myOffers=>{
            response.render('./users/inboundTradeRequests', {myOffers})
        }).catch(error=>{
            console.log(error)
            request.flash('error',"Error in retrieving your trade request");
            response.redirect('/')
        })
}

exports.deleteTrade = (request,response,next) =>{
    let tradeId = request.params.id; 
    let userID = request.session.user
    offerModel.findOne({
        requestFrom: userID,
        _id: tradeId
      }).then(trade => {
        if (!trade) {
          throw new Error("No such trade request");
        }else{
            let fromTrade = trade.requestedTrade._id;
            console.log("fromTrade",fromTrade)
            tradeModel.findByIdAndUpdate(fromTrade,{status:"available"},{useFindAndModify:false, runValidators:true})
            .then(updatedTrade=>{
                return updatedTrade;
            }).catch(error=>{
                console.log(error)
            })
        }
        return trade.update({status: "closed"});
      }).then(() => {
        response.redirect("/tradeRequest/userRequestedTrades");
      }).catch(err => {
        console.log(err);
        request.flash('error','Error in deleting offer');
        response.redirect("/tradeRequest/userRequestedTrades");
      });
}

exports.acceptTrade = (request,response,next) =>{
    let userId = request.session.user;
    console.log("User id is",userId)
    let tradeId = request.params.id;
    console.log("Trade id is",tradeId)
    offerModel.findOne({_id: tradeId, requestTo: userId})
    .populate('requestFrom')
    .populate('requestTo')
    .populate('requestedTrade')
    .populate('exchangeTrade')
    .then(trade=>{
        if(!trade){
            throw new Error("No such trade request");
        }
        let tradeRequestedBy = trade.requestFrom._id;
        return offerModel.rejectTradeRelateToArts(trade).then(() => {
            trade.requestedTrade.owner = trade.requestTo._id;
            trade.requestedTrade.status = "available";
            return trade.requestedTrade.save();
          }).then(() => {
            if (trade.exchangeTrade) {
              trade.exchangeTrade.owner = tradeRequestedBy;
              trade.exchangeTrade.status = "available";
              return trade.exchangeTrade.save();
            }
          }).then(() => {
            trade.status = "accepted";
            return trade.save();
          }).then(() => {
            response.redirect("/tradeRequest/inboundTradeRequestForUser");
          });
    }).catch(err => {
        request.flash('error','Error in accepting offer, try again');
        response.redirect("/tradeRequest/inboundTradeRequestForUser");
        console.log(err)
    });
};

exports.rejectTrade = (request,response,next) =>{
    let userId = request.session.user;
    let tradeId = request.params.id;
    console.log("userId",userId);
    console.log("tradeId",tradeId);
    offerModel.findOne({_id: tradeId, requestTo: userId})
    .populate('requestFrom')
    .populate('requestTo')
    .populate('requestedTrade')
    .populate('exchangeTrade')
    .then(trade=>{
        trade.update({status:"rejected"}).then(tradeUpdated=>{
            let fromTrade = trade.requestedTrade._id;
            console.log("fromTrade",fromTrade)
            return tradeModel.findByIdAndUpdate(fromTrade,{status:"available"},{useFindAndModify:false, runValidators:true})
            .then(()=>{
                response.redirect("/tradeRequest/inboundTradeRequestForUser");
            })   
        })
    }).catch(error=>{
        next(error);
    })
}

exports.getTradeRequests = (request,response,next)=>{
    let userId = request.session.user
    console.log("user id is",userId)
    offerModel.find({'requestFrom':userId,"status":{$nin:["closed","accepted","rejected"]}})
        .populate('requestFrom')
        .populate('requestTo')
        .populate('exchangeTrade')
        .populate('requestedTrade').then(myOffers=>{
            response.render('./users/TradeRequests', {myOffers})
        }).catch(error=>{
            console.log(error)
            request.flash('error',"Error in retrieving your trade request");
            response.redirect('/')
        })
}