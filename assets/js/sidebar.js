$(function() {
    'use strict';

    var $body = $('body');
    var $sidemenu = $('.side-menu');
    var $sideclose = $('.side-bar-close');

    // There are times when we need just the DOM element instead of 
    // a jQuery object. Instead of using the archaic-looking $(el).get(0)
    // let's just use querySelector in the first place.
    var sidebar = document.querySelector('.side-bar');
    var sidenav = document.querySelector('.side-nav');

    var $sidebar = $(sidebar);
    var $sidebarLinks = $sidebar.find('a');

    var $links = $('a');

    // Show the sidemenu when the hamburger menu is clicked.
    $sidemenu.click(function() {
        if($sidebar.hasClass('show')) {
            $sidebar.removeClass('show');
        } else {
            $sidebar.addClass('show');
        }
    });

    // Hide the sidemenu when the X button is clicked
    $sideclose.click(function() {
        $sidebar.removeClass('show');
    });

    // When we click outside the sidemenu, we close it, too.
    $body.click(function(el) {
        if(!$.contains(sidebar, el.target) &&
           !$.contains(sidenav, el.target)) {
            $sidebar.removeClass('show');
        }
    });

    // Accessibility
    // -------------
    // When the links or buttons are focused we need to 
    // open the sidemenu so that people would be able to see
    // the focused elements.
    $sidebarLinks.focus(function() {
        $sidebar.addClass('show');
    });

    $sideclose.focus(function() {
        $sidebar.addClass('show');
    });

    // Close the sidebar when a link outside of the sidebar is 
    // in focus.
    $links.focus(function(el) {
        if(!$.contains(sidebar, el.target) &&
           !$.contains(sidenav, el.target)) {
            $sidebar.removeClass('show');
        }
    });
});