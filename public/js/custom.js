

$(document).ready(function() {
// $('.navbar-toggler').click(function() {
//     $('.navbar-collapse').slideToggle();
//    });


 
  $("#owl-demo").owlCarousel({
 	  navigation : true, // Show next and prev buttons
      slideSpeed : 300,
      paginationSpeed : 400,
      singleItem:true,
      items : 1,
      autoPlay: 3000,
       loop: true,
  		
 
  });
  $("#testimonal").owlCarousel({ 
  		 navigation : true, // Show next and prev buttons
      slideSpeed : 300,
      paginationSpeed : 400,
      singleItem:true,
      items : 1,
      autoPlay: 3000,
       loop: true,

  });




 
});



   //-----1------- if we have error will call this function---
   function showModal(error, title, content) {
    const modal = document.querySelector('#resultModal')
    const modal_header = modal.querySelector('.modal-header')
    const modal_body = modal.querySelector('.modal-body')

    if (error) {
        modal_header.classList.add('bg-danger')
        modal_header.classList.remove('bg-success')
    } else {
        modal_header.classList.remove('bg-danger')
        modal_header.classList.add('bg-success')
    }
    modal_header.innerHTML = title
    modal_body.innerHTML = '<p>' + content + '</p>'
    $('#resultModal').modal('show')
}




function btnWait(btn , wait , text) {
    btn.innerText = text 
    if (wait) {      
      btn.disabled = true;
      
    }else{
      btn.disabled = false;
    }
    

   
}



function showModalDlt(error, title, content) {
    const modal = document.querySelector('#deletConfirmModal')
    const modal_header = modal.querySelector('.modal-header')
    const modal_body = modal.querySelector('.modal-body')

    if (error) {
        modal_header.classList.add('bg-danger')
        modal_header.classList.remove('bg-success')
    } else {
        modal_header.classList.remove('bg-danger')
        modal_header.classList.add('bg-success')
    }
    modal_header.innerHTML = title
    modal_body.innerHTML = '<p>' + content + '</p>'
    $('#deletConfirmModal').modal('show')
}