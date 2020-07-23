const fs = require('fs');  //1
const passwordHash = require('password-hash')

function registerUser(email,password) {
    //use promis 
    return new Promise((resolve , reject)=>{
      //read data use fs
      const readData = fs.readFileSync('./users.json')
      //convert to object
      const data = JSON.parse(readData)
      
      //check user email is exist using ES6 
      const existUser = data.users.find(user => user.email == email)
      if (existUser) {  // if there is same email as what user write than is error 
        reject('exist')  //line 60 app.js
      }else{
        data.users.push({
          id:data.newId ,
          email: email,
         // password:password,
          password:passwordHash.generate(password)  // it will not show password
        })
        //increase the newId property for data for next registerd user
        data.newId++
        //convert data to json and write it in users.json
        fs.writeFileSync('./users.json' , JSON.stringify(data))
        resolve()
      }
    })
 

  }



function addBook(bookTitle, bookDescription , bookPdf , bookImg ) {

  return new Promise ((resolve,reject)=>{
    //check if book title is not exist if exist res.json(3)

    //read books.json
    const booksJson =fs.readFileSync('./books.json' )
    //convert them
    const booksObj = JSON.parse(booksJson)
   const validBook = booksObj.books.find(book =>book.title == bookTitle && book.userId == 1)
   if (validBook) {
      reject(3)
   }else{
         // array will contain the url of imges to be save in the books.json
    const imgArr = []
    bookImg.forEach((img , idx) => {
      let ext = img.name.substr(img.name.lastIndexOf('.'))  //.jpg
      // set new img name without space
      let newName = bookTitle.trim().replace(/ /g, '_' )+ '_'+ 1+ '_' + idx + ext
      img.mv('./public/uploadedFiles/' + newName)
      imgArr.push('/uploadedFiles/' + newName)
    });
    //pdf dont need ext is olways '.pdf'
    //set new name for pdfname
    let pdfName = bookTitle.trim().replace(/ /g , '_')+'_' + 1 + '.pdf'
    //mv pdf file with new name to uploadedfile
    bookPdf.mv('./public/uploadedFiles/' + pdfName) 
    //!set the pdfUrl that gonna be saved in the json file
    let pdfNewUrl = '/uploadedFiles/' + pdfName


    //push them in books.json
    booksObj.books.push({
      id:booksObj.newid,
      title: bookTitle.trim(),
      description:bookDescription,
      imgs : imgArr ,
      pdfUrl :pdfNewUrl,
      userId : 1
    })
    //increase the newId 
    booksObj.newid ++
    //save the booksObj to books.json
    fs.writeFileSync('./books.json' , JSON.stringify(booksObj)) //!
    resolve()
   }

  })

}



function getAllBooks() {
  return new Promise((resolve , reject) =>{
    const booksJson = fs.readFileSync('./books.json')
    // convert to obj
    const booksObject = JSON.parse(booksJson)
    //export obj using resolve 
    resolve(booksObject.books)
  })
}


//==========
function getBook(id) {
  return new Promise ((resolve,reject) =>{
    const booksJson = fs.readFileSync('./books.json')
    const blabookObject = JSON.parse(booksJson)
    //find a book with id
    const foundBook = blabookObject.books.find(book => book.id == id)
    if (foundBook){
      resolve(foundBook)
    }else{
      reject(new Error('can not find book with this id : ' + id))
    }
  })
}

//====================
function checkUser(email , password) {
    return new Promise((resolve , reject)=>{
      const usersJson = fs.readFileSync('./users.json')
      const usersObj = JSON.parse(usersJson)
      const matchUser = usersObj.users.find(user => user.email == email )
      if (matchUser) {
          if (passwordHash.verify(password , matchUser.password)) {  //!!====
            resolve(matchUser)
          }else{
            reject(3)
          }
      }else{
          reject(3)
      }
    })
}

  module.exports = {registerUser,addBook , getAllBooks , getBook , checkUser}