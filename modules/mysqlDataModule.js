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
                multipleStatements: true,
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
    return new Promise((resolve, reject) => {
        connect().then(() => {
            con.query(queryString, (err, result, fields) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        }).catch(error => {
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

            } else {
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

                runQuery(`INSERT INTO books (title , description , pdfUrl ,userId) VALUES ('${bookTitle}', '${bookDescription}' , '${pdfNewUrl}','${bookId}') ; INSERT INTO imgs (imgUrl , bookid) VALUES ('${imgArr}' , '${bookId}')`).then(() => {
                    resolve()
                }).catch(err => {
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
        runQuery(`INSERT INTO books (title , description , pdfUrl ,userId) VALUES ('${bookTitle}', '${bookDescription}' , '${pdfNewUrl}',${userid})`).then((result) => {

            let saveImg = ''
            bookImg.forEach((img, idx) => {
                let ext = img.name.substr(img.name.lastIndexOf('.'))
                let newName = bookTitle.trim().replace(/ /g, '_') + '_' + userid + '_' + idx + ext
                img.mv('./public/uploadedFiles/' + newName)
                const imgUrl = '/uploadedFiles/' + newName
                saveImg += `INSERT INTO imgs (imgUrl , bookid) VALUES ('${imgUrl}' , ${result.insertId});`  //!  ;
            });
            runQuery(saveImg).then(() => {
                resolve()
            }).catch(err => {
                reject(err)
            })

        }).catch(err => {
            if (err.errno === 1062) {
                reject(3)
            } else {
                reject(err)
            }

        })
    })
}





function getAllBooks() {
    return new Promise((resolve, reject) => {
        runQuery('SELECT books.* , imgs.* FROM books INNER JOIN imgs ON books.id = imgs.bookid').then(results =>{
            const books = []
            results.forEach(result =>{
                // search if the book has been added to books array 
                let book = books.find(element =>{ element.id = result.bookid})
                if(book){
                    // if the book is added before, we need only to append the imgs property with the new imgUrl
                    book.imgs.push(result.imgUrl)
                }else{
                    // if the book is not added to books we need to add it to books and set imgs as new array with one element imgUrl
                    books.push({
                        id: result.bookid,
                        title: result.title,
                        description: result.description,
                        pdfUrl: result.pdfUrl,
                        userid: result.userid,
                        imgs: [result.imgUrl]
                    })
                }
            })
            resolve(books)
        }).catch(err=>{
            reject(err)
        })
    })
}



function getBook(id) {
    return new Promise((resolve, reject) => {
            runQuery(`SELECT books.*,imgs.* FROM books INNER JOIN imgs ON imgs.bookid = books.id WHERE imgs.bookid =${id}`).then(results =>{
                if (results.length) {
                   const book = {}
                   results.forEach(result => {
                       if (book.id) {
                           book.imgs.push(result.imgUrl)
                       }else{
                           book.id = result.bookid
                           book.title= result.title,
                           book.description= result.description,
                           book.pdfUrl= result.pdfUrl,
                           book.userid= result.userid,
                           book.imgs= [result.imgUrl]
                       }
                       
                   });
                   resolve(book)
                }else{
                    reject('you can not find book with this id' + id)
                }
            }).catch(err =>{
                reject(err)
            })
    })
}




function userBooks(userId) {
    return new Promise((resolve, reject) => {
        runQuery(`SELECT books.* , imgs.* FROM books INNER JOIN imgs ON books.id = imgs.bookid WHERE books.userid =${userId}`).then(results =>{
            const books = []
            results.forEach(result =>{
                // search if the book has been added to books array 
                let book = books.find(element =>{ element.id = result.bookid})
                if(book){
                    // if the book is added before, we need only to append the imgs property with the new imgUrl
                    book.imgs.push(result.imgUrl)
                }else{
                    // if the book is not added to books we need to add it to books and set imgs as new array with one element imgUrl
                    books.push({
                        id: result.bookid,
                        title: result.title,
                        description: result.description,
                        pdfUrl: result.pdfUrl,
                        userid: result.userid,
                        imgs: [result.imgUrl]
                    })
                }
            })
            resolve(books)
        }).catch(err=>{
            reject(err)
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
                let newImgsQuery = ''
                const currentTime = Date.now()
                newImgs.forEach((img, idx) => {
                    const imgExt = img.name.substr(img.name.lastIndexOf('.'))
                    // set new img name without space  /uploadedFiles/my_book_5464_0.jpg
                    const newImgName = newBookTitle.trim().replace(/ /g, '_') + '_' + userid + '_' + idx + '_' + currentTime + imgExt
                   const newimgUrl = '/uploadedFiles/' + newImgName //!    SQL
                    newImgsQuery += `INSERT INTO imgs (imgUrl , bookid) VALUES ('${newimgUrl}' , ${bookid});` //!  SQL INSERT NEW IMG
                    img.mv('./public/uploadedFiles/' + newImgName)  //renaming/moving a  file and update all
                })

                //delet the old deletedImg from db
                let deletImgQuery = ''
                deletedImgs.forEach(file => {
                    deletImgQuery += `DELETE FROM imgs WHERE imgUrl LIKE  '${file}' AND bookid = ${bookid}; `  //!  SQL DELET
                    if (fs.existsSync('./public' + file)) {  // check if this file exist
                        fs.unlinkSync('./public' + file)   //! delet the old imgs in line 227
                    }

                })
                //------------pdf
                //check if user upload a new pdf file
                if (newPdfBook) {
                    newPdfBook.mv('./public' + oldBookData.pdfUrl)  // replace oldpdf with newpdf
                }
                //! -------SQL------UPDATE--
                await runQuery(`UPDATE books SET title = '${newBookTitle}' , description = '${bookDedcription}' WHERE id = ${bookid} ; ` + deletImgQuery + newImgsQuery)
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
            runQuery(`DELETE FROM books WHERE id = '${bookid}'`).then(() => {
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