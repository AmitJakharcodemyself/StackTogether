const express=require('express');
const router=express.Router({mergeParams:true});
const User=require('../schemas/UserSchema');
const bcrypt=require('bcrypt');

router.get('/',(req,res,next)=>{
    
    if(req.session){
        req.session.destroy(()=>{
            return res.redirect('/login');
        })
    }


});


module.exports=router;