(function () {

    var closeAllPopups = {};
    closeAllPopups[Common.storageStrings.closeAllPopups] = Common.instanceId;

    // send message to all other browsers to close the popups
    Common.storageSet(closeAllPopups);

    // listen for change message from another browser's popup
    Common.storageListener(function (changes) {
        var popupChange = changes[Common.storageStrings.closeAllPopups];

        if (popupChange !== undefined && popupChange.newValue !== Common.instanceId) {
            // close this popup if new is open
            window.close();
        }
    });

}());