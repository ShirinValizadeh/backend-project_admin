const express = require('express');
const userMoudel= require('../modules/dataModule')
const authRoute = express.Router()



//!   is better wenn we write /register , /login , ... here 




/* 
authRoute.get('/login' , (res,req)=>{
    res.render('login')
})


authRoute.post('/login' , (req,res)=>{
    let username=req.body.username
    let password=req.body.password
userMoudel.registerUser(username , password).then((data)=>{
        if (data) {
            res.json(data)
        }else{
            res.send('error');
        }
}).catch(()=>{
    res.send('errrrrrro');
})
})

 */





module.exports = authRoute