(function () {

    var oneHourMillis = 3600000;    // 60 min * 60 sec * 1000 milliseconds = 3.600.000

    var version = chrome.runtime.getManifest().version;

    var defaultValues = {};
    defaultValues[Common.storageStrings.version] = version;
    defaultValues[Common.storageStrings.lastRefresh] = (new Date(0)).toJSON();
    defaultValues[Common.storageStrings.totalNotifications] = 0;
    defaultValues[Common.storageStrings.activeTrackingNumbers] = [];
    defaultValues[Common.storageStrings.archiveTrackingNumbers] = [];
    defaultValues[Common.storageStrings.autoRefresh] = true;
    defaultValues[Common.storageStrings.refreshInterval] = 4;
    defaultValues[Common.storageStrings.enableNotifications] = true;
    defaultValues[Common.storageStrings.maxActivePackages] = 20;
    defaultValues[Common.storageStrings.maxArchivePackages] = 15;

    /**
    * 6. Refresh the data.
    */
    var refreshData = function (storageResults) {
        // log the refreshing time for debug
        console.log("SlediPratki: Background refresh: " + (new Date()).toLocaleString());

        // break if the auto refresh is disabled
        if (!storageResults[Common.storageStrings.autoRefresh])
            return;

        // how many milliseconds passed from the last refresh till now
        var diffRefresh = Common.dateDiff(storageResults[Common.storageStrings.lastRefresh], new Date());
        var refreshInterval = storageResults[Common.storageStrings.refreshInterval] * oneHourMillis;

        // minus one second just in case (to handle small variations)
        if (refreshInterval - 1000 <= diffRefresh) {
            // run refreshActiveTrackingNumbers to refresh data
            Common.storageGet([
                Common.storageStrings.activeTrackingNumbers,
                Common.storageStrings.enableNotifications,
                Common.storageStrings.totalNotifications
            ], Common.refreshActiveTrackingNumbers);
        }
    };

    /**
    * 5. Takes all needed info from the storage to start with refreshing.
    */
    var getStorageAndRefreshData = function () {
        Common.storageGet([
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
            Common.storageSet(defaultValues, getRefreshSettings);
        } else {
            // start the background
            getRefreshSettings();
        }
    };

    /**
    * 0. Start the background scripts.
    */
    Common.storageGet([Common.storageStrings.version], checkVersion);

})();