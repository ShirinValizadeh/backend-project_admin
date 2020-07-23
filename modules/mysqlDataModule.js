const passwordHash = require('password-hash')
//const { MongoClient, ObjectID } = require('mongodb')
const mysql = require('mysql')
const fs = require('fs')
const { resolve } = require('path')


//!4 creat user schema
/* const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}) */



//! creat books schema
/* const bookSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    pdfUrl: {
        type: String,
        required: true
    },
    imgs: {
        type: [String],
        required: true,
        min: 1
    },
    userId: {
        type: String,
        required: true
    }
}) */



//!1 connect mysql
let con = null
function connect() {
    return new Promise((resolve, reject) => {
        if (con) {
            if (con.state === 'disconnected') {
                con.connect(err => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve()
                    }
                })
            } else {
                resolve()
            }
        } else {
            con = mysql.createConnection({
                multipleStatements:true,
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'fbw5_test'
            })
            con.connect(err => {
                if (err) {
                    reject(err)
                } else {
                    resolve(err)
                }
            })
        }
    })
}

function runQuery(queryString) {
    return new Promise ((resolve , reject)=>{
        connect().then(()=>{
            con.query(queryString , (err , result , fields)=>{
                if (err) {
                    reject(err)
                }else{
                    resolve(result)
                }
            })
        }).catch(error =>{
            reject(error)
        })
    })
}


//! registerUser mysql
function registerUser(email, password) {
    return new Promise((resolve, reject) => {
        runQuery(`INSERT INTO users (email , password) VALUES ('${email}', '${passwordHash.generate(password)}')`).then(() => {
            resolve()
            
        }).catch(error => {
            if (error.errno === 1062) {
                reject('exist')
            } else {
                reject(error)
            }
        })
    })
}





//! checkuser mysql
function checkUser(email, password) {
    return new Promise((resolve, reject) => {
        //any result(user) from select query will be return as a ARR
        runQuery(`SELECT * FROM users WHERE email like '${email}'`).then(user => {
            if (user.length === 0) {
                reject(3)
                
            } else {
               if (passwordHash.verify(password, user[0].password)) {
                   user[0]._id = user[0].id
                   
                    resolve(user[0])
                } else {
                    reject(3)
                }
            }

        }).catch(error => {
            reject(error)
        })
    })


}








function addBook(bookTitle, bookDescription, bookPdf, bookImg, bookId) {
    return new Promise((resolve, reject) => {
        runQuery(`SELECT * FROM books WHERE id like '${bookId}' AND WHERE title like '${bookTitle}'`).then((book) => {
            if (book.length === 0) {
                reject(3)
                
            }else{
                const imgArr = []
                bookImg.forEach((img, idx) => {
                    let ext = img.name.substr(img.name.lastIndexOf('.'))
                    let newName = bookTitle.trim().replace(/ /g, '_') + '_' + bookId + '_' + idx + ext
                    img.mv('./public/uploadedFiles/' + newName)
                    imgArr.push('/uploadedFiles/' + newName)
                });
                let pdfName = bookTitle.trim().replace(/ /g, '_') + '_' + bookId + '.pdf'
                    bookPdf.mv('./public/uploadedFiles/' + pdfName)
                    let pdfNewUrl = '/uploadedFiles/' + pdfName

                    runQuery(`INSERT INTO books (title , description , pdfUrl ,userId) VALUES ('${bookTitle}', '${bookDescription}' , '${pdfNewUrl}','${bookId}') ; INSERT INTO imgs (imgUrl , bookid) VALUES ('${imgArr}' , '${bookId}')`).then(()=>{
                        resolve()
                    }).catch(err=>{
                        reject(err)
                    })

            } 

        }).catch(err => {
            reject(err)
        })
    })
}

function addBook(bookTitle, bookDescription, bookPdf, bookImg, userid) {
    return new Promise((resolve, reject) => {
        let pdfName = bookTitle.trim().replace(/ /g, '_') + '_' + userid + '.pdf'
        bookPdf.mv('./public/uploadedFiles/' + pdfName)
        let pdfNewUrl = '/uploadedFiles/' + pdfName
        runQuery(`INSERT INTO books (title , description , pdfUrl ,userId) VALUES ('${bookTitle}', '${bookDescription}' , '${pdfNewUrl}',${userid})`).then((result)=>{
            
            let saveImg = ''
            bookImg.forEach((img, idx) => {
                let ext = img.name.substr(img.name.lastIndexOf('.'))
                let newName = bookTitle.trim().replace(/ /g, '_') + '_' + userid + '_' + idx + ext
                img.mv('./public/uploadedFiles/' + newName)
                const imgUrl = '/uploadedFiles/' + newName
              saveImg += `INSERT INTO imgs (imgUrl , bookid) VALUES ('${imgUrl}' , ${result.insertId});`  //!  ;
            });
            runQuery(saveImg).then(()=>{
                resolve()
            }).catch(err=>{
                reject(err)
            })
       
        }).catch(err =>{
            if (err.errno === 1062) {
                reject(3)
            }else{
                reject(err)
            }
            
        })
    })
}





