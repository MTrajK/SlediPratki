Common = (function () {

    var postUrl = "https://www.posta.com.mk/tnt/api/query?id=";

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

    function getPackage(trackingNumber, end) {
        axios({
            method: 'get',
            url: postUrl + trackingNumber,
            timeout: 10000 // 10 seconds max request
        }).then(function (response) {
            end(response);
        }).catch(function (error) {
            console.log(error);
            end("error");
        });
    }

    return {
        getDateTime: getDateTime,
        getPackage: getPackage,
    };
})();