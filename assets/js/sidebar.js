$(function() {
    var $sidemenu = $('.side-menu');
    var $sidebar = $('.side-bar');

    $sidemenu.click(function() {
        $sidebar.addClass('show');
    });
});