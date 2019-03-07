$(function() {
    const url = new URL(location.href);
    const pathname = url.pathname.replace(/\/(.+)\//, '$1');

    // Only enable ATB on certain pages.
    // It's in a KV-pair format so that lookup is fast.
    const enabledPages = {
        'why-use-duckduckgo-instead-of-google': true
    };

    // Check if we're currently in an enabled page.
    if (pathname in enabledPages) {
        $('.js-floating-header-atb').removeClass('is-hidden');
    }
});