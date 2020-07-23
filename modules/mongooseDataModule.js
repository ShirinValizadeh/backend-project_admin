const passwordHash = require('password-hash')
//const { MongoClient, ObjectID } = require('mongodb')
const mongoose = require('mongoose')

const connectionString = 'mongodb+srv://fbw5:123456abc@cluster0.hjd09.mongodb.net/test1?retryWrites=true&w=majority'
const fs = require('fs')


//!3 get schema object
const { Schema } = mongoose
//!4 creat user schema
const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})
//!5 get users modal
const Users = mongoose.model('users', userSchema)



//! creat books schema
const bookSchema = new Schema({
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
})
//!creat books module
const Books = mongoose.model('books', bookSchema)


//!1 connect mongoose
function connect() {
    //check connection
    return new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
            resolve()
        } else {
            mongoose.connect(connectionString, {
                useUnifiedTopology: true,
                useCreateIndex: true,
                useNewUrlParser: true
            }).then(() => {
                resolve()
            }).catch(error => {
                reject(error)
            })
        }
    })
}



//! registerUser mongoose
function registerUser(email, password) {
    return new Promise((resolve, reject) => {
        connect().then(() => {
            //creat new user      //37 line
            const newUser = new Users({
                email: email,
                password: passwordHash.generate(password)
            })
            //  save newuser in DB
            newUser.save().then(response => {
                // console.log(response);
                resolve()
            }).catch(error => {
                if (error.code === 11000) {
                    reject('exist')
                } else {
                    reject(error)
                }
            })
        }).catch(error => {
            reject(error)
        })
    })
}





//! checkuser mongoose
function checkUser(email, password) {
    return new Promise((resolve, reject) => {
        connect().then(() => {
            Users.findOne({ email: email }).then(user => {
                if (user) {
                    if (passwordHash.verify(password, user.password)) {
                        resolve(user)
                    } else {
                        reject(3)
                    }
                } else {
                    reject(3)
                }
            }).catch(error => {
                reject(error)
            })
        }).catch(error => {
            reject(error)
        })
    })


}







function addBook(bookTitle, bookDescription, bookPdf, bookImg, bookId) {
    return new Promise((resolve, reject) => {
        connect().then(() => {
            Books.findOne({ bookId: bookId, title: bookTitle }).then(findBook => {
                if (findBook) {
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
                    //creat new book
                    const newBook = new Books({
                        title: bookTitle,
                        description: bookDescription,
                        pdfUrl: pdfNewUrl,
                        imgs: imgArr,
                        userId: bookId
                    })
                    newBook.save().then(() => {
                        resolve()
                    }).catch(error => {
                        reject(error)
                    })
                }
            }).catch(err => {
                reject(err)
            })

        }).catch(err => {
            reject(err)
        })
    })
}


function getAllBooks() {
    return new Promise((resolve, reject) => {
        connect().then(() => {
            Books.find().then(findBooks => {
                findBooks.forEach(book => {
                    book['id'] = book['_id']// convert _id to id
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