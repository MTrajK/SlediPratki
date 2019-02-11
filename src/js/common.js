Common = (function(){

    function convertDate(date) {
        return date.getDate() + "." 
        + (date.getMonth() + 1) + "." 
        + date.getFullYear() + ", " 
        + date.getHours() + ":"
        + date.getMinutes() + ":"
        + date.getSeconds();
    };

    function getDateTime() {
        return convertDate(new Date());
    };

    return {
        getDateTime: getDateTime
    };
})();