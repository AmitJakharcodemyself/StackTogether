if(process.env.NODE_ENV !=='production'){
    require('dotenv').config();
}

const express=require('express');
const ejsMate = require('ejs-mate');
const ejsLocals=require('ejs-locals');
const path=require('path');
const middleware=require('./middleware');
const mongoose=require('./database');
const session=require('express-session');
const flash=require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

const port=3000;


//START APP
const app =express();

//SET TEMPLATE ENGINE

app.engine('ejs', ejsMate)
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

//Body-Parser,Public folder
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))

//SESSION 
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const sessionConfig={
    secret,
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:Date.now() +1000*60*60*24*7,
        maxAge:Date.now() +1000*60*60*24*7
    }
}
app.use(session(sessionConfig));
app.use(flash());

//LOCAL SESSION STOTAGE
app.use((req, res, next) => {//do it before routes
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.userLoggedIn=req.session.user;//from session storage;
    next();
})

//ROUTES
const loginRoute=require('./routes/loginRoutes');
const registerRoute=require('./routes/registerRoutes');
const logoutRoute=require('./routes/logoutRoutes');
const postRoute=require('./routes/postRoutes');
const profileRoute=require('./routes/profileRoutes');

//Api Routes
const postsApiRoute=require('./routes/api/posts');
const usersApiRoute=require('./routes/api/users');

app.use('/login',loginRoute);
app.use('/register',registerRoute);
app.use('/logout',logoutRoute);
app.use('/posts',middleware.requireLogin,postRoute);
app.use('/profile',middleware.requireLogin,profileRoute);

app.use("/api/posts",middleware.requireLogin,postsApiRoute);
app.use("/api/users",usersApiRoute);



app.get('/',middleware.requireLogin, (req,res)=>{
    var payload={
        title:"Home",
        userLoggedIn:req.session.user,
        userLoggedInJs:JSON.stringify(req.session.user),
    }
   
    res.status(200).render('home',{payload});
})



//SERVING ON ON PORT
app.listen(port,()=>{
    console.log(`Server Listening on ${port}`);
});