const express=require('express');
const router=express.Router({mergeParams:true});
const User=require('../../schemas/UserSchema');
const Post=require('../../schemas/PostSchema');
const multer = require('multer');
const { storage } = require('../../cloudinary/index');
const upload = multer({ storage });
const Notification = require('../../schemas/NotificationSchema');


router.get("/", async (req, res, next) => {

    var searchObj = req.query;
    
    if(searchObj.isReply !== undefined) {
        var isReply = searchObj.isReply == "true";
        searchObj.replyTo = { $exists: isReply };
        delete searchObj.isReply;
    }

    if(searchObj.search !== undefined) {
        searchObj.content = { $regex: searchObj.search, $options: "i" };
        delete searchObj.search;
    }

    if(searchObj.followingOnly !== undefined) {
        var followingOnly = searchObj.followingOnly == "true";

        if(followingOnly) {
            var objectIds = [];
            
            if(!req.session.user.following) {
                req.session.user.following = [];
            }

            req.session.user.following.forEach(user => {
                objectIds.push(user);
            })

            objectIds.push(req.session.user._id);
            searchObj.postedBy = { $in: objectIds };
        }
        
        delete searchObj.followingOnly;
    }

    var results = await getPosts(searchObj);
    res.status(200).send(results);
})

router.get("/:id", async (req, res, next) => {
    var postId = req.params.id;

    var postData = await getPosts({ _id: postId });
    postData = postData[0];

    var results = {
        postData: postData
    }

    if(postData.replyTo !== undefined) {
        results.replyTo = postData.replyTo;
    }

    results.replies = await getPosts({ replyTo: postId });

    res.status(200).send(results);;
})


router.post('/',upload.array('image'), async(req,res,next)=>{
   // res.send("hello");
    console.log(req.files);
    
    console.log(req.body);
//return  res.redirect('/');
    if(!req.body.content){
        console.log("content is not given");
        return res.sendStatus(400);
    }
    var postData={
        content:req.body.content,
        postedBy:req.session.user
    };

    if(req.body.replyTo) {
       // console.log("reply")
       // console.log(postData);
        postData.replyTo = req.body.replyTo;
        try{
            var newPost =new Post(postData);
          //remove image part
            await newPost.save();
            //populate
            // await newPost.populate('postedBy');
            newPost= await User.populate(newPost,{path:"postedBy"});// is newPost is not Const
            newPost = await Post.populate(newPost, { path: "replyTo" });
            

            if(newPost.replyTo !== undefined && newPost.replyTo.postedBy!=req.session.user._id) {
                await Notification.insertNotification(newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id);
            }
           // return res.status(201).send(newPost);
           return res.status(201).send(newPost);
            }
            catch(error){
                console.log(error);
              return  res.sendStatus(400);
            }
    }

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
    if(!isLiked) {
        await Notification.insertNotification(post.postedBy, userId, "postLike", post._id);
    }

   return res.status(200).send(post)
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
    if(!deletedPost) {
        await Notification.insertNotification(post.postedBy, userId, "retweet", post._id);
    }

    res.status(200).send(post)
})

router.delete("/:id", async(req, res, next) => {
    var postId=req.params.id;
    var deleting_post=getPosts({_id:postId});

    //delete images from cloudinary stored in This post
    if(deleting_post.images && deleting_post.images.length){
    for (let img of deleting_post.images) {
        await cloudinary.uploader.destroy(img.filename);
    }
    }
    //delete tha POST from Schema

    Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(200))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})

router.put("/:id", async (req, res, next) => {

    if(req.body.pinned !== undefined) {
        await Post.updateMany({postedBy: req.session.user }, { pinned: false })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })
    }

    Post.findByIdAndUpdate(req.params.id, req.body)
    .then(() => res.sendStatus(204))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})

async function getPosts(filter) {
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({ "createdAt": -1 })
    .catch(error => console.log(error))

    results=await User.populate(results,{path:"replyTo.postedBy"});
    return await User.populate(results, { path: "retweetData.postedBy"});
}

module.exports=router;