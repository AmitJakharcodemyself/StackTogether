const express=require('express');
const router=express.Router({mergeParams:true});
const User=require('../../schemas/UserSchema');
const Post=require('../../schemas/PostSchema');
const multer = require('multer');
const { storage } = require('../../cloudinary/index');
const upload = multer({ storage });

router.get("/", async (req, res, next) => {
    var results = await getPosts({});
    res.status(200).send(results);
})

router.get("/:id", async (req, res, next) => {

    var postId = req.params.id;

    var results = await getPosts({ _id: postId });
    results = results[0];

    res.status(200).send(results);
})


router.post('/',upload.array('image'), async(req,res,next)=>{
    //console.log(req.files);
    //console.log(req.body);
//return  res.redirect('/');
    if(!req.body.content){
        console.log("content is not given");
        return res.sendStatus(400);
    }
    var postData={
        content:req.body.content,
        postedBy:req.session.user
    };
    try{
    var newPost =new Post(postData);
    newPost.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await newPost.save();
    //populate
    // await newPost.populate('postedBy');
    newPost= await User.populate(newPost,{path:"postedBy"});// is newPost is not Const
   // return res.status(201).send(newPost);
   return res.status(200).redirect('/');
    }
    catch(error){
        console.log(error);
      return  res.sendStatus(400);
    }
})

router.put("/:id/like", async (req, res, next) => {

    var postId = req.params.id;
    var userId = req.session.user._id;

    var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    var option = isLiked ? "$pull" : "$addToSet";

    // Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { likes: postId } }, { new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    // Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option]: { likes: userId } }, { new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })


    res.status(200).send(post)
})
//till NOW**
router.post("/:id/retweet", async (req, res, next) => {
    var postId = req.params.id;
    var userId = req.session.user._id;

    // Try and delete retweet
    var deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: postId })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    var option = deletedPost != null ? "$pull" : "$addToSet";

    var repost = deletedPost;

    if (repost == null) {
        repost = await Post.create({ postedBy: userId, retweetData: postId })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })
    }

    // Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { retweets: repost._id } }, { new: true })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    // Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } }, { new: true })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })


    res.status(200).send(post)
})

async function getPosts(filter) {
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .sort({ "createdAt": -1 })
    .catch(error => console.log(error))

    return await User.populate(results, { path: "retweetData.postedBy"});
}

module.exports=router;