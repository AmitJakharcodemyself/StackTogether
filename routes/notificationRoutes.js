const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const User = require('../schemas/UserSchema');
const Chat = require('../schemas/ChatSchema');

router.get("/", (req, res, next) => {
    var payload={
        title: "Notifications",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    };
    res.status(200).render("notificationsPage", {payload});
})

module.exports = router;