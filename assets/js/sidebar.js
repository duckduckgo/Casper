$(function() {
    var $sidenav = $('.side-nav');
    var $sidebar = $('.side-bar');

    $sidenav.click(function() {
        $sidebar.addClass('show');
    });
});