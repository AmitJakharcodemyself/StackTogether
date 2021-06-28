if(process.env.NODE_ENV !=='production'){
    require('dotenv').config();
}

const express=require('express');
const port=3000;
const ejsMate = require('ejs-mate');
const ejsLocals=require('ejs-locals');
const path=require('path');
const middleware=require('./middleware');
const mongoose=require('./database');
const session=require('express-session');
const flash=require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

//START APP
const app =express();

//SERVING ON ON PORT
const server=app.listen(port,()=>{
    console.log(`Server Listening on ${port}`);
});

const io=require('socket.io')(server,{pingTimeout:60000});

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
const searchRoute=require('./routes/searchRoutes');
const messagesRoute=require('./routes/messagesRoutes');
const notificationsRoute=require('./routes/notificationRoutes');

//Api Routes
const postsApiRoute=require('./routes/api/posts');
const usersApiRoute=require('./routes/api/users');
const chatsApiRoute=require('./routes/api/chats');
const messagesApiRoute=require('./routes/api/messages');
const notificationsApiRoute=require('./routes/api/notifications');

app.use('/login',loginRoute);
app.use('/register',registerRoute);
app.use('/logout',logoutRoute);
app.use('/posts',middleware.requireLogin,postRoute);
app.use('/profile',middleware.requireLogin,profileRoute);
app.use('/search',middleware.requireLogin,searchRoute);
app.use('/messages',middleware.requireLogin,messagesRoute);
app.use('/notifications',middleware.requireLogin,notificationsRoute);

app.use("/api/posts",middleware.requireLogin,postsApiRoute);
app.use("/api/users",usersApiRoute);
app.use("/api/chats",chatsApiRoute);
app.use("/api/messages",messagesApiRoute);
app.use("/api/notifications",notificationsApiRoute);



app.get('/',middleware.requireLogin, (req,res)=>{
    var payload={
        title:"Home",
        userLoggedIn:req.session.user,
        userLoggedInJs:JSON.stringify(req.session.user),
    }
   
    res.status(200).render('home',{payload});
})

io.on("connection", socket => {

    socket.on("setup", userData => {
        socket.join(userData._id);
        socket.emit("connected");
    })

    socket.on("join room", room => socket.join(room));
    socket.on("typing", room => socket.in(room).emit("typing"));
    socket.on("stop typing", room => socket.in(room).emit("stop typing"));


    socket.on("new message", newMessage => {
        var chat = newMessage.chat;

        if(!chat.users) return console.log("Chat.users not defined");

        chat.users.forEach(user => {
            
            if(user._id == newMessage.sender._id) return;
           // console.log(user);
            socket.in(user._id).emit("message received", newMessage);
        })
    });

})

