if(process.env.NODE_ENV !=='production'){
    require('dotenv').config();
}


const mongoose = require('mongoose');
const Post=require('./schemas/PostSchema');


const MONGOURI = process.env.MONGO_URI;
mongoose.connect(MONGOURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});



const seedDB = async () => {
    
}
//calling seedDB
seedDB().then(() => {
    mongoose.connection.close();
})
