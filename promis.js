function getData() {
    const somePromise = new Promise((resolve, reject) => {
        let x;
        setTimeout(() => {
            try {
                x = "i am data"
                resolve(x)
            } catch (error) {
                reject(error)  // if u call reject u can have catch after than
            }

        }, 1000)


    })

    return somePromise

}

/* getData().then(data => {
    console.log(data);

}).catch(error => {
    console.log(error);

}) */

//===========async func or==========
//! iffie function  self-inviking function   (it will call it self)
/* (async()=>{
 let  something = await getData()
    console.log(something);   
})() */

async function unnormalFunction(params) {
    let som = await getData()
    console.log(som);
    
  }
  unnormalFunction()

//===============
/* function normalFunction(params) {
  let som =  getData()
  console.log(som);
  
}
normalFunction() */