
$(document).ready(function() {

    var images = $(".img-grid img");
    var mainImg = $("#main-img");
    var caption = $("#caption");
    function onClick(img, owner) {
        return function() {
            mainImg.attr("src", $("#img-" + img + "-" + owner).attr("src"));
            caption.html("Subido por <b>" + owner + "</b>");
        }
    }
    var tmp;
    var image;
    for (var i = 0; i< images.length; i++) {
        image = images[i];
        tmp = image.id.split("-");
        $(image).click(onClick(tmp[1], tmp[2]));
    }
});