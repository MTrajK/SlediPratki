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

    var dateNowJSON = function () {
        return (new Date()).toJSON();
    };

    var convertXMLToList = function (xmlResult) {
        var result = [];

        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlResult, "text/xml");

        var length = xmlDoc.getElementsByTagName("TrackingData").length;

        for (var i = 0; i < length; i++) {
            result.push({
                begining: xmlDoc.getElementsByTagName("Begining")[i].childNodes[0].nodeValue,
                end: xmlDoc.getElementsByTagName("End")[i].childNodes[0].nodeValue,
                date: xmlDoc.getElementsByTagName("Date")[i].childNodes[0].nodeValue,
                notice: xmlDoc.getElementsByTagName("Notice")[i].childNodes[0].nodeValue
            });
        }

        // returns list of tracking data
        return result;
    };

    /**
    * Get status of tracking data (read the notice from the last result).
    * 3 possible statuses: 
    * - "clear": no results
    * - "local_shipping": package in transit
    * - "done": package recived
    */
    var getStatusOfTrackingData = function (trackingData) {
        var length = trackingData.length;

        if (length === 0) {
            return "clear";
        } else if (trackingData[length - 1].notice === "Ispora~ana") {
            return "done";
        } else {
            return "local_shipping";
        }
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
            var convertedResponse = convertXMLToList(responese);
            success(convertedResponse);
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
    * Refresh the data for all active tracking numbers.
    */
    var refreshActiveTrackingNumbers = function (storage, end) {
        var activeTrackingNumbers = storage[storageStrings.activeTrackingNumbers];
        var enableNotifications = storage[storageStrings.enableNotifications];
        var totalNotifications = storage[storageStrings.totalNotifications];
        var activeTrackingNumbersLength = activeTrackingNumbers.length;
        var refreshedPackages = 0;
        var newNotifications = 0;

        // get the old results for all tracking numbers
        for (var i = 0; i < activeTrackingNumbersLength; i++) {
            var thisTrackingNumber = storageStrings.trackingNumbers + allActiveTrackingNumbers[i];

            var callback = function (newResult) {
                storageGet([thisTrackingNumber], function (oldResult) {

                    var updateOldResult = oldResult[thisTrackingNumber];
                    // update last refresh for this tracking number
                    updateOldResult.lastRefresh = dateNowJSON();

                    if (newResult !== "error") {
                        // update notifications for this tracking number
                        var newLocalNotifications = newResult.length - updateOldResult.trackingData.length;
                        newNotifications += newLocalNotifications;
                        updateOldResult.notifications += newLocalNotifications;

                        // save the new tracking data
                        updateOldResult.trackingData = newResult;

                        // update the status
                        updateOldResult.status = getStatusOfTrackingData(newResult);
                    }

                    // update this tracking number
                    var updateThisTrackingNumber = {};
                    updateThisTrackingNumber[thisTrackingNumber] = updateOldResult;
                    storageSet(updateThisTrackingNumber);

                    refreshedPackages++;

                    if (totalPackages === refreshedPackages) {
                        // in this case all packages are refreshed/synced

                        var updateStorage = {};
                        // update global last refresh
                        updateStorage[storageStrings.lastRefresh] = dateNowJSON();

                        // update total notifications
                        var allNotifications = totalNotifications + newNotifications;
                        updateStorage[storageStrings.totalNotifications] = allNotifications;
                        storageSet(updateStorage);

                        // update the badge
                        setBadge(allNotifications);

                        // show notification window in the right bottom corner
                        if (enableNotifications && newNotifications > 0) {
                            var suffix = (newNotifications > 1 ? "и" : "а");
                            var options = {
                                type: "basic",
                                title: "Следи Пратки",
                                message: newNotifications + " нов" + suffix + " промен" + suffix + " во пратките.",
                                iconUrl: "../img/icon128.png"
                            };
                            chrome.notifications.create("SlediPratki" + (new Date()).getTime(), options);
                        }

                        // run end() callback method
                        if (end) {
                            end();
                        }
                    }

                });
            };

            getPackage(thisTrackingNumber, callback, callback);
        }
    };

    return {
        storageStrings: storageStrings,
        formatDate: formatDate,
        getStatusOfTrackingData: getStatusOfTrackingData,
        getPackage: getPackage,
        storageGet: storageGet,
        storageSet: storageSet,
        storageRemove: storageRemove,
        setBadge: setBadge,
        dateDiff: dateDiff,
        refreshActiveTrackingNumbers: refreshActiveTrackingNumbers
    };
})();