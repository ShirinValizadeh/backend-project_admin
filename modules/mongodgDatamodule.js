const passwordHash = require('password-hash')
const { MongoClient, ObjectID } = require('mongodb')
const connectionString = 'mongodb+srv://fbw5:123456abc@cluster0.hjd09.mongodb.net/test1?retryWrites=true&w=majority'
const fs = require('fs')

function connect() {  // call in line 18
    return new Promise((resolve, reject) => {
        MongoClient.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true }).then(client => {
            resolve(client)
        }).catch(error => {
            reject(error)
        })
    })
}

function registerUser(email, password) {
    return new Promise((resolve, reject) => {
        connect().then(client => {
            const db = client.db('test1')
            db.collection('users').findOne({ email: email }).then(user => {
                if (user) {
                    client.close() //!
                    reject('exist')
                } else {
                    db.collection('users').insertOne({
                        email: email,
                        password: passwordHash.generate(password)
                    }).then(response => {
                        client.close() //!
                        if (response.result.ok) {
                            resolve()
                        } else {
                            reject('can not insert')
                        }

                    }).catch(error => {
                        client.close() //!
                        reject(error)
                    })
                }
            }).catch(error => {
                client.close() //!
                reject(error)
            })
        }).catch(error => {
            reject(error)
        })
    })
}


function checkUser(email, password) {
    return new Promise((resolve, reject) => {
        connect().then(client => {
            const db = client.db('test1')
            db.collection('users').findOne({ email: email }).then(user => {
                client.close() //!
                if (user) {
                    if (passwordHash.verify(password, user.password)) {
                        resolve(user)
                    } else {
                        reject('pass is not true', 3)
                    }
                } else {
                    reject('user is not exist ', 3)
                }
            }).catch(error => {
                client.close() //!
                reject(error)
            })
        }).catch(error => {

            reject(error)
        })
    })

}


function addBook(bookTitle, bookDescription, bookPdf, bookImg, bookId) {
    return new Promise((resolve, reject) => {
        connect().then(client => {
            const db = client.db('test1')
            db.collection('book').findOne({ bookId: bookId, title: bookTitle }).then(findBook => {
                if (findBook) {
                    client.close() //!
                    reject(3)

                } else {
                    //creat imgs Arry to be save in database
                    const imgArr = []
                    bookImg.forEach((img, idx) => {
                        let ext = img.name.substr(img.name.lastIndexOf('.'))  //.jpg
                        // set new img name without space
                        let newName = bookTitle.trim().replace(/ /g, '_') + '_' + bookId + '_' + idx + ext
                        img.mv('./public/uploadedFiles/' + newName)
                        imgArr.push('/uploadedFiles/' + newName)
                    });
                    let pdfName = bookTitle.trim().replace(/ /g, '_') + '_' + bookId + '.pdf'
                    bookPdf.mv('./public/uploadedFiles/' + pdfName)
                    let pdfNewUrl = '/uploadedFiles/' + pdfName

                    db.collection('book').insertOne({
                        title: bookTitle,
                        description: bookDescription,
                        pdfUrl: pdfNewUrl,
                        imgs: imgArr,
                        userId: bookId
                    }).then(response => {
                        client.close()
                        if (response.result.ok) {
                            resolve()
                        } else {
                            reject(new Error('can not insert the book'))
                        }
                    }).catch(error => {
                        reject(error)
                    })

                }
            }).catch(error => {
                client.close() //!
                reject(error)
            })
        }).catch(error => {
            reject(error)
        })
    })

}


function getAllBooks() {
    return new Promise((resolve, reject) => {
        connect().then(client => {

            const db = client.db('test1')
            db.collection('book').find().toArray().then(findBooks => {


                findBooks.forEach(book => {
                    book['id'] = book['_id']// convert _id to id
                })
                client.close()
                resolve(findBooks)


            }).catch(error => {
                client.close()
                reject(error)
            })

        }).catch(error => {
            reject(error)
        })
    })
}

function getBook(id) {
    return new Promise((resolve, reject) => {
        connect().then(client => {
            try {


                const db = client.db('test1')
                db.collection('book').findOne({ _id: new ObjectID(id) }).then(book => {
                    client.close()
                    if (book) {
                        book.id = book._id  // convert it to id
                        resolve(book)
                    } else {
                        reject(new Error('can not find book with this id : ' + id))
                    }
                }).catch(error => {
                    client.close()
                    reject(error)
                })

            } catch (error) {
                reject(error)
            }
        }).catch(error => {
            reject(error)
        })
    })
}


function userBooks(userId) {
    return new Promise((resolve, reject) => {
        connect().then(client => {

            const db = client.db('test1')
            db.collection('book').find({ userId: userId }).toArray().then(findBooks => {


                findBooks.forEach(book => {
                    book['id'] = book['_id']  // convert _id to id
                })
                client.close()
                resolve(findBooks)


            }).catch(error => {
                client.close()
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
                //!get update version number to be uniq
                let updateNam = 1
                if (oldBookData.update) {
                    updateNam = oldBookData.update + 1
                }

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
                    const newImgName = newBookTitle.trim().replace(/ /g, '_') + '_' + userid + '_' + idx + '_' + updateNam + imgExt
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

                const client = await connect()
                const db = client.db('test1')
                const result = await db.collection('book').updateOne({ _id: new ObjectID(bookid) }, {
                    $set: {
                        title: newBookTitle,
                        description: bookDedcription,
                        //pdfUrl >> we replace it in line 262 
                        imgs: [...keepImgs, ...newImgsUrlsArr],
                        update: updateNam

                    }
                })
                resolve()
            })()

        } catch (error) {
            reject(error)
        }

    })
}



function dltBook(bookid, userid) {     //! 6.1
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
            connect().then((client) => {
                const db = client.db('test1')
                db.collection('book').deleteOne({ _id: new ObjectID(bookid) }).then(() => {
                    client.close()
                    resolve()
                }).catch(error => {
                    client.close()
                    reject(error)
                })
            }).catch(error => {
                reject(error)
            })
        }).catch(error => {
            reject(error)
        })






        /*    connect().then((client) => {
               const db = client.db('test1')
               db.collection('book').findOne({ _id: new ObjectID(bookid) }).then((book) => {
                   book.imgs.forEach((img) => {
                       fs.unlinkSync('./public' + img)
                   })
                   fs.unlinkSync('./public' + book.pdfUrl)
               }).then(() => {
                   db.collection('book').deleteOne({ _id: new ObjectID(bookid) }).then(() => {
                       resolve()
                   }).catch(error => {
                       reject()
                   })
               }).catch(error => {
                   reject()
               })
   
   
           }).catch(error => {
               reject(error)
           }) */

    })
}



module.exports = { registerUser, checkUser, addBook, getAllBooks, getBook, userBooks, updateBook, dltBook }