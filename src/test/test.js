(function () {
    // delete the whole storage
    chrome.storage.sync.clear(function () {

        // after that fill the storage with default values
        Common.setDefaultStorageValues(function () {
            // create testing values
            var testData = {
                "SlediPratki.ActiveTrackingNumbers": [
                    "UB014461957SG",
                    "UN246333963CN",
                    "RM979696602CN",
                    "UN216260088CN",
                    "UC647061499CN"
                ],
                "SlediPratki.LastRefresh": "2019-02-18T19:47:22.610Z",
                "SlediPratki.TotalNotifications": 8,
                "SlediPratki.TrackingNumbers.RM979696602CN": {
                    trackingNumber: "RM979696602CN",
                    lastRefresh: "2019-02-18T19:47:25.056Z",
                    notifications: 2,   
                    packageDescription: "Прилепска",
                    status: "local_shipping",
                    trackingData: [ // AFTER REFRESHING SHOULD HAVE 3 TRACKING DATA OBJECTS
                        {
                            beginning: "  MKSKPB",
                            date: "10/17/2018, 10:27:01 AM",
                            end: "",
                            notice: "Pristignata vo Naizmeni!na po{ta(Vlez)"
                        },
                        {
                            beginning: "Skopje IO 1003",
                            date: "10/17/2018, 8:15:44 PM",
                            end: "7500",
                            notice: "Vo Posta"
                        }
                    ]
                },
                "SlediPratki.TrackingNumbers.UB014461957SG": {
                    trackingNumber: "UB014461957SG",
                    lastRefresh: "2019-02-18T19:47:25.055Z",
                    notifications: 1,
                    packageDescription: "Скопска 1",
                    status: "local_shipping",
                    trackingData: [ // AFTER REFRESHING SHOULD HAVE 3 TRACKING DATA OBJECTS
                        {
                            beginning: "Skopje IO 1003",
                            date: "1/17/2019, 4:09:50 PM",
                            end: "1060",
                            notice: "Vo Posta"
                        },
                        {
                            beginning: "Skopje - \.Petrov 1060",
                            date: "1/18/2019, 6:50:23 PM",
                            end: "1005",
                            notice: "Vo Posta"
                        }
                    ]
                },
                "SlediPratki.TrackingNumbers.UC647061499CN": {
                    trackingNumber: "UC647061499CN",
                    lastRefresh: "2019-02-18T19:47:25.056Z",
                    notifications: 0,
                    packageDescription: "Скопска бп",
                    status: "clear",
                    trackingData: []
                },
                "SlediPratki.TrackingNumbers.UN216260088CN": {
                    trackingNumber: "UN216260088CN",
                    lastRefresh: "2019-02-18T19:47:25.056Z",
                    notifications: 0,
                    packageDescription: "Скопска 2",
                    status: "done",
                    trackingData: [ // NO NEW CHANGES AFTER REFRESHING
                        {
                            beginning: "Skopje IO 1003",
                            date: "10/22/2018, 1:31:57 PM",
                            end: "1020",
                            notice: "Vo Posta"
                        },
                        {
                            beginning: "Skopje -20 1020",
                            date: "10/24/2018, 12:39:29 PM",
                            end: "Dostava",
                            notice: "Ispora~ana"
                        }
                    ]
                },
                "SlediPratki.TrackingNumbers.UN246333963CN": {
                    trackingNumber: "UN246333963CN",
                    lastRefresh: "2019-02-18T19:47:25.055Z",
                    notifications: 5,
                    packageDescription: "Битолска",
                    status: "done",
                    trackingData: [ // NO NEW CHANGES AFTER REFRESHING
                        {
                            beginning: "Skopje IO 1003",
                            date: "11/12/2018, 5:00:07 PM",
                            end: "7005",
                            notice: "Vo Posta"
                        },
                        {
                            beginning: "Bitola  7005",
                            date: "11/13/2018, 7:13:24 AM",
                            end: "7000",
                            notice: "Vo Posta"
                        },
                        {
                            beginning: "Bitola-DOSTAVA 7000",
                            date: "11/13/2018, 1:06:25 PM",
                            end: "Dostava",
                            notice: "Za isporaka na {alter"
                        },
                        {
                            beginning: "Bitola-DOSTAVA 7000",
                            date: "11/13/2018, 4:19:00 PM",
                            end: "7000",
                            notice: "Vo Posta"
                        },
                        {
                            beginning: "Bitola  7000",
                            date: "11/14/2018, 10:21:41 AM",
                            end: "Isporaka",
                            notice: "Ispora~ana"
                        }
                    ]
                }
            };

            // in the end, fill storage with test data
            Common.storageSet(testData, function () {
                // update the badge
                Common.setBadge(testData["SlediPratki.TotalNotifications"]);
            });
        });
    });
})();