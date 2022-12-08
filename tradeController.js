const express = require('express');
const model = require('../models/trade');
const userModel = require('../models/user');
const watchList = require('../models/watchTradeModels')
const offerModels = require('../models/offerTradeModels');

exports.index = (request,response,next)=>{
    model.find()
    .then((trades)=>{
        let categories = [...
            new Set(trades.map(
              (object) => {
                return object.itemCategory
              })
    )];
    response.render('./tradeviews/trades',{trades,categories})
    })
    .catch(error=>{
        next(error)
    })
}
exports.new = (request, response,next)=>{
    response.render('./tradeviews/newTrade');
};
exports.feedback = (request, response,next)=>{
    response.render('./tradeviews/feedback');
};



exports.show = (request, response, next)=>{
    let id = request.params.id;
    console.log(id);
    let userId= request.session.user;
    Promise.all([userModel.findById(userId), model.findById(id)])
    .then(results=>{
        if(results){
        watchList.find({tradeId : id,userId : userId})
        .then((watchList)=>{
        if(watchList.length > 0){
            const [user, trade] = results;
             let addedToWatchList = true;
             response.render('./tradeviews/trade',{user,trade,addedToWatchList});
        }else{
            const [user, trade] = results;
            let addedToWatchList = false;
            response.render('./tradeviews/trade',{user,trade,addedToWatchList});
        }}).
        catch(error=>{
            next(error)
        });
    }
        else {
            let error = new Error('Cannot find a trade with id ' + id);
            error.status = 404;
            next(error);
        }
    });
};


    /*model.findById(id)
    .then(trades=>{
        if(trades){
            return response.render('./tradeviews/trade', {trades});
          }else{
              let error = new Error('Cannot find a trade with id ' + id);
              error.status = 404;
              next(error);
          }
        })
      .catch(error=>{
            next(error)
        }) 
};*/

  
exports.createNewTrade = (request, response,next)=>{

    let tradeDetails = new model(request.body);
    tradeDetails.owner = request.session.user;
    tradeDetails.imageURL = '/images/bookshelve.JPG';
    tradeDetails.save()
    .then((tradeDetail)=>{
        response.redirect('/trades');
    })
    .catch(error=>{
        if(error.name === "ValidationError"){
            error.status = 400;
        }
        next(error);
    }); 
};

exports.edit = (request, response, next)=>{
    let id = request.params.id;

    if(!id.match(/^[0-9a-fA-F]{24}$/)){
        let error = new Error ("Invalid trade id");
        error.status = 400; 
        return next(error);
    }
    model.findById(id)
    .then(trade=>{
    if(trade) {
        response.render('./tradeviews/edit', {trade});
    } else {
        let err = new Error('Cannot find a trade with id ' + id);
        err.status = 404 ;
        next(err);
        } 
    }) 
};

exports.updateTradeByID = (request,response,next) =>{
    let tradeId = request.params.id;
    let newTradeDetails = request.body;
    newTradeDetails.imageURL = '/images/bookshelve.JPG';
    if(!tradeId.match(/^[0-9a-fA-F]{24}$/)){
        let error = new Error ("Invalid item id");
        error.status = 400; 
        return next(error);
    }else{
        model.findByIdAndUpdate(tradeId,newTradeDetails,{useFindAndModify:false, runValidators:true})
        .then(tradeDetails=>{
            if(tradeDetails){
                response.redirect('/trades/'+tradeId); 
            }else {
                let error = new Error('Cannot find a tradeDetail with id ' + tradeId);
                error.status = 404;
                next(error);
            }
        })
        .catch(error=>{
            if(error.name === "ValidationError"){
                error.status = 400;
            }
            next(error)})
    }
  }

  exports.deleteTradeByID = (request,response,next) =>{
    let tradeId = request.params.id;
    if(!tradeId.match(/^[0-9a-fA-F]{24}$/)){
        let error = new Error ("Invalid story id");
        error.status = 400; 
        return next(error);
    }else{
    model.findByIdAndDelete(tradeId)
    .then(trade=>{
        if(trade){
            //response.redirect('/trades'); 
            return trade;
        }else {
            let error = new Error('Cannot find a trade with id ' + tradeId);
            error.status = 404;
            next(error);
        }
    }).then(trade=>{
        return offerModels.updateMany({
            requestedTrade: tradeId
        }, {status: "rejected"})
    }).then((trade)=>{
        return offerModels.updateMany({
            exchangeTrade: tradeId
        }, {status: "closed"})
    }).then(trade=>{
        console.log("Trade details are:",trade);
        response.redirect('/trades'); 
    })
    .catch(error=>{
        if(error.name === "ValidationError"){
            error.status = 400;
        }
        next(error)})
  }

  }

  exports.addToWatchList = (request,response,next) =>{    
    let tradeId = request.params.id;
    let userId = request.session.user;
    let addToWatchList = new watchList({tradeId : tradeId,userId : [userId]});
    //check if trade is already in favorite list, if already present don't do anything else add to favorites and display
    watchList.findOne({userId : userId})
    .then((watchListReceived)=>{
        if(!watchListReceived){
            addToWatchList.save()
            .then(()=>{
                //response.redirect('/trades/'+tradeId); 
                response.redirect('/users/watchTrade'); 
            }).catch(error=>{
                if(error.name === "ValidationError"){
                    error.status = 400;
                }
            });    
        }else{
            if(watchListReceived.tradeId.indexOf(tradeId) > -1) {
                request.flash('error','Already added to favorite elements')
            } else {
                watchListReceived.tradeId.push(tradeId);
                watchListReceived.save()
                .then(()=>{
                    //response.redirect('/trades/'+tradeId); 
                    response.redirect('/users/watchTrade'); 
                })
                .catch(error=>{
                    if(error.name === "ValidationError"){
                        error.status = 400;
                    }
                    next(error);
                });
                
            }
        }
    });
}

exports.removeFromWatchList = (request,response,next) =>{    
    let tradeId = request.params.id;
    let userId = request.session.user;
    watchList.findOne({userId : userId,tradeId:tradeId})
    .then((list)=>{
        list.tradeId.remove(tradeId);
        list.save()
        .then(()=>{
            //response.redirect('/trades/'+tradeId);
            response.redirect('/users/watchTrade');
        })
    }).catch(error=>{
        if(error.name === "ValidationError")
            error.status = 400;
        next(error);
    })
}

