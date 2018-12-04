// Newsletter Loading Pixels
// ------------------
//
// Concerned about your privacy? We do not store IP addresses, and we do not create unique cookies.
// See: https://duck.co/help/privacy/atb

$(function() {
    const pixels = {
        load: {
            name: 'load'
        },
        submit_letter: {
            name: 'letter',
            el: '.js-card-url'
        }
    };

    // Fire when the post loads.
    firePixel(pixels.load.name);

    $(".js-newsletter").one("submit", function(event) {
        firePixel(pixels.submit_letter.name);
    });

    // Helper: firePixel
    // -------------------
    // This function abstracts away the logging details.
    function firePixel(data) {
        // This is the path to our pixels for logging certain events on
        // the page.
        const pixelPath = 'https://improving.duckduckgo.com/t/blog_';

        // We use the Beacon API if it's available for more accurate logging.
        // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API
        if ('sendBeacon' in navigator) {
            navigator.sendBeacon(pixelPath + data);
        } else {
            // Otherwise we go with creating an <img> element
            // and setting the src attribute with the GIF.
            let pixel = $('<img>');
            pixel.attr('src', pixelPath + data);
        }
    }
});
