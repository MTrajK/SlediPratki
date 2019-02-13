Common = (function () {

    var postUrl = "https://www.posta.com.mk/tnt/api/query?id=";
    var maxRequestTime = 15000;     // 15 seconds max request
    var oneHourMillis = 3600000;    // 60 min * 60 sec * 1000 milliseconds = 3.600.000
    var months = ["Јануари", "Февруари", "Март", "Април", "Мај", "Јуни", "Јули", "Август", "Септември", "Октомври", "Ноември", "Декември"];

    var addZero = function (num) {
        return (num < 10 ? "0" : "") + num;
    }

    var formatDate = function (date) {
        return addZero(date.getDate()) + " "
            + months[date.getMonth()] + " "
            + date.getFullYear() + ", "
            + addZero(date.getHours()) + ":"
            + addZero(date.getMinutes()) + ":"
            + addZero(date.getSeconds());
    };

    var getPackage = function (trackingNumber, end) {
        axios({
            method: 'get',
            url: postUrl + trackingNumber,
            timeout: maxRequestTime
        }).then(function (response) {
            end(response);
        }).catch(function (error) {
            console.log(error);
            end("error");
        });
    };

    var startBackground = function () {
        var nowTime = new Date();
        /*
        var lastRefresh = getLastRefresh();
        var refreshInterval = getRefreshInterval();
    
        if (lastRefresh >= refreshInterval) {
            // set interval
        } else {
            // set timeout and inside set interval
        }
        // stop the interval in this way
        var refreshIntervalId = setInterval(fname, 10000);
        
        clearInterval(refreshIntervalId);
        */
    };

    return {
        getPackage: getPackage,
        formatDate: formatDate,
        startBackground: startBackground
    };
})();