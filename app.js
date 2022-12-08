const express = require('express');
const morgan = require('morgan');
var methodOverride = require('method-override')
const tradeRoute = require('./routes/tradeRoute')
const mainRoute = require('./routes/mainRoute')
const userRoute = require('./routes/userRoute')
const tradeRequestRoute = require('./routes/tradeRequestRoutes');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const multer = require('multer');
require('./models/offerTradeModels');
require('./models/user');
require('./models/watchTradeModels')


const app = express();  
let host = 'localhost';
let port = 3000;

app.set('view engine','ejs');

mongoose.connect('mongodb://localhost:27017/trade',{ useNewUrlParser: true, useUnifiedTopology: true})
.then(()=>{
    app.listen(port, host, ()=>{
    console.log('Server is running on port', port);
    });
})

//mount middlware
app.use(
    session({
        secret: "ajfeirf90aeu9eroejfoefj",
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({mongoUrl: 'mongodb://localhost:27017/trade'}),
        cookie: {maxAge: 60*60*1000}
        })
);
app.use(flash());
app.use((req, res, next) => {
    //console.log(req.session);
    res.locals.user = req.session.user || null;
    res.locals.errorMessages = req.flash('error');
    res.locals.successMessages = req.flash('success');
    next();
});

//storage
const Storage = multer.diskStorage({
    destination: 'uploads',
    filename:(req,file,cb) =>{
        cb(null, file.originalname);
    },
});

const upload = multer({
    storage: Storage
}).single('imageURL')

app.post('/upload',(req, res)=>{
    upload(req, res, (err)=>{
        if(err){
            console.log(err);
        }
        else{
            const newImage = new ImageModel({
                image: {
                    data: req.file.filename,
                    contentType: 'image/png'
                }
            })
            newImage.save()
            .then(()=>res.send('successfully uploaded')).catch(err=>console.log(err));
        }
    })
})

app.set('views', __dirname + '/views')
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(morgan('tiny'));
app.use(methodOverride('_method'))
app.get('/',(req,res)=>{
    res.render('index');
});

app.use('/trades',tradeRoute);
app.use('/', mainRoute);
app.use('/users',userRoute);
app.use('/tradeRequest', tradeRequestRoute);


app.use((req,res,next)=>{
    let err = new Error('Server cannot locate '+req.url);
    err.status = 404;
    next(err); 
});
app.use((err,req,res,next) => {
    console.log(err.stack);
    if(!err.status){
        err.status = 500;
        err.message = ("Internal Server Error");
    }
    res.status(err.status)
    res.render('error',{error : err});
});