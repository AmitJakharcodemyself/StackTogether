//CONNECT TO DATABASE
const mongoose=require('mongoose'); 
const MONGOURI=process.env.MONGO_URI;

class Database{
    constructor(){
        this.connect();
    }
    connect(){
        mongoose.connect(MONGOURI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify:false
        });
        
        const db = mongoose.connection;
        db.on("error", console.error.bind(console, "connection error:"));
        db.once("open", () => {
            console.log("Database connected");
        });

    }
}

module.exports=new Database();