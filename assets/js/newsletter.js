// Newsletter Form Validation
// --------------------------
//
// This file manages any form checking that we have on the client side.
// For now it handles our checkboxes.

$(function() {
    $(".js-newsletter").on("submit", function(event) {
        let params = $(event.target).serialize();

        // Prevent the form from submitting if
        // none of the checkboxes are selected.
        let checkboxes = $(event.target).find("input[type='checkbox']");
        let newsletterOptions = checkboxes.filter(function() {
            return this.checked;
        }).toArray();

        if (newsletterOptions.length === 0) {
            event.preventDefault();
        }
    });
});
