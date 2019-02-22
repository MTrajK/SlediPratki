(function () {

    // 60 min * 60 sec * 1000 milliseconds = 3.600.000
    var oneHourMillis = 3600000;

    // refresh flag (to solve problems with sync with the rest browser's backgrounds, some kind of concurrency problem)
    var freeToRefresh = true;
    var freeToRefreshTimeout = undefined;
    var addPackageTimeout = undefined;

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
        setInterval(getStorageAndRefreshData, oneHourMillis);
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
            setTimeout(setBackgroundInterval, diffRefresh - refreshInterval);
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
    *  Update the badge for this browser.
    */
    var updateBadge = function () {
        Common.storageGet([Common.storageStrings.totalNotifications], function (response) {
            var notifications = response[Common.storageStrings.totalNotifications];
            Common.setBadge(notifications);
        });
    };

    /**
    * Listen for change message from another browser or popup.
    */
    Common.storageListener(function (changes) {
        var storageChange = changes[Common.storageStrings.storageChange];

        if (storageChange !== undefined && storageChange.newValue.instanceId !== Common.instanceId) {
            // i need only the newest changes
            storageChange = storageChange.newValue;

            if (storageChange.type === Common.eventsStrings.refreshStart) {
                freeToRefresh = false;

                // this timer is in case if the refresh is not completed (browser is closed, popup is closed, background script is stopped, etc)
                freeToRefreshTimeout = setTimeout(function () {
                    var refreshEnd = {};
                    refreshEnd[Common.storageStrings.storageChange] = {
                        type: Common.eventsStrings.refreshEnd,
                        instanceId: Common.instanceId,
                        time: Common.dateNowJSON()
                    };

                    // send message to all other browsers to close the popups
                    Common.storageSet(refreshEnd);

                    // this instance should be availble again for refreshing
                    freeToRefresh = true;
                }, Common.maxRequestTime + Common.requestExtraTime);
            }
            else if (storageChange.type === Common.eventsStrings.refreshEnd) {
                // clear the timeout
                clearTimeout(freeToRefreshTimeout);

                // this instance should be availble again for refreshing
                freeToRefresh = true;

                // update the badge
                updateBadge();
            }
            else if (storageChange.type === Common.eventsStrings.addPackageStart) {
                // this timer is in case if the adding package is not completed (browser is closed, popup is closed, background script is stopped, etc)
                addPackageTimeout = setTimeout(function () {
                    var addPackageEnd = {};
                    addPackageEnd[Common.storageStrings.storageChange] = {
                        type: Common.eventsStrings.addPackageEnd,
                        instanceId: Common.instanceId,
                        time: Common.dateNowJSON()
                    };

                    // send message to all other browsers to close the popups
                    Common.storageSet(addPackageEnd);
                }, Common.maxRequestTime + Common.requestExtraTime);
            }
            else if (storageChange.type === Common.eventsStrings.addPackageEnd) {
                // clear the timeout
                clearTimeout(addPackageTimeout);

                // update the badge
                updateBadge();
            }
            else if (storageChange.type === Common.eventsStrings.notificationsChange) {
                // update the badge
                updateBadge();
            }
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
                Common.storageStrings.activeTrackingNumbers,
                Common.storageStrings.storageChange
            ], function (response) {
                // format selection
                var selectionText = info.selectionText;
                var formatedSelectionText = selectionText.toUpperCase().replace(/\W/g, '');
                var activeTrackingNumbers = response[Common.storageStrings.activeTrackingNumbers];

                // check the storage for changes
                var storageChange = changes[Common.storageStrings.storageChange];
                if (storageChange !== undefined) {
                    // i need only the newest changes
                    storageChange = storageChange.newValue;
                }

                if (formatedSelectionText.length != selectionText.length ||
                    formatedSelectionText.length < 8 ||
                    formatedSelectionText.length > 25) {
                    // show alert because tracking number is not valid
                    chrome.tabs.executeScript({
                        code: "alert('Селектираниот текст не е валиден број на пратка.')"
                    });
                }
                else if (activeTrackingNumbers.indexOf(formatedSelectionText) !== -1) {
                    // show alert because tracking number exist
                    chrome.tabs.executeScript({
                        code: "alert('Пратката постои.')"
                    });
                }
                else if (storageChange !== undefined &&
                    storageChange.newValue.type === Common.eventsStrings.addPackageStart) {
                    // show alert because in this moment some tracking number is adding
                    chrome.tabs.executeScript({
                        code: "alert('Во моментов се додава пратка, почекајте неколку секунди.')"
                    });
                }
                else if (storageChange !== undefined &&
                    storageChange.newValue.type === Common.eventsStrings.refreshStart) {
                    // show alert because in this moment the active packages are refreshing
                    chrome.tabs.executeScript({
                        code: "alert('Во моментов се освежуваат пратките, почекајте неколку секунди.')"
                    });
                }
                else {
                    // add the tracking number
                    Common.addNewPackage(formatedSelectionText, "", true);
                }
            });
        }
    });

})();