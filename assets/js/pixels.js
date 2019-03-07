// Newsletter Loading Pixels
// ------------------
//
// Concerned about your privacy? We do not store IP addresses, and we do not create unique cookies.
// See: https://duck.co/help/privacy/atb
//
// Pixel format:
// -------------
// Image: blog.image.[source].[article].[image-index]
// Link click: blog.link.[source].[article].[link]
// Loading: blog.load.[source].[article]

$(function() {
    // -------------------------
    // I. Initialization & Setup
    // -------------------------

    // Pixel List:
    // -----------
    // These are the set of pixels that we'd like to fire.
    // Setting them up using a key-value format makes it easy
    // for us to reference them later.
    const pixels = {
        // Pixel to request when newsletter is submitted.
        submit_letter: {
            name: 'letter',
            el: '.js-card-url'
        },
        position: {
            load: 'load',
        }
    };

    // Most of the time we don't want a pixel firing
    // several times throughout the document so we use another
    // key-value object to keep track if a pixel has been fired or not.
    let seenList = {};

    // Page Info:
    // ----------
    // This section is where we get the information that we need about the page.
    // - Where the visitor came from.
    // - The path of the page.

    // Get source param in the URL.
    const url = new URL(location.href);
    const source = url.searchParams.get('s') || 'direct';

    // Get path to uniquely identify pixel.
    const pathname = url.pathname.replace(/\/(.+)\//, '$1');

    // Scroll Position
    // ---------------
    // Check how far down the user has scrolled.
    let lastScrollY = window.scrollY;
    let lastWindowHeight = window.innerHeight;
    let lastDocumentHeight = $('article').height();
    let ticking = false;

    // Get the images in the article if there are any.
    const $articleImagesEl = $('.post-full img');

    // --------------------
    // II. Helper Functions
    // --------------------

    // Helper: firePixel
    // -------------------
    // This function abstracts away the logging details.
    function firePixel() {
        // This is the path to our pixels for logging certain events on
        // the page.
        const pixelUrl = 'https://improving.duckduckgo.com/t/blog_';
        let args = [].slice.call(arguments); //data + '_' + source + '_' + pathname;
        const options = args.pop();
        const concat = args.join('_');
        const pixelPath = pixelUrl + concat;

        if (options && options.once && seenList[concat]) {
            return;
        } else if (options && options.once) {
            seenList[concat] = true;
        }


        // We use the Beacon API if it's available for more accurate logging.
        // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API
        if ('sendBeacon' in navigator) {
            navigator.sendBeacon(pixelPath);
        } else {
            // Otherwise we go with creating an <img> element
            // and setting the src attribute with the GIF.
            let pixel = $('<img>');
            pixel.attr('src', pixelPath);
        }
    }

    // Helper: requestTick
    // Better performance on scrolling by using debouncing.
    // Reference: https://gomakethings.com/debouncing-events-with-requestanimationframe-for-better-performance/
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollInfo);
        }
        ticking = true;
    }

    // Helper: updateScrollInfo
    // ---------------
    // Check which images are now in view.
    function updateScrollInfo() {
        let progressMax = lastDocumentHeight - lastWindowHeight;

        $articleImagesEl.each(function(index) {
            if (elementIsVisibleInViewport(this, true)) {
                firePixel('image', source, pathname,
                          (index + 1) + 'of' + $articleImagesEl.length,
                          {once: true});
            }
        });

        ticking = false;
    }

    // Helper: sanitizeUrl
    // Sanitzes a given URL by removing unsafe characters.
    // E.g. 'https://reddit.com/r/duckduckgo' -> 'https-reddit-com-r-duckduckgo'
    function sanitizeUrl(url) {
        return url
        // strip leading/trailing slash
            .replace(/^\/|\/$/, '')
        // strip unsafe chars for grafana
            .replace(/[^a-z0-9_-]+/ig, '-')
        // strip underscores as well
            .replace(/_/g,'-');
    }

    // Helper: elementIsVisibleInViewport
    // Source: https://github.com/30-seconds/30-seconds-of-code#elementisvisibleinviewport-
    // Figures out if an element (in our case images) are in view so that we
    // can fire the pixels.
    function elementIsVisibleInViewport(el, partiallyVisible) {
        partiallyVisible = partiallyVisible || false;

        const elBounds = el.getBoundingClientRect();
        const top = elBounds.top;
        const left = elBounds.left;
        const bottom = elBounds.bottom;
        const right = elBounds.right;

        const innerHeight = window.innerHeight;
        const innerWidth = window.innerWidth;

        if (partiallyVisible) {
            return ((top > 0 && top < innerHeight) ||
                    (bottom > 0 && bottom < innerHeight)) &&
                   ((left > 0 && left < innerWidth) ||
                    (right > 0 && right < innerWidth));
        } else {
            return top >= 0 &&
                   left >= 0 &&
                   bottom <= innerHeight &&
                   right <= innerWidth;
        }
    }

    // --------------------
    // III. Event Listeners
    // --------------------

    // Page Loading
    // ------------
    // Fire when the post loads.
    // Example: blog.load.quora.google-filter-bubble-study
    firePixel(pixels.position.load, source, pathname, {once: true});

    // Page Position Scrolling
    // -----------------------
    // See if images are in view.
    window.addEventListener('scroll', function() {
        lastScrollY = window.scrollY;
        requestTick();
    }, {passive: true});

    updateScrollInfo();

    // Newsletter Submission
    // ---------------------
    // Fire pixel when the newsletter form is submitted.
    // Example: blog.letter.quora.google-filter-bubble-study
    $(".js-newsletter").one("submit", function(event) {
        firePixel(pixels.submit_letter.name, source, pathname, {once: true});
    });

    // Link Clicks
    // -----------
    // Fire pixels when links within the article are clicked.
    // Example: blog.link.quora.https-spreadprivacy-com.google-filter-bubble-study
    $('article a').click(function() {
        const href = sanitizeUrl(this.href);
        firePixel('link', source, pathname, href, {once: false});
    });

    // ATB Button
    // ----------
    // Fire click pixel if the ATB is clicked.
    // Example: atb.direct.why-use-duckduckgo-instead-of-google
    $('.js-floating-header-atb').click(function() {
        firePixel('atb', source, pathname, {once: true});
    });

    // --------
    // IV. Fin.
    // --------
});
