(function (global) {

    var appVersion = chrome.runtime.getManifest().version;
    var postUrl = "https://www.posta.com.mk/tnt/api/query?id=";
    var maxRequestTime = 15000;     // 15 seconds max request (maybe this is too much)
    var requestExtraTime = 3000;    // extra time to wait after the request
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
        storageChange: "SlediPratki.StorageChange",
        closeAllPopups: "SlediPratki.CloseAllPopups",
        trackingNumbers: "SlediPratki.TrackingNumbers."
    };

    /**
    * Storage changes strings. Only for events that need to be handle by the rest browsers and pcs.
    * 
    * No conflict changes methods: changeAutoRefresh, changeRefreshInterval, changeEnableNotifications, 
    * moveArchiveToActive, moveActiveToArchive, changePackageDescription, deleteArchivePackage, deleteActivePackage
    * 
    * Conflict changes methods: removeNotifications, addNewPackage, refreshActiveTrackingNumbers
    */
    var eventsStrings = {
        refreshStart: "refresh_start",
        refreshEnd: "refresh_end",
        addPackageStart: "add_package_start",
        addPackageEnd: "add_package_end",
        notificationsChange: "notifications_change"
    };

    /**
    * Default storage values.
    */
    var defaultStorageValues = {};
    defaultStorageValues[storageStrings.version] = appVersion;
    defaultStorageValues[storageStrings.lastRefresh] = (new Date(0)).toJSON();
    defaultStorageValues[storageStrings.totalNotifications] = 0;
    defaultStorageValues[storageStrings.activeTrackingNumbers] = [];
    defaultStorageValues[storageStrings.archiveTrackingNumbers] = [];
    defaultStorageValues[storageStrings.autoRefresh] = true;
    defaultStorageValues[storageStrings.refreshInterval] = 24;
    defaultStorageValues[storageStrings.enableNotifications] = true;
    defaultStorageValues[storageStrings.maxActivePackages] = 20;
    defaultStorageValues[storageStrings.maxArchivePackages] = 15;
    defaultStorageValues[storageStrings.storageChange] = {
        type: undefined,
        instanceId: undefined,
        // use time to know if this change is still active
        time: undefined // string
    };
    defaultStorageValues[storageStrings.closeAllPopups] = undefined; // instanceId

    /**
    * Generate random Id string.
    */
    var generateRandomId = function () {
        return Math.random().toString() + Math.random().toString();
    };

    /**
    * Generate a random Id for this instance.
    */
    var instanceId = generateRandomId();

    /**
    * Helper method to add zero in front of number with 1 digit.
    */
    var addZero = function (num) {
        return (num < 10 ? "0" : "") + num;
    }

    /**
    * Format a Date() object to string: "DD Month YYY, HH:MM:SS".
    */
    var formatDate = function (date) {
        if (typeof date === "string") {
            date = new Date(date);
        }

        return addZero(date.getDate()) + " "
            + months[date.getMonth()] + " "
            + date.getFullYear() + ", "
            + addZero(date.getHours()) + ":"
            + addZero(date.getMinutes()) + ":"
            + addZero(date.getSeconds());
    };

    /**
    * Get the current date in string format.
    */
    var dateNowJSON = function () {
        return (new Date()).toJSON();
    };

    /**
    * Structure of posta.com.mk XML response
    *    <ArrayOfTrackingData>
    *        <TrackingData>
	*	        <ID>UN232716818CN</ID>
	*	        <Begining>Skopje IO 1003</Begining>
	*	        <End>1020</End>
	*	        <Date>11/5/2018, 1:33:10 PM</Date>
	*	        <Notice>Vo Posta</Notice>
	*        </TrackingData>
    *    </ArrayOfTrackingData>
    */
    var convertXMLToList = function (xmlResult) {
        // if there are no results for some tracking number then the service will return <ArrayOfTrackingData></ArrayOfTrackingData>
        // and the result will stay empty
        var result = [];

        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlResult, "text/xml");

        var length = xmlDoc.getElementsByTagName("TrackingData").length;

        // look only for Begining, End, Date and Notice tags (those are used by app)
        // i'm using beginning (with two n) in the code
        for (var i = 0; i < length; i++) {
            var beginning = xmlDoc.getElementsByTagName("Begining")[i].childNodes[0];
            var end = xmlDoc.getElementsByTagName("End")[i].childNodes[0];
            var date = xmlDoc.getElementsByTagName("Date")[i].childNodes[0];
            var notice = xmlDoc.getElementsByTagName("Notice")[i].childNodes[0];

            // search for self-closing tag
            result.push({
                beginning: (beginning === undefined) ? "" : beginning.nodeValue,
                end: (end === undefined) ? "" : end.nodeValue,
                date: (date === undefined) ? "" : date.nodeValue,
                notice: (notice === undefined) ? "" : notice.nodeValue
            });
        }

        // returns list of tracking data
        return result;
    };

    /**
    * Format the notice text from posta.com.mk response. 
    */
    var formatNoticeText = function (notice) {
        switch (notice) {
            case "Ispora~ana":
                return "Испорачана";
            case "Vo Posta":
                return "Во пошта";
            case "Pristignata vo Naizmeni!na po{ta(Vlez)":
                return "Пристигната во наизменична пошта";
            case "Za isporaka na {alter":
                return "За испорака на шалтер";
            case "Za Dost./ Ispor.":
                return "За достава";
            case "Vtora dostava":
                return "Втора достава";
            case "Pratkata se prima od Ispra}a~":
                return "Пратката се прима";
            case "Ne pobaral":
                return "Не побарал";
            default:
                return notice;
        }
    };

    /**
    * Formats dates and notice text.
    * Return the package data in this JSON format:
    *    {
    *        trackingNumber: string,
    *        packageDescription: string,
    *        lastRefresh: formatDate(string or Date),
    *        status: string,
    *        notifications: integer,
    *        trackingData: [{
    *            date: formatDate(string or Date)),
    *            beginning: string,
    *            end: string,
    *            notice: formatNoticeText(string)
    *        }]
    *    }
    */
    var formatPackageData = function (packageData) {
        var result = {};

        result.trackingNumber = packageData.trackingNumber;
        result.packageDescription = packageData.packageDescription;
        result.lastRefresh = formatDate(packageData.lastRefresh);
        result.status = packageData.status;
        result.notifications = packageData.notifications;
        result.trackingData = [];

        for (var i = 0; i < packageData.trackingData.length; i++) {
            var dataRow = packageData.trackingData[i];

            result.trackingData.push({
                date: formatDate(dataRow.date),
                beginning: dataRow.beginning,
                end: dataRow.end,
                notice: formatNoticeText(dataRow.notice)
            });
        }

        return result;
    };

    /**
    * Get status of tracking data (read the notice from the last result).
    * 3 possible statuses: 
    * - "remove_circle": no results
    * - "local_shipping": package in transit
    * - "where_to_vote": package recived
    */
    var getStatusOfTrackingData = function (trackingData) {
        var length = trackingData.length;

        if (length === 0) {
            return "remove_circle";
        } else if (trackingData[length - 1].notice === "Ispora~ana") {
            return "where_to_vote";
        } else {
            return "local_shipping";
        }
    };

    /**
    * Passed miliseconds from firstDate to secondDate. (secondDate - firstDate)
    */
    var dateDiff = function (firstDate, secondDate) {
        if (typeof firstDate === "string") {
            firstDate = new Date(firstDate);
        }
        if (typeof secondDate === "string") {
            secondDate = new Date(secondDate);
        }

        return secondDate.getTime() - firstDate.getTime();
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
            var convertedResponse = convertXMLToList(response.data);
            success(convertedResponse, trackingNumber);
        }).catch(function (error) {
            fail("error", trackingNumber);
        });
    };

    /* 
        All extensions have personal chrome.storage.sync,
        you can't access some other extensions storage!
        When an extension is deleted, the storage is also deleted!
    */

    /**
    * Get from the chrome storage.
    */
    var storageGet = function (keys, callback) {
        chrome.storage.sync.get(keys, callback);
    };

    /**
    * Set to the chrome storage.
    */
    var storageSet = function (keysValues, callback) {
        chrome.storage.sync.set(keysValues, callback);
    };

    /**
    * Remove from the chrome storage.
    */
    var storageRemove = function (keys, callback) {
        chrome.storage.sync.remove(keys, callback);
    };

    /**
    * Listen from storage for change.
    */
    var storageListener = function (callback) {
        chrome.storage.onChanged.addListener(callback);
    };

    /**
    * Fill the storage with default values.
    */
    var setDefaultStorageValues = function (callback) {
        storageSet(defaultStorageValues, callback);
    };

    /**
    * Add or remove badge with notifications on the extension icon.
    */
    var setBadge = function (notifications) {
        if (notifications < 1) {
            // remove badge
            chrome.browserAction.setBadgeText({ text: "" });
        } else {
            // add badge
            chrome.browserAction.setBadgeBackgroundColor({ color: "#4db6ac" });
            chrome.browserAction.setBadgeText({ text: notifications + "" });
        }
    };

    /**
    * Show notifications window in the right bottom corner.
    */
    var showNotifications = function (notifications) {
        var suffix = (notifications > 1 ? "и" : "а");

        var notificationOptions = {
            type: "basic",
            title: "Следи Пратки",
            message: notifications + " нов" + suffix + " промен" + suffix + " во пратките.",
            iconUrl: "../img/icon128.png"
        };

        chrome.notifications.create("SlediPratki.Notification-" + generateRandomId(), notificationOptions);
    };

    /**
    * Refresh the data for all active tracking numbers.
    */
    var refreshActiveTrackingNumbers = function (callback) {
        // send change message for refresh start
        var refreshStart = {};
        refreshStart[storageStrings.storageChange] = {
            type: eventsStrings.refreshStart,
            instanceId: instanceId,
            time: dateNowJSON()
        };

        storageSet(refreshStart, function () {
            storageGet([
                storageStrings.activeTrackingNumbers,
                storageStrings.enableNotifications
            ], function (response) {
                // data from storage
                var activeTrackingNumbers = response[storageStrings.activeTrackingNumbers];
                var enableNotifications = response[storageStrings.enableNotifications];
                var totalActiveTrackingNumbers = activeTrackingNumbers.length;

                // nothing to refresh if there are 0 active tracking numbers
                // this case should not happen
                if (totalActiveTrackingNumbers === 0) {
                    return;
                }

                var result = {};
                // save the last refresh before calling calling the api 
                // (in this way, this browser/background will have priority in the next refreshing scheduling)
                result[storageStrings.lastRefresh] = dateNowJSON();

                var activeTrackingNumbersStorageStrings = [];

                // create storage strings for each active tracking number
                for (var i = 0; i < totalActiveTrackingNumbers; i++) {
                    activeTrackingNumbersStorageStrings.push(storageStrings.trackingNumbers + activeTrackingNumbers[i]);
                }

                // get old results for all active tracking numbers
                storageGet(activeTrackingNumbersStorageStrings, function (oldResults) {
                    var visitedActiveTrackingNumbers = 0;
                    var activeTrackingNumbersNewTrackingData = {};

                    var ajaxCallback = function (newTrackingDataApi, trackingNumber) {
                        // collect new tracking data (api response)
                        activeTrackingNumbersNewTrackingData[trackingNumber] = newTrackingDataApi;
                        visitedActiveTrackingNumbers++;

                        // if all active tracking numbers are visited, then this is the last response from api, compare old vs new trackingData
                        if (visitedActiveTrackingNumbers === totalActiveTrackingNumbers) {

                            // count the difference in the new and old results and update old notifications
                            var newNotifications = 0;
                            var oldNotifications = 0;

                            // compare the new active tracking numbers with the old ones and save results
                            for (var j = 0; j < totalActiveTrackingNumbers; j++) {
                                // get the old result for this tracking number
                                var updatedResult = oldResults[activeTrackingNumbersStorageStrings[j]];

                                // update last refresh for this tracking number
                                updatedResult.lastRefresh = dateNowJSON();

                                // get the new result for this tracking number
                                var newTrackingData = activeTrackingNumbersNewTrackingData[activeTrackingNumbers[j]];

                                // if there is a response from the server
                                if (newTrackingData !== "error") {
                                    // new notifications for this tracking number
                                    var newLocalNotifications = newTrackingData.length - updatedResult.trackingData.length;
                                    var dataN = Math.min(newTrackingData.length, updatedResult.trackingData.length);
                                    // save the number of old notifications
                                    var oldLocalNotifications = updatedResult.notifications;
                                    
                                    // compare each row from old vs new results
                                    for (var dataI = 0; dataI < dataN; dataI++) 
                                        if (newTrackingData[dataI].notice !== updatedResult.trackingData[dataI].notice) {
                                            newLocalNotifications++;
                                            oldLocalNotifications--;
                                        }

                                    // if there is a new result and something new in that result
                                    // then update everything except the trackingNumber and packageDescription for this tracking number
                                    // so update only: status, notifications, trackingData (lastRefresh is previously updated)
                                    if (newLocalNotifications > 0) {
                                        // update the status
                                        updatedResult.status = getStatusOfTrackingData(newTrackingData);

                                        // update notifications for this tracking number
                                        newNotifications += newLocalNotifications;
                                        oldNotifications += oldLocalNotifications;
                                        updatedResult.notifications = oldLocalNotifications + newLocalNotifications;

                                        // save the new tracking data
                                        updatedResult.trackingData = newTrackingData;

                                        // save the updated result (save only if there is something new)
                                        // this will fix the notification bug
                                        result[activeTrackingNumbersStorageStrings[j]] = updatedResult;
                                    }
                                } else {
                                    // get the old notifications for trackingNumber 
                                    oldNotifications += updatedResult.notifications;
                                }
                            }

                            var allNotifications = oldNotifications + newNotifications;

                            // save the number of total notifications
                            result[storageStrings.totalNotifications] = allNotifications;

                            // update the badge
                            setBadge(allNotifications);

                            // show notifications window in the right bottom corner
                            // show only if there are new notifications and notifications are enabled
                            if (enableNotifications && newNotifications > 0) {
                                showNotifications(newNotifications);
                            }

                            // send change message for refresh end
                            result[storageStrings.storageChange] = {
                                type: eventsStrings.refreshEnd,
                                instanceId: instanceId,
                                time: dateNowJSON()
                            };

                            // save the new results in storage
                            storageSet(result, function () {

                                // return the new results if there is a callback method
                                if (callback && (typeof callback === "function")) {
                                    // also send a list of all active tracking numbers
                                    result[storageStrings.activeTrackingNumbers] = activeTrackingNumbers;
                                    callback(result);
                                }

                            });
                        }
                    };

                    // call the api for all active tracking numbers
                    for (var i = 0; i < totalActiveTrackingNumbers; i++) {
                        getPackage(activeTrackingNumbers[i], ajaxCallback, ajaxCallback);
                    }
                });
            });
        });
    };

    /**
    * Add new package.
    */
    var addNewPackage = function (trackingNumber, packageDescription, fromBackground, callback) {
        var ajaxCallback = function (apiResponse) {
            storageGet([
                storageStrings.activeTrackingNumbers,
                storageStrings.enableNotifications,
                storageStrings.totalNotifications
            ], function (response) {
                // change api response if error
                if (apiResponse === "error") {
                    apiResponse = [];
                }

                // create the new package
                var newPackage = {};
                newPackage.trackingNumber = trackingNumber;
                newPackage.packageDescription = packageDescription;
                newPackage.lastRefresh = dateNowJSON();
                newPackage.status = getStatusOfTrackingData(apiResponse);
                newPackage.notifications = 0;
                newPackage.trackingData = apiResponse;

                var updateStorage = {};

                // update notifications if package is added from the background
                if (fromBackground) {
                    // update the number of notifications for this package
                    var newNotifications = apiResponse.length;
                    newPackage.notifications = newNotifications;

                    // update the total number of notifications
                    var totalNotifications = response[storageStrings.totalNotifications] + newNotifications;
                    updateStorage[storageStrings.totalNotifications] = totalNotifications;

                    // update the badge
                    setBadge(totalNotifications);

                    var enableNotifications = response[storageStrings.enableNotifications];

                    // show notifications window in the right bottom corner
                    // show only if there are new notifications and notifications are enabled
                    if (enableNotifications && newNotifications > 0) {
                        showNotifications(newNotifications);
                    }
                }

                // add this tracking number into active tracking numbers list
                var newActiveTrackingNumbers = response[storageStrings.activeTrackingNumbers];
                newActiveTrackingNumbers.push(trackingNumber);
                updateStorage[storageStrings.activeTrackingNumbers] = newActiveTrackingNumbers;

                // update active tracking numbers list and add the new package
                updateStorage[storageStrings.trackingNumbers + trackingNumber] = newPackage;

                // send change message for add package end
                updateStorage[storageStrings.storageChange] = {
                    type: eventsStrings.addPackageEnd,
                    instanceId: instanceId,
                    time: dateNowJSON()
                };

                storageSet(updateStorage, function () {
                    // send the new package to the callback method
                    if (callback && (typeof callback === "function")) {
                        callback(newPackage);
                    }
                });
            });
        };

        // send change message for add package start
        var addPackageStart = {};
        addPackageStart[storageStrings.storageChange] = {
            type: eventsStrings.addPackageStart,
            instanceId: instanceId,
            time: dateNowJSON()
        };

        storageSet(addPackageStart, function () { 
            // call the api
            getPackage(trackingNumber, ajaxCallback, ajaxCallback);
        });
    };

    /**
    * Delete active package.
    */
    var deleteActivePackage = function (trackingNumber, callback) {
        var thisTrackingNumber = storageStrings.trackingNumbers + trackingNumber;

        storageGet([
            storageStrings.activeTrackingNumbers
        ], function (response) {
            var activeTrackingNumbers = response[storageStrings.activeTrackingNumbers];

            // remove tracking number from active
            var removeIndex = activeTrackingNumbers.indexOf(trackingNumber);
            activeTrackingNumbers.splice(removeIndex, 1);

            // save the updated list
            var updateActiveTrackingNumbers = {};
            updateActiveTrackingNumbers[storageStrings.activeTrackingNumbers] = activeTrackingNumbers;

            storageSet(updateActiveTrackingNumbers, function () {
                storageRemove([thisTrackingNumber], callback);
            });
        });
    };

    /**
    * Delete archive package.
    */
    var deleteArchivePackage = function (trackingNumber, callback) {
        var thisTrackingNumber = storageStrings.trackingNumbers + trackingNumber;

        storageGet([
            storageStrings.archiveTrackingNumbers
        ], function (response) {
            var archiveTrackingNumbers = response[storageStrings.archiveTrackingNumbers];

            // remove tracking number from archive
            var removeIndex = archiveTrackingNumbers.indexOf(trackingNumber);
            archiveTrackingNumbers.splice(removeIndex, 1);

            // save the updated list
            var updatearchiveTrackingNumbers = {};
            updatearchiveTrackingNumbers[storageStrings.archiveTrackingNumbers] = archiveTrackingNumbers;

            storageSet(updatearchiveTrackingNumbers, function () {
                storageRemove([thisTrackingNumber], callback);
            });
        });
    };

    /**
    * Change description of package.
    */
    var changePackageDescription = function (trackingNumber, packageDescription, callback) {
        var thisTrackingNumber = storageStrings.trackingNumbers + trackingNumber;

        storageGet([
            thisTrackingNumber
        ], function (response) {
            // update the package description
            var package = response[thisTrackingNumber];
            package.packageDescription = packageDescription;

            // save the package with updated description
            var updatePackage = {};
            updatePackage[thisTrackingNumber] = package;

            storageSet(updatePackage, callback);
        });
    };

    /**
    * Move an active package to archive. 
    */
    var moveActiveToArchive = function (trackingNumber, callback) {
        storageGet([
            storageStrings.activeTrackingNumbers,
            storageStrings.archiveTrackingNumbers
        ], function (response) {
            var activeTrackingNumbers = response[storageStrings.activeTrackingNumbers];
            var archiveTrackingNumbers = response[storageStrings.archiveTrackingNumbers];

            // remove tracking number from active
            var removeIndex = activeTrackingNumbers.indexOf(trackingNumber);
            activeTrackingNumbers.splice(removeIndex, 1);

            // add tracking number in archive
            archiveTrackingNumbers.push(trackingNumber);

            // save the updated lists
            var updateTrackingNumbers = {};
            updateTrackingNumbers[storageStrings.activeTrackingNumbers] = activeTrackingNumbers;
            updateTrackingNumbers[storageStrings.archiveTrackingNumbers] = archiveTrackingNumbers;

            storageSet(updateTrackingNumbers, callback);
        });
    };

    /**
    * Move an archived package to active. 
    */
    var moveArchiveToActive = function (trackingNumber, callback) {
        storageGet([
            storageStrings.activeTrackingNumbers,
            storageStrings.archiveTrackingNumbers
        ], function (response) {
            var activeTrackingNumbers = response[storageStrings.activeTrackingNumbers];
            var archiveTrackingNumbers = response[storageStrings.archiveTrackingNumbers];

            // remove tracking number from archive
            var removeIndex = archiveTrackingNumbers.indexOf(trackingNumber);
            archiveTrackingNumbers.splice(removeIndex, 1);

            // add tracking number in active
            activeTrackingNumbers.push(trackingNumber);

            // save the updated lists
            var updateTrackingNumbers = {};
            updateTrackingNumbers[storageStrings.activeTrackingNumbers] = activeTrackingNumbers;
            updateTrackingNumbers[storageStrings.archiveTrackingNumbers] = archiveTrackingNumbers;

            storageSet(updateTrackingNumbers, callback);
        });
    };

    /**
    * Change settings property for auto refresh. 
    */
    var changeAutoRefresh = function (autoRefresh, callback) {
        var autoRefreshChange = {};
        autoRefreshChange[storageStrings.autoRefresh] = autoRefresh;
        storageSet(autoRefreshChange, callback);
    };

    /**
    * Change settings property for refresh interval. 
    */
    var changeRefreshInterval = function (refreshInterval, callback) {
        var refreshIntervalChange = {};
        refreshIntervalChange[storageStrings.refreshInterval] = refreshInterval;
        storageSet(refreshIntervalChange, callback);
    };

    /**
    * Change settings property for notifications. 
    */
    var changeEnableNotifications = function (enableNotifications, callback) {
        var enableNotificationsChange = {};
        enableNotificationsChange[storageStrings.enableNotifications] = enableNotifications;
        storageSet(enableNotificationsChange, callback);
    };

    /**
    * Remove notifications for some tracking number. 
    */
    var removeNotifications = function (trackingNumber, callback) {
        var thisTrackingNumber = storageStrings.trackingNumbers + trackingNumber;

        storageGet([
            storageStrings.totalNotifications,
            thisTrackingNumber
        ], function (response) {
            var package = response[thisTrackingNumber];

            // update total notifications
            var totalNotifications = response[storageStrings.totalNotifications] - package.notifications;

            // update the badge
            setBadge(totalNotifications);

            // remove all notifications for this package
            package.notifications = 0;

            // save the package with 0 notifications and update total notifications
            var updateStorage = {};
            updateStorage[thisTrackingNumber] = package;
            updateStorage[storageStrings.totalNotifications] = totalNotifications;

            // send change message for badge update
            updateStorage[storageStrings.storageChange] = {
                type: eventsStrings.notificationsChange,
                instanceId: instanceId,
                time: dateNowJSON()
            };

            storageSet(updateStorage, callback);
        });
    };

    /**
    * Get all info needed for the app.
    */
    var getAllData = function (callback) {
        storageGet([
            storageStrings.version,
            storageStrings.activeTrackingNumbers,
            storageStrings.archiveTrackingNumbers,
            storageStrings.autoRefresh,
            storageStrings.refreshInterval,
            storageStrings.enableNotifications,
            storageStrings.maxActivePackages,
            storageStrings.maxArchivePackages,
            storageStrings.storageChange
        ], function (response) {
            if (response[storageStrings.version] === undefined) {
                // This will be true if the app icon is pressed immediately after oppening the browser
                // because there is 10 seconds sync waiting time in the background.js
                setTimeout(function () {
                    // try after one second again
                    getAllData(callback);
                }, 1000);
                return;
            }

            // tracking numbers properties
            var activeTrackingNumbers = response[storageStrings.activeTrackingNumbers];
            var archiveTrackingNumbers = response[storageStrings.archiveTrackingNumbers];
            // merge active and archive tracking numbers
            var allTrackingNumbers = activeTrackingNumbers.concat(archiveTrackingNumbers);
            var totalTrackingNumbers = allTrackingNumbers.length;
            var allPackagesWithData = {};

            // save all results that need to be returned to the callback method
            var result = {};
            result[storageStrings.trackingNumbers] = allPackagesWithData;
            result[storageStrings.activeTrackingNumbers] = activeTrackingNumbers;
            result[storageStrings.archiveTrackingNumbers] = archiveTrackingNumbers;
            result[storageStrings.autoRefresh] = response[storageStrings.autoRefresh];
            result[storageStrings.refreshInterval] = response[storageStrings.refreshInterval];
            result[storageStrings.enableNotifications] = response[storageStrings.enableNotifications];
            result[storageStrings.maxActivePackages] = response[storageStrings.maxActivePackages];
            result[storageStrings.maxArchivePackages] = response[storageStrings.maxArchivePackages];
            result[storageStrings.storageChange] = response[storageStrings.storageChange];

            if (totalTrackingNumbers === 0) {
                if (callback && (typeof callback === "function")) {
                    // return results without tracking numbers
                    callback(result);
                }
            } else {
                var allTrackingNumbersStorageStrings = [];

                for (var i = 0; i < totalTrackingNumbers; i++) {
                    allTrackingNumbersStorageStrings.push(storageStrings.trackingNumbers + allTrackingNumbers[i]);
                }

                storageGet(allTrackingNumbersStorageStrings,
                    function (allPackagesResponse) {
                        // send the result to the callback function
                        if (callback && (typeof callback === "function")) {
                            // add the data of each package to the result
                            for (var i = 0; i < totalTrackingNumbers; i++) {
                                allPackagesWithData[allTrackingNumbers[i]] = allPackagesResponse[allTrackingNumbersStorageStrings[i]];
                            }

                            // update the result
                            result[storageStrings.trackingNumbers] = allPackagesWithData;

                            callback(result);
                        }
                    });
            }
        });
    };

    global.Common =  {
        instanceId: instanceId,
        storageStrings: storageStrings,
        eventsStrings: eventsStrings,
        maxRequestTime: maxRequestTime,
        requestExtraTime: requestExtraTime,
        formatDate: formatDate,
        dateNowJSON: dateNowJSON,
        formatNoticeText: formatNoticeText,
        formatPackageData: formatPackageData,
        getStatusOfTrackingData: getStatusOfTrackingData,
        dateDiff: dateDiff,
        getPackage: getPackage,
        storageGet: storageGet,
        storageSet: storageSet,
        storageRemove: storageRemove,
        storageListener: storageListener,
        setDefaultStorageValues: setDefaultStorageValues,
        setBadge: setBadge,
        showNotifications: showNotifications,
        refreshActiveTrackingNumbers: refreshActiveTrackingNumbers,
        addNewPackage: addNewPackage,
        deleteActivePackage: deleteActivePackage,
        deleteArchivePackage: deleteArchivePackage,
        changePackageDescription: changePackageDescription,
        moveActiveToArchive: moveActiveToArchive,
        moveArchiveToActive: moveArchiveToActive,
        changeAutoRefresh: changeAutoRefresh,
        changeRefreshInterval: changeRefreshInterval,
        changeEnableNotifications: changeEnableNotifications,
        removeNotifications: removeNotifications,
        getAllData: getAllData
    };
}(this));