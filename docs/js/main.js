document.addEventListener('DOMContentLoaded', function () {
    // wait for the DOM to be created (maybe we don't need this tag https://thanpol.as/javascript/you-dont-need-dom-ready )
    // define materialize and logic
    var elems = document.querySelectorAll('.scrollspy');
    var instances = M.ScrollSpy.init(elems);
});

window.addEventListener("load", function (event) {
    // wait for all pictures to be loaded
    // stop the main spinner

});