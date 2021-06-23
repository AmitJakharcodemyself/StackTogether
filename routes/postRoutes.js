const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require('../schemas/UserSchema');

router.get("/:id", (req, res, next) => {

    var payload = {
        title: "View post",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        postId: req.params.id//also adding in main layout script
    }
    
    res.status(200).render("postPage", {payload});
})

module.exports = router;