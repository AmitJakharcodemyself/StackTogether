const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

const PostSchema=new Schema({
    content:{type:String,trim:true},
    postedBy:{type:Schema.Types.ObjectId,ref:'User'},
    pinned:{type:Boolean},
    likes:[{type:Schema.Types.ObjectId,ref:'User'}],
    retweetUsers:[{type:Schema.Types.ObjectId,ref:'User'}],
    retweetData:{type:Schema.Types.ObjectId,ref:'Post'},
    replyTo:{type:Schema.Types.ObjectId,ref:'Post'},
    images:[ImageSchema],
    

},{timestamps:true});

var Post=mongoose.model('Post',PostSchema);
module.exports=Post;