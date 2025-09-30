require('dotenv').config();
require('./config/database').connect();
const User = require('./user');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("Hello World")
})
app.post('/register', async (req, res) => {
try {
    const {firstname, lastname, email, password} = req.body
    if(!(firstname && lastname && email && password)){
        res.status(400).send("All fields are compulsory")
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) {
        res.status(401).send("User already exists with this email")
    }
    const myEncPassword = await bcrypt.hash(password, 10) 
    const user = await User.create({
        firstname,
        lastname,
        email,
        password: myEncPassword
    })
    const token = jwt.sign(
        {id: user._id, email},
        'shhhh',
        {
            expiresIn: '2h'
        }
    );
    user.token = token
    user.password = undefined

    

    res.status(201).json(user)
    
    
} catch (error) {
    console.log(error);
}
})
app.post('/login', async (req, res) => {
    try {
        // get all data from frontend
        //validation
        if (!(email && password)) {
            res.status(400).send("send all data")
        }
        const user = await User.findOne({email})
        //if user is not there , then what?
        // match password
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                {id: user._id,},
                'shhhh',
            {
                 expiresIn: '2h'
           }
         );
         user.token = token
         user.password = undefined
        }
        //find user in deb
        //match password
        // send a token in user cookie
        //cookie Parser
     const options = {
        expires: new Date(Date.now() + 3*24*60*60*1000),
        httpOnly: true,
     };
     res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        user
     })
    } catch (error) {
        console.log(error);
    }
})
app.get("/dashboard", (req, res) => {
    //grab token from user cookie
    console.log("Cookies: ", req.cookies);
    const {token} = req.cookies.token
    //if no token, stop there
    if(!token){
    //decode the token and get id

    //query to DB for that user id


    res.send("Welcome to dashboard")
})
module.exports = app;