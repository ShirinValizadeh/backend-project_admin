const express = require('express');
const app = express();
let fs = require('fs');  //1
const fileUpload = require('express-fileupload')
const session = require('express-session')
const cookie = require('cookie-parser')
//const dataModules = require('./modules/mongooseDataModule')
const dataModules = require('./modules/mysqlDataModule')
const adminRouter = require('./routes/adminRouter')
//const auth = require('./routes/auth')


//creat session object options
const sessionOptions = {
  secret: 'bookStore',
  //resave: false,  for debuger
  //saveUninitialized: true,
  //cookie: { secure: true } 
  cookie: {}
}

app.use(session(sessionOptions)) //use a session  
app.use(cookie()) // use cookie-parser
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json())  //! check if req is a json will convert to obj  wenn({extended:false})
// set limit for file
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
//add the usage of any router all after others middeleware
//app.use(bla()) >> is middleware
app.use('/admin', adminRouter)
//app.use('/auth', auth)
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


//*=================login===============
app.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/admin')
  }else{
      res.render('login')
  }

});

app.post('/login', (req, res) => {
  //!check cookie is save inside browser(req)
 // console.log(req.body);
  if (req.body.email && req.body.password) {
    dataModules.checkUser(req.body.email.trim(), req.body.password).then(user => {
      req.session.user = user
    //  console.log(user); 
      res.json(1)
    }).catch(error => {
      if (error == 3) {
        res.json(3)
      } else {
        res.json(4)
      }
    })
  } else {
    res.json(2)
  }


});
//*================== render main file 
app.get('/', (req, res) => {
  res.render('main')
});

//*================render register file
app.get('/register', (req, res) => {
  res.render('register')
});

//post app.post

app.post('/register', (req, res) => {
  console.log(req.body);

  const password = req.body.password
  const email = req.body.email.trim()
  const password_confirmation = req.body.password_confirmation

  if (email && password && password == password_confirmation) {

    dataModules.registerUser(email, password).then(() => {
      res.json(1) //user register success
    }).catch(error => {
      console.log(error);
      if (error == "exist") {
        res.json(3)  // user exist
      } else {
        res.json(4) // server error
      }
    })

  } else {
    res.json(2) // user register not seccess
  }
});


//*==========================shop rout
app.get('/shop', (req, res) => {
  dataModules.getAllBooks().then(books => {  //call func from dataModule line 93
    res.render('shop', { books })
  })

});


app.get('/book/:booktitle/:id', (req, res) => {
  //res.send(req.params.id);

  dataModules.getBook(req.params.id).then(book => {
    let checkLogin = false
    if (req.session.user) {
      checkLogin = true
    }
    res.render('book', { book , checkLogin })
  }).catch(error => {
    res.send('404 , book could not be open');
  })


  // res.render('productSingle')
});


app.listen(3000, () => {
  console.log('App listening on port 3000!');
});