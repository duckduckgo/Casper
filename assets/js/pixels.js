// Newsletter Loading Pixels
// ------------------
//
// Concerned about your privacy? We do not store IP addresses, and we do not create unique cookies.
// See: https://duck.co/help/privacy/atb
//
// Pixel format:
// -------------
// blog.[article-path].[scroll-position].[source]
// blog.google-filter-bubble-study.load.twitter

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
        // Pixels to determine the position of the reader
        // in the document.
        position: {
            load: 'load',
            quarter: 'quarter',
            half: 'half',
            done: 'done'
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

    // --------------------
    // II. Helper Functions
    // --------------------

    // Helper: firePixel
    // -------------------
    // This function abstracts away the logging details.
    function firePixel(data, options) {
        if (options && options.once && seenList[data + source]) {
            return;
        } else if (options && options.once) {
            seenList[data + source] = true;
        }

        // This is the path to our pixels for logging certain events on
        // the page.
        const pixelPath = 'https://improving.duckduckgo.com/t/blog_' + pathname + '_';

        // We use the Beacon API if it's available for more accurate logging.
        // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API
        if ('sendBeacon' in navigator) {
            navigator.sendBeacon(pixelPath + data + '_' + source);
        } else {
            // Otherwise we go with creating an <img> element
            // and setting the src attribute with the GIF.
            let pixel = $('<img>');
            pixel.attr('src', pixelPath + data + '_' + source);
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
    // Check how far down the user has scrolled.
    // Example: blog.google-filter-bubble-study.half.quora
    function updateScrollInfo() {
        let progressMax = lastDocumentHeight - lastWindowHeight;
        let percentage = lastScrollY / progressMax;

        if (percentage > 1) {
            firePixel(pixels.position.done, {once: true});
        } else if (percentage > .50) {
            firePixel(pixels.position.half, {once: true});
        } else if (percentage > .25) {
            firePixel(pixels.position.quarter, {once: true});
        }

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

    // --------------------
    // III. Event Listeners
    // --------------------

    // Page Loading
    // ------------
    // Fire when the post loads.
    // Example: blog.google-filter-bubble-study.load.quora
    firePixel(pixels.position.load, {once: true});

    // Page Position Scrolling
    // -----------------------
    // Figure out if the user is 25%, 50%, or 100% of the page.
    window.addEventListener('scroll', function() {
        lastScrollY = window.scrollY;
        requestTick();
    }, {passive: true});

    updateScrollInfo();

    // Newsletter Submission
    // ---------------------
    // Fire pixel when the newsletter form is submitted.
    // Example: blog.google-filter-bubble-study.letter.quora
    $(".js-newsletter").one("submit", function(event) {
        firePixel(pixels.submit_letter.name, {once: true});
    });

    // Link Clicks
    // -----------
    // Fire pixels when links within the article are clicked.
    // Example: blog.google-filter-bubble-study.link.https-spreadprivacy-com.quora
    $('article a').click(function() {
        const href = sanitizeUrl(this.href);
        firePixel('link_' + href, {once: false});
    });

    // --------
    // IV. Fin.
    // --------
});
