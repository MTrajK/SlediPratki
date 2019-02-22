(function () {

    // 60 min * 60 sec * 1000 milliseconds = 3.600.000
    var oneHourMillis = 3600000;

    // timeout and interval instances
    var timeoutInstance = undefined;
    var intervalInstance = undefined;

    // refresh flag (to solve problems with sync with the rest browser's backgrounds, some kind of concurrency problem)
    var freeToRefresh = true;
    var freeToRefreshTimeout = undefined;

    // adding new packages from background flag (to prevent adding a same tracking number more than once)
    var addedPackagesTrackingNumbers = [];

    /**
    * 6. Refresh the data.
    */
    var refreshData = function (storageResults) {

        // break if in this moment other background is refreshing proccess
        if (!freeToRefresh) {
            return;
        }

        // break if there are 0 active tracking numbers, nothing to refresh
        if (storageResults[Common.storageStrings.activeTrackingNumbers].length === 0) {
            return;
        }

        // break if the auto refresh is disabled
        if (!storageResults[Common.storageStrings.autoRefresh]) {
            return;
        }

        // how many milliseconds passed from the last refresh till now
        var diffRefresh = Common.dateDiff(storageResults[Common.storageStrings.lastRefresh], new Date());
        var refreshInterval = storageResults[Common.storageStrings.refreshInterval] * oneHourMillis;

        // minus one second just in case (to handle small variations)
        if (refreshInterval - 1000 <= diffRefresh) {
            // refresh data
            Common.refreshActiveTrackingNumbers();
        }
    };

    /**
    * 5. Takes all needed info from the storage to start with refreshing.
    */
    var getStorageAndRefreshData = function () {
        Common.storageGet([
            Common.storageStrings.activeTrackingNumbers,
            Common.storageStrings.autoRefresh,
            Common.storageStrings.refreshInterval,
            Common.storageStrings.lastRefresh
        ], refreshData);
    };

    /**
    * 4. Checks if it's time for start of background interval.
    */
    var setBackgroundInterval = function () {
        getStorageAndRefreshData();
        intervalInstance = setInterval(getStorageAndRefreshData, oneHourMillis);
    };

    /**
    * 3. Checks if it's time for start of background interval.
    */
    var startBackground = function (storageResults) {
        // update the badge
        Common.setBadge(storageResults[Common.storageStrings.totalNotifications]);

        // how many milliseconds passed from the last refresh till now
        var diffRefresh = Common.dateDiff(storageResults[Common.storageStrings.lastRefresh], new Date());
        var refreshInterval = storageResults[Common.storageStrings.refreshInterval] * oneHourMillis;

        if (refreshInterval <= diffRefresh) {
            // if the last refresh is too old, refresh now and set an interval
            setBackgroundInterval();
        } else {
            // if the last refresh is new, set timeout for the rest miliseconds
            timeoutInstance = setTimeout(setBackgroundInterval, diffRefresh - refreshInterval);
        }
    };

    /**
    * 2. Takes info for refresh interval.
    */
    var getRefreshSettings = function () {
        Common.storageGet([
            Common.storageStrings.refreshInterval,
            Common.storageStrings.lastRefresh,
            Common.storageStrings.totalNotifications
        ], startBackground);
    };

    /**
    * 1. Checks if the storage is empty. (if there is no version, the storage is empty)
    */
    var checkVersion = function (response) {
        if (response[Common.storageStrings.version] === undefined) {
            // fill the storage with default values and after that start the background
            Common.setDefaultStorageValues(getRefreshSettings);
        } else {
            // start the background
            getRefreshSettings();
        }
    };

    /**
    * 0. Start the background scripts.
    */
    Common.storageGet([Common.storageStrings.version], checkVersion);

    /**
    * listen for message from another browser or popup.
    */
    chrome.runtime.onMessage.addListener((request) => {
        // adjust interval/timeout if the background data is refreshed in another browser
        if (request.type === 'background_refresh_start' && request.excludeId !== Common.instanceId) {
            // clear the timeouts and intervals for all other browsers before the ajax calls
            // and update the refresh flag
            /////////// TODO: Only set this flag and flag timeout!!!
            freeToRefresh = false;
            /////////// TODO: Don't refresh intervals!!!!
            clearTimeout(timeoutInstance);
            clearInterval(intervalInstance);

            // this timer is in case if the refresh is not completed (browser is closed, popup is closed, background script is stopped, etc)
            freeToRefreshTimeout = setTimeout(function () {
                if (freeToRefresh === false) {
                    freeToRefresh = true;
                    setBackgroundInterval();
                }
            },
                // 2 seconds more just in case (axios is asynchronous by default, and all calls should end before maxRequestTime)
                Common.maxRequestTime + 2000);
        }
        else if (request.type === 'background_refresh_end' && request.excludeId !== Common.instanceId) {
            // update the refresh flag and timeout
            clearTimeout(freeToRefreshTimeout);
            /////////// TODO: Set to true this flag.
            freeToRefresh = true;
            // clear this interval just in case (this is case if freeToRefreshTimeout was executed previously, which shouldn't be possible)
            clearInterval(intervalInstance);
            // and set a new background interval after the ajax calls
            /////////// TODO: Don't set new inerval!!!!
            setBackgroundInterval();
        }
        else if (request.type === 'changed_badge' && request.excludeId !== Common.instanceId) {
            Common.storageGet([Common.storageStrings.totalNotifications], function (response) {
                var notifications = response[Common.storageStrings.totalNotifications];
                // update the badge for this browser
                Common.setBadge(notifications, false);
            });
        }
    });

    /**
    * Context menu for adding a new tracking number.
    * Don't show the selected text, javascript code can be injected (eval is calling)
    */
    chrome.contextMenus.create({
        title: "Додај нова пратка",
        contexts: ["selection"],
        documentUrlPatterns: ["http://*/*", "https://*/*"], // show the context menu only on valid websites
        onclick: function (info) {
            Common.storageGet([
                Common.storageStrings.activeTrackingNumbers
            ], function (response) {
                // format selection
                var selectionText = info.selectionText;
                var formatedSelectionText = selectionText.toUpperCase().replace(/\W/g, '');
                var activeTrackingNumbers = response[Common.storageStrings.activeTrackingNumbers];

                if (formatedSelectionText.length != selectionText.length ||
                    formatedSelectionText.length < 8 ||
                    formatedSelectionText.length > 25) {
                    // show alert because tracking number is not valid
                    chrome.tabs.executeScript({
                        code: "alert('Селектираниот текст не е валиден број на пратка.')"
                    });
                }
                else if (addedPackagesTrackingNumbers.indexOf(formatedSelectionText) !== -1 ||
                    activeTrackingNumbers.indexOf(formatedSelectionText) !== -1) {
                    // show alert because tracking number exist
                    chrome.tabs.executeScript({
                        code: "alert('Пратката постои.')"
                    });
                }
                else {
                    /* TODO:
                    * and prevent the user from adding multiple packages from the background, 
                    * should wait for the first package to be added and after that, he could add another one)
                    * if a package is in process of adding, show an alert to notify user to wait several seconds
                    */
                    // update flag for adding
                    // TODO: remove this logic!!! only one package in time can be added
                    addedPackagesTrackingNumbers.push(formatedSelectionText);

                    // add the tracking number
                    Common.addNewPackage(formatedSelectionText, "", true, function () {
                        // delete this tracking number from the flag
                        var indexToDelete = addedPackagesTrackingNumbers.indexOf(formatedSelectionText);
                        addedPackagesTrackingNumbers.splice(indexToDelete, 1);

                        // send message to popups to notify them about adding of new package
                        chrome.runtime.sendMessage({
                            type: 'added_new_package',
                            excludeId: Common.instanceId
                        });
                    });
                }
            });
        }
    });

})();