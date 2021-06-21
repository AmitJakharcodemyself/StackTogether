const express=require('express');
const router=express.Router({mergeParams:true});
const User=require('../schemas/UserSchema');
const bcrypt=require('bcrypt');

router.get('/',(req,res,next)=>{
   
    var payload={
        title:"login"
    };
    res.status(200).render('login',{payload});
});
router.post('/',async(req,res,next)=>{
 
    var payload={
        title:"login"
    };
    if(req.body.logUsername && req.body.logPassword){
        payload.errorMessage="";
        var user=await User.findOne({
            $or:[
                {username:req.body.logUsername },
                {email:req.body.logUsername }
            ]
        })
        .catch((err)=>{
            payload.errorMessage="Something Went Wrong";
            res.status(200).render('login',{payload});
        })

    if(user!=null){
        var result=await bcrypt.compare(req.body.logPassword,user.password);
        if(result===true){
            req.session.user=user;
            req.flash('success','welcome to Dev-Connector');
            return res.redirect('/');
        }
    }
    payload.errorMessage="Incorrect Username or Password";
    return res.status(200).render('login',{payload});
    }
    else{
        payload.errorMessage="Mekse sure that each field has valid value!";
        res.status(200).render('login',{payload});
    }
})

module.exports=router;