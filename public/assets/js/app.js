// Scrape Button

$("#scrape").on("click", function() {
    $.ajax({
        method: "GET",
        url: "/scrape",
    }).done(function(data) {
        console.log(data)
        window.location = "/"
    })
});

// Navbar action
$(".navbar-nav li").click(function() {
    $(".navbar-nav li").removeClass("active");
    $(this).addClass("active");
});

// Save article button
$(".save").on("click", function() {
    var thisId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/save/" + thisId
    }).done(function(data) {
        window.location = "/"
    })
});


// Save comment button
$(".saveComment").on("click", function() {
    var thisId = $(this).attr("data-id");
    if (!$("#commentText" + thisId).val()) {
        alert("Please enter a comment to save")
    } else {
        $.ajax({
            method: "POST",
            url: "/comments/save/" + thisId,
            data: {
                text: $("#commentText" + thisId).val()
            }
        }).done(function(data) {
            console.log(data);
            $("#commentText" + thisId).val("");
            $(".modalComment").modal("hide");
            window.location = "/saved"
        });
        }
    });

    // Delete Article
    $(".delete").on("click", function() {
        var thisId = $(this).attr("data-id");
        $.ajax({
            method: "POST",
            url: "/articles/delete/" + thisId
        }).done(function(data) {
            window.location - "/saved"
            location.reload();
        })
    });

// Delete Comment
$(".deleteComment").on("click", function() {
    var commentId = $(this).attr("data-comment-id");
    var articleId = $(this).attr("data-article-id");
    $.ajax({
        method: "DELETE",
        url: "/comments/delete/" + commentId + "/" + articleId
    }).done(function(data) {
        console.log(data)
        $(".modalComment").modal("hide");
        window.location = "/saved"
    })
});