function getAllBooks() {
    return new Promise((resolve, reject) => {
        runQuery(`SELECT * FROM books `).then((result) => {
            resolve(result)
        }).catch(error => {
            reject(error)
        })
    })
}



function getBook(id) {
    return new Promise((resolve, reject) => {
        connect().then(() => {
            Books.findOne({ _id: id }).then(book => {
                if (book) {
                    book.id = book._id  // convert it to id
                    resolve(book)
                } else {
                    reject(new Error('can not find book with this id : ' + id))
                }
            }).catch(error => {

                reject(error)
            })

        }).catch(error => {
            reject(error)
        })
    })
}


function userBooks(userId) {
    return new Promise((resolve, reject) => {
        connect().then(() => {
            Books.find({ userId: userId }).then(findBooks => {
                findBooks.forEach(book => {
                    book['id'] = book['_id']  // convert _id to id
                })
                resolve(findBooks)
            }).catch(error => {
                reject(error)
            })
        }).catch(error => {
            reject(error)
        })
    })
}


function updateBook(bookid, newBookTitle, oldImgsUrl, bookDedcription, newPdfBook, newImgs, userid) {
    return new Promise((resolve, reject) => {
        try {


            (async () => {

                //! first get old book call func
                let oldBookData = await getBook(bookid)
                const deletedImgs = []
                let keepImgs = []
                /*      //!get update version number to be uniq
                     let updateNam = 1
                     if (oldBookData.update) {
                         updateNam = oldBookData.update + 1
                     } */

                oldBookData.imgs.forEach(img => {
                    if (oldImgsUrl.indexOf(img) == -1) {
                        deletedImgs.push(img)  // we need to delet them from the fills too in line 255
                    } else {
                        keepImgs.push(img)
                    }
                });
                // save new images to file system and then arry to be save to db
                const newImgsUrlsArr = []
                newImgs.forEach((img, idx) => {
                    const imgExt = img.name.substr(img.name.lastIndexOf('.'))
                    // set new img name without space  /uploadedFiles/my_book_5464_0.jpg
                    const newImgName = newBookTitle.trim().replace(/ /g, '_') + '_' + userid + '_' + idx + '_' + (oldBookData.__v + 1) + imgExt
                    newImgsUrlsArr.push('/uploadedFiles/' + newImgName)
                    img.mv('./public/uploadedFiles/' + newImgName)  //renaming/moving a  file and update all
                })

                //delet the old deletedImg from db
                deletedImgs.forEach(file => {
                    if (fs.existsSync('./public' + file)) {  // check if this file exist
                        fs.unlinkSync('./public' + file)   //! delet the old imgs in line 227
                    }

                })
                //------------pdf
                //check if user upload a new pdf file
                if (newPdfBook) {
                    newPdfBook.mv('./public' + oldBookData.pdfUrl)  // replace oldpdf with newpdf
                }
                const result = await Books.updateOne({ _id: bookid }, {
                    title: newBookTitle,
                    description: bookDedcription,
                    //pdfUrl >> we replace it in line 262 
                    imgs: [...keepImgs, ...newImgsUrlsArr],
                    $inc: { __v: 1 }
                })
                resolve()
            })()
        } catch (error) {
            reject(error)
        }
    })

}



function dltBook(bookid, userid) {
    return new Promise((resolve, reject) => {

        getBook(bookid).then(book => {
            //check if t he book belong to current user
            if (book.userid == userid) {
                book.imgs.forEach(img => {
                    if (fs.existsSync('./public' + img)) {  // if this file exist
                        fs.unlinkSync('./public' + img)
                    }
                })
                //check if pdf file exist
                if (fs.existsSync('./public' + book.pdfUrl)) {
                    fs.unlinkSync('./public' + book.pdfUrl)
                }

            } else {
                reject(new Error('haking try'))
            }
            Books.deleteOne({ _id: bookid }).then(() => {
                resolve()
            }).catch(error => {
                reject(error)
            })
        }).catch(error => {
            reject(error)
        })



    })
}



module.exports = { registerUser, checkUser, addBook, getAllBooks, getBook, userBooks, updateBook, dltBook }