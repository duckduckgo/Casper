$(function() {
    var $body = $('body');
    var $sidemenu = $('.side-menu');
    var $sidebar = $('.side-bar');
    var $sideclose = $('.side-bar-close');
    var $sidenav = $('.side-nav')

    // Show the sidemenu when the hamburger menu is clicked.
    $sidemenu.click(function() {
        $sidebar.addClass('show');
    });

    // Hide the sidemenu when the X button is clicked/
    $sideclose.click(function() {
        $sidebar.removeClass('show');
    });

    // When we click outside the sidemenu, we close it, too.
    $body.click(function(el) {
        if(!$.contains($sidebar.get(0), el.target) &&
           !$.contains($sidenav.get(0), el.target)) {
            $sidebar.removeClass('show');
        }
    });
});