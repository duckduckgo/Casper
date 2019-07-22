// Newsletter Form Validation
// --------------------------
//
// This file manages any form checking that we have on the client side.
// For now it handles our checkboxes.

$(function() {
    $(".js-newsletter").on("submit", function(event) {
        // Prevent the form from submitting if
        // none of the checkboxes are selected.
        let atLeastOneIsChecked = $('.js-newsletter-checkbox:checked').length > 0;

        if (!atLeastOneIsChecked) {
            event.preventDefault();
        }
    });
});
