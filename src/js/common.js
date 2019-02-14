Common = (function () {

    var postUrl = "https://www.posta.com.mk/tnt/api/query?id=";
    var maxRequestTime = 15000;     // 15 seconds max request
    var months = ["Јануари", "Февруари", "Март", "Април", "Мај", "Јуни", "Јули", "Август", "Септември", "Октомври", "Ноември", "Декември"];
    
    /**
    * Strings used to access the chrome storage.
    */ 
    var storageStrings = {
        version: "SlediPratki.Version",
        lastRefresh: "SlediPratki.LastRefresh",
        totalNotifications: "SlediPratki.TotalNotifications",
        activeTrackingNumbers: "SlediPratki.ActiveTrackingNumbers",
        archiveTrackingNumbers: "SlediPratki.ArchiveTrackingNumbers",
        autoRefresh: "SlediPratki.Settings.AutoRefresh",
        refreshInterval: "SlediPratki.Settings.RefreshInterval",
        enableNotifications: "SlediPratki.Settings.EnableNotifications",
        maxActivePackages: "SlediPratki.Settings.MaxActivePackages",
        maxArchivePackages: "SlediPratki.Settings.MaxArchivePackages",
        trackingNumbers: "SlediPratki.TrackingNumbers."
    };

    var addZero = function (num) {
        return (num < 10 ? "0" : "") + num;
    }

    /**
    * Format a Date() object to string: "DD Month YYY, HH:MM:SS".
    */ 
    var formatDate = function (date) {
        return addZero(date.getDate()) + " "
            + months[date.getMonth()] + " "
            + date.getFullYear() + ", "
            + addZero(date.getHours()) + ":"
            + addZero(date.getMinutes()) + ":"
            + addZero(date.getSeconds());
    };

    /**
    * Get data for some package from the posta.com.mk service.
    */  
    var getPackage = function (trackingNumber, success, fail) {
        axios({
            method: 'get',
            url: postUrl + trackingNumber,
            timeout: maxRequestTime
        }).then(function (response) {
            success(response);
        }).catch(function (error) {
            fail("error");
        });
    };

    /**
    * Get from the chrome storage.
    */  
    var storageGet = function (keys, end) {
        chrome.storage.sync.get(keys, end);
    };

    /**
    * Set to the chrome storage.
    */  
    var storageSet = function (keysValues, end) {
        chrome.storage.sync.set(keysValues, end);
    };

    /**
    * Remove from the chrome storage.
    */  
    var storageRemove = function (keys, end) {
        chrome.storage.sync.remove(keys, end);
    };

    /**
    * Add or remove badge with notifications on the extension icon.
    */  
    var setBadge = function (notifications) {
        if (notifications === 0) {
            // remove badge
            chrome.browserAction.setBadgeText({ text: "" });
        } else {
            // add badge
            chrome.browserAction.setBadgeBackgroundColor({ color: "#4db6ac" });
            chrome.browserAction.setBadgeText({ text: notifications + "" });
        }
    };

    /**
    * Passed miliseconds from firstDate to secondDate. (secondDate - firstDate)
    */  
    var dateDiff = function (firstDate, secondDate) {
        return secondDate.getTime() - firstDate.getTime();
    };

    /**
    * Refresh the data for all active packages.
    */ 
    var refreshData = function () {
        
    };

    return {
        storageStrings: storageStrings,
        getPackage: getPackage,
        formatDate: formatDate,
        storageGet: storageGet,
        storageSet: storageSet,
        storageRemove: storageRemove,
        setBadge: setBadge,
        dateDiff: dateDiff,
        refreshData: refreshData
    };
})();