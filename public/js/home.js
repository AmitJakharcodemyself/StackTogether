$(document).ready(()=>{
    $.get("/api/posts",{followingOnly:true},results=>{
       outputPosts(results,$(".postsContainer"))
    })
})

//Auto Scroll
$('#contact-form').on( 'change keydown keyup paste cut', 'textarea', function () {  
    $(this).height(0).height(this.scrollHeight+2);
    if ($(this).height() >= 300) {
      $('textarea#postTextarea').css("overflow", "auto");
    }
    else {
      $('textarea#postTextarea').css("overflow", "hidden");
    }
  }).find('textarea#postTextarea').change();

