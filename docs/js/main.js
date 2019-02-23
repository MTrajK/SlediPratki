document.addEventListener('DOMContentLoaded', function () {
    // wait for the DOM to be created (maybe we don't need this tag https://thanpol.as/javascript/you-dont-need-dom-ready )
    // define materialize and logic

    var parallax = document.querySelectorAll('.parallax');
    var parallaxInstances = M.Parallax.init(parallax);

    var scrollspy = document.querySelectorAll('.scrollspy');
    var scrollspyInstances = M.ScrollSpy.init(scrollspy);

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

    // re-init crousel after changing the dimensions with css media querries
    window.onresize = function () {
        var currentWidth = windowWidth();

        // five borders: 450, 600, 992, 1440, 2000
        if ((currentWidth <= 450 && lastWidth > 450) ||
            (currentWidth > 450 && currentWidth <= 600 && (lastWidth > 600 || lastWidth <= 450)) ||
            (currentWidth > 600 && currentWidth <= 992 && (lastWidth > 992 || lastWidth <= 600)) ||
            (currentWidth > 992 && currentWidth <= 1440 && (lastWidth > 1440 || lastWidth <= 992)) ||
            (currentWidth > 1440 && lastWidth <= 1440)) {
            if (carouselInstance !== undefined) {
                carouselInstance = M.Carousel.init(carousel);
            }
        }

        lastWidth = currentWidth;
    };
});

window.addEventListener("load", function (event) {
    // wait for all pictures to be loaded
    // stop the main spinner

});