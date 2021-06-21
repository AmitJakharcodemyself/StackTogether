$(document).ready(()=>{
    $.get("/api/posts",results=>{
       
       outputPosts(results,$(".postsContainer"))
    })
})

function outputPosts(results,Container){
    Container.html("");
    results.forEach(result=>{
        var html=createPostHtml(result);
        Container.append(html);
    })
    if(results.length==0){
        Container.append("<span class='noResults'>Nothing to Show</span>")
    }
}