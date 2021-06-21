const express=require('express');
const router=express.Router({mergeParams:true});
const User=require('../schemas/UserSchema');
const bcrypt=require('bcrypt');

router.get('/',(req,res,next)=>{
  
    var payload={
        title:"Register"
    };
    res.status(200).render('register',{payload});
})
router.post('/',async(req,res,next)=>{
   
    var payload={
        title:"Register"
    };
    
     firstName=req.body.firstName.trim();
     lastName=req.body.lastName.trim();
     username=req.body.username.trim();
     email=req.body.email.trim();
     password=req.body.password;

    if(firstName && lastName && email && password){
        payload.errorMessage="";
        var user=await User.findOne({
            $or:[
                {username:username},
                {email:email}
            ]
        })
        .catch((err)=>{
            payload.errorMessage="Something Went Wrong";
            res.status(200).render('register',{payload});
        })

        if(user==null){
            //user not found
            req.body.password=await bcrypt.hash(req.body.password,10);
            const newUser=new User(req.body);
           // newUser.password=await bcrypt.hash(req.body.password,10);//both are correct
            await newUser.save();
            req.session.user=newUser;
            return res.redirect('/');
        }
        else{
            if(email==user.email){
                payload.errorMessage="Email already exists";
                
            }
            else{
                payload.errorMessage="Username already exists";
            }
            res.status(200).render('register',{payload});
        }

        //res.status(200).render('register',{payload});
    }
    else{
        payload.errorMessage="Mekse sure that each field has valid value!";
        res.status(200).render('register',{payload});
    }
})

module.exports=router;