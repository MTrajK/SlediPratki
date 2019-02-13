Common = (function () {

    var postUrl = "https://www.posta.com.mk/tnt/api/query?id=";
    var maxRequestTime = 15000; // 15 seconds max request

    var addZero = function(num) {
        return (num < 10 ? "0" : "") + num;
    }

    var convertDate = function(date) {
        return addZero(date.getDate()) + "."
            + addZero(date.getMonth() + 1) + "."
            + date.getFullYear() + ", "
            + addZero(date.getHours()) + ":"
            + addZero(date.getMinutes()) + ":"
            + addZero(date.getSeconds());
    };

    var getDateTime = function() {
        return convertDate(new Date());
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

    var startBackground = function() {
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
        getDateTime: getDateTime,
        getPackage: getPackage,
        startBackground: startBackground
    };
})();