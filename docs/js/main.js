document.addEventListener('DOMContentLoaded', function () {
    var parallax = document.querySelectorAll('.parallax');
    M.Parallax.init(parallax);

    var scrollspy = document.querySelectorAll('.scrollspy');
    M.ScrollSpy.init(scrollspy);

    var carousel = document.querySelectorAll('.carousel');
    var carouselInstance = M.Carousel.init(carousel);

    var w = window;
    var d = document;
    var e = d.documentElement;
    var g = d.getElementsByTagName('body')[0];

    var windowWidth = function () {
        return w.innerWidth || e.clientWidth || g.clientWidth;
    };
    var lastWidth = windowWidth();

    var sync = document.querySelector('#sync');
    var notifications = document.querySelector('#notifications');
    var packages = document.querySelector('#packages');

    var updateHeight = function () {
        // don't care about the last col - settings

        var maxHeight = 0;
        maxHeight = Math.max(maxHeight, Math.max(sync.offsetHeight, sync.clientHeight));
        maxHeight = Math.max(maxHeight, Math.max(notifications.offsetHeight, notifications.clientHeight));
        maxHeight = Math.max(maxHeight, Math.max(packages.offsetHeight, packages.clientHeight));

        maxHeight = maxHeight + "px";

        sync.style.height = maxHeight;
        notifications.style.height = maxHeight;
        packages.style.height = maxHeight;
    }

    updateHeight();

    window.onresize = function () {
        var currentWidth = windowWidth();

        // five borders: 450, 600, 992, 1440, 2000
        if ((currentWidth <= 450 && lastWidth > 450) ||
            (currentWidth > 450 && currentWidth <= 600 && (lastWidth > 600 || lastWidth <= 450)) ||
            (currentWidth > 600 && currentWidth <= 992 && (lastWidth > 992 || lastWidth <= 600)) ||
            (currentWidth > 992 && currentWidth <= 1440 && (lastWidth > 1440 || lastWidth <= 992)) ||
            (currentWidth > 1440 && lastWidth <= 1440)) {
            if (carouselInstance !== undefined) {
                // re-init crousel after changing the dimensions with css media querries
                carouselInstance = M.Carousel.init(carousel);
            }
        }

        lastWidth = currentWidth;

        // update columns height
        updateHeight();
    };
});

window.addEventListener("load", function (event) {
    // remove the spinner after all pictures are loaded
    var spinner = document.querySelector('#spinner');
    spinner.style.display = "none";
    
    var body = document.querySelector('body');
    body.classList.remove("spinner-loading");
});