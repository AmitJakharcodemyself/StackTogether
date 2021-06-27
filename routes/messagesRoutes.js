const express = require('express');
const router = express.Router();
const User = require('../schemas/UserSchema');
const mongoose = require('mongoose');
const Chat=require('../schemas/ChatSchema');


router.get("/", (req, res, next) => {
    var payload= {
        title: "Inbox",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    };
    res.status(200).render("inboxPage", {payload});
})

router.get("/new", (req, res, next) => {
    var payload={
        title: "New message",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }
    res.status(200).render("newMessage", {payload});
})

router.get("/:chatId", async (req, res, next) => {

    var userId = req.session.user._id;
    var chatId = req.params.chatId;
    var isValidId = mongoose.isValidObjectId(chatId);


    var payload = {
        title: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    };

    if(!isValidId) {
        payload.errorMessage = "Chat does not exist or you do not have permission to view it.";
        return res.status(200).render("chatPage", {payload});
    }

    var chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } })
    .populate("users")
    .catch(error=>{
        res.sendStatus(400);
    });

    if(chat == null) {
        // Check if chat id is really user id
        var userFound = await User.findById(chatId);

        if(userFound != null) {
            // get chat using user id
            chat = await getChatByUserId(userFound._id, userId);
        }
    }

    if(chat == null) {
        payload.errorMessage = "Chat does not exist or you do not have permission to view it.";
    }
    else {
        payload.chat = chat;
    }

    res.status(200).render("chatPage", {payload});
})

function getChatByUserId(userLoggedInId, otherUserId) {
    return Chat.findOneAndUpdate({
        isGroupChat: false,
        users: {
            $size: 2,
            $all: [
                { $elemMatch: { $eq: mongoose.Types.ObjectId( userLoggedInId )}},
                { $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) }}
            ]
        }
    },
    {
        $setOnInsert: {
            users: [userLoggedInId, otherUserId]
        }
    },
    {
        new: true,
        upsert: true
    })
    .populate("users");
}

module.exports = router;