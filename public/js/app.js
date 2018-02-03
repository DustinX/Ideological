//******************************************************************************************************************************
//                                                          NAV
//******************************************************************************************************************************

function openSideNav() {
  document.getElementById('mobileSideNav').style.width = "100%";
}

function closeSideNav(){
  document.getElementById('mobileSideNav').style.width = "0";
}

$(document).scroll(function(){
  if($(this).scrollTop() > 500) {
    $('#ideologyTopNav').css({"box-shadow":"0 10px 10px rgba(0,0,0,0.2)"});
  } else {
    $('#ideologyTopNav').css({"box-shadow":"none"});
  }
})




//******************************************************************************************************************************
//                                                    RATE FORM
//******************************************************************************************************************************

//First, capture all of the rateFormBtn's on the document and store as an pseudoarray
var reviewBtns = document.querySelectorAll('#rateFormBtn');

// Get the modal
var ratingModal = document.getElementById('ratingForm');

//get the article modal
var articleModal = document.getElementById('articleView');

function closeRatingModal() {
  ratingModal.style.display = "none";
  history.pushState(null, null, "/");
}

function closeArticleViewModal() {
  articleModal.style.display = "none";
}


//Now, add an event listener to each btn present
for (var i = 0; i < reviewBtns.length; i++) {
    reviewBtns[i].addEventListener('click', function(e) {

      //we can access the data-* attributes using the dataset API
      var articleTitle = e.target.dataset.articleTitle;
      var articleId = e.target.dataset.articleId;
      var urlToEmulate = "/rate/"+articleId;

      //Now, we must manipulate the URL in the window to reflect the article that is clicked on
      history.pushState(null, null, urlToEmulate);

      var modalTitle = document.getElementById('modalReviewTitle');
      var rateForm = document.getElementById('rateArticleForm');
      var truthySelector = document.getElementById('truthySelector');

      modalTitle.textContent = articleTitle;
      rateForm.action = "/rate/"+articleId+"?_method=PUT";
      truthySelector.value = "0";

      ratingModal.style.display="block";

    });
}

//******************************************************************************************************************************
//                                                    AJAX
//******************************************************************************************************************************
$('.articleDataContainer').click(function() {
  //get the articleurl
  var url = this.dataset.articleUri;
  var articleId = this.dataset.articleId;
  //then send this url back to the server for processing

  //what we want to do is once we get the url for the article (above), we need to create an ajax request that hits a route that we define in app.js. This route will do the following:
    //1) the route should take the url and do a fetch request. 
    //2) the result of that fetch request should be parsed (eitehr with unfluff) or another parsing library
    //3) the result of that parse should be sent back to the front end so that we can show it to the user in a modal of some sort
    var data = {articleURL: url, articleID: articleId};
    $.post('/'+articleId+'/read', data, function(data) {
        var modaltitle = document.getElementById('modalViewTitle');
        var articleBody = document.getElementById('articleBody');
        var articleView = document.getElementById('articleView');
        modaltitle.textContent = data.title;

        articleView.style.display = "block";
        articleBody.innerHTML = data.body;
    });
});


//******************************************************************************************************************************
//                                                    RATE FORM SUBMIT
//******************************************************************************************************************************

// $('#reviewSubBtn').click(function(e){
//   e.preventDefault(); //prevents a page submit
//   //get the specific articleId
//   var articleId = window.location.pathname.split('/');
//
//   //Get necessary data attributes
//   var articleValidity = document.querySelector('#truthySelector').value;
//   var articleBias = document.querySelector('#biasSelector').value;
//   var articleData = {
//     validity: articleValidity,
//     bias: articleBias
//   };
//
//   //AJAX call to submit form
//   $.ajax({
//     type: 'PUT',
//     url: '/rate/' + articleId[2],
//     dataType: 'json',
//     async: true,
//     data: {
//       validity: articleValidity,
//       bias: articleBias
//     },
//
//     success: function(data){
//       //HAVE TO SET DATA ATTRIBUTES -> THEN UPDATE THE NECESSARY FIELDS ON THE FRONT END
//         //WHY? WELL, EXPRESS IS A SERVER SIDE FRAMEWORK SO IT WILL JUST SERVE PAGES WHEN THE BROWSERS ASKS FOR THEM
//         //IF YOU WANT TO UPDATE THE FRONT END, WE MUST EITHER USE ANGULAR, OR JQUERY TO SET THEM
//
//     },
//
//     error: function(XMLHttpRequest, textStatus, errorThrown){
//       console.log(XMLHttpRequest, textStatus, errorThrown);
//     }
//   });
// });



//******************************************************************************************************************************
//                                                    jQUERY
//******************************************************************************************************************************
$(function(){
  $('.expandFeedback').click(function(){
    // $(this).html('<i class="fa fa-angle-up" aria-hidden="true"></i>');
    $(this).parent().find('.feedback').toggleClass('show');
    if($(this).parent().find('.feedback').hasClass('show')){
      $(this).html('<i class="fa fa-angle-up" aria-hidden="true"></i>');
    } else {
      $(this).html('<i class="fa fa-angle-down" aria-hidden="true"></i>');
    }

  });
});
