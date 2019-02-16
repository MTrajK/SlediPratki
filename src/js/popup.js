var MaterializeComponents = {
    tabsInstance: undefined,
    activeInstance: undefined,
    archiveInstance: undefined,
    floatingButtonInstance: undefined,
    refreshIntervalInstance: undefined,
    addModal: {
        addModalInstance: undefined,
        trackingNumberInput: undefined,
        trackingNumberLabel: undefined,
        packageDescriptionLabel: undefined,
        addSpinner: undefined
    },
    refreshModal: {
        refreshModalInstance: undefined,
        refreshSpinner: undefined
    },
    editModal: {
        editModalInstance: undefined,
        packageDescriptionInput: undefined,
        packageDescriptionLabel: undefined
    },
    actionModalInstance: undefined,
    leftTooltipInstances: undefined,
    mainSpinner: undefined
};

new Vue({
    el: '#app',
    data: {
        addNewPackage: {
            trackingNumber: "",
            packageDescription: ""
        },
        packageState: {
            action: "",
            tab: "",
            index: -1,
            trackingNumber: "",
            packageDescription: "",
            oldPackageDescription: ""
        },
        settings: {
            autoRefresh: undefined,
            refreshInterval: undefined,
            enableNotifications: undefined,
            maxActivePackages: undefined,
            maxArchivePackages: undefined
        },
        allTrackingNumbers: [],
        activePackages: [],
        archivePackages: []
    },
    mounted: function () {
        this.$nextTick(function () {
            /* init materialize components */

            // tabs
            MaterializeComponents.tabsInstance = M.Tabs.init(this.$el.querySelector("#tabs"));
            MaterializeComponents.tabsInstance.select("activeView");

            // collapsible
            MaterializeComponents.activeInstance = M.Collapsible.init(this.$el.querySelector("#activeCollapsible"));
            MaterializeComponents.archiveInstance = M.Collapsible.init(this.$el.querySelector("#archiveCollapsible"));

            // floating button
            MaterializeComponents.floatingButtonInstance = M.FloatingActionButton.init(this.$el.querySelector("#floatingButton"));

            // settings view
            MaterializeComponents.refreshIntervalInstance = M.FormSelect.init(this.$el.querySelector("#refreshInterval"));

            // add package modal
            MaterializeComponents.addModal.addModalInstance = M.Modal.init(this.$el.querySelector("#addModal"), {
                dismissible: false
            });
            MaterializeComponents.addModal.trackingNumberInput = this.$el.querySelector("#tracking_number");
            MaterializeComponents.addModal.trackingNumberLabel = this.$el.querySelector("#tracking_number_label");
            MaterializeComponents.addModal.packageDescriptionLabel = this.$el.querySelector("#package_description_label");

            // add spinner
            MaterializeComponents.addModal.addSpinner = this.$el.querySelector("#add_spinner");

            // action package modal
            MaterializeComponents.actionModalInstance = M.Modal.init(this.$el.querySelector("#actionModal"), {
                dismissible: false
            });

            // refresh packages modal
            MaterializeComponents.refreshModal.refreshModalInstance = M.Modal.init(this.$el.querySelector("#refreshModal"), {
                dismissible: false
            });

            // refresh spinner
            MaterializeComponents.refreshModal.refreshSpinner = this.$el.querySelector("#refresh_spinner");

            // edit package modal
            MaterializeComponents.editModal.editModalInstance = M.Modal.init(this.$el.querySelector("#editModal"), {
                dismissible: false
            });
            MaterializeComponents.editModal.packageDescriptionInput = this.$el.querySelector("#edit_package_description");
            MaterializeComponents.editModal.packageDescriptionLabel = this.$el.querySelector("#edit_package_description_label");

            // main spinner
            MaterializeComponents.mainSpinner = this.$el.querySelector("#main_spinner");

            // tooltips
            MaterializeComponents.leftTooltipInstances = M.Tooltip.init(this.$el.querySelectorAll(".left-tooltip"));

            // get all data from the storage
            var thisApp = this;
            Common.getAllData(function (response) {
                // get all settings properties
                thisApp.settings.autoRefresh = response[Common.storageStrings.autoRefresh];
                thisApp.settings.refreshInterval = response[Common.storageStrings.refreshInterval];
                thisApp.settings.enableNotifications = response[Common.storageStrings.enableNotifications];
                thisApp.settings.maxActivePackages = response[Common.storageStrings.maxActivePackages];
                thisApp.settings.maxArchivePackages = response[Common.storageStrings.maxArchivePackages];

                // all packages with data
                var allTrackingNumbers = response[Common.storageStrings.trackingNumbers];

                // get all active packages
                var activeTrackingNumbers = response[Common.storageStrings.activeTrackingNumbers];
                for (var i = 0; i < activeTrackingNumbers.length; i++) {
                    var formatedPackageData = Common.formatPackageData(allTrackingNumbers[activeTrackingNumbers[i]]);
                    thisApp.activeTrackingNumbers.push(formatedPackageData);
                    thisApp.allTrackingNumbers.push(activeTrackingNumbers[i]);
                }

                // get all archived packages
                var archiveTrackingNumbers = response[Common.storageStrings.archiveTrackingNumbers];
                for (var i = 0; i < archiveTrackingNumbers.length; i++) {
                    var formatedPackageData = Common.formatPackageData(allTrackingNumbers[archiveTrackingNumbers[i]]);
                    thisApp.archiveTrackingNumbers.push(formatedPackageData);
                    thisApp.allTrackingNumbers.push(archiveTrackingNumbers[i]);
                }

                // update the refresh interval select manually
                thisApp.updateRefreshIntervalSelect();

                // remove the main spiner after loading the whole info and init all components
                // show it just little, to be noticed (looks good)
                setTimeout(function () {
                    MaterializeComponents.mainSpinner.style.display = "none";
                }, 1000);
            });
        })
    },
    watch: {
        "addNewPackage.trackingNumber": function (newValue) {
            // format the tracking number
            // should contains only upper letters and digits
            var checkValue = newValue.toUpperCase().replace(/\W/g, '');

            if (newValue !== checkValue) {
                this.addNewPackage.trackingNumber = checkValue;
            }
        },
        "settings.autoRefresh": function (newVal, oldVal) {
            if (oldVal !== undefined) {
                Common.changeAutoRefresh(newVal);
            }
        },
        "settings.refreshInterval": function (newVal, oldVal) {
            if (oldVal !== undefined) {
                Common.changeRefreshInterval(newVal);
            }
        },
        "settings.enableNotifications": function (newVal, oldVal) {
            if (oldVal !== undefined) {
                Common.changeEnableNotifications(newVal);
            }
        }
    },
    computed: {
        disableAdding: function () {
            // disable add button if the tracking number contains less than 8 chars
            // or if that tracking number exist in the active or archive collapsible
            return this.addNewPackage.trackingNumber.length < 8 ||
                this.allTrackingNumbers.indexOf(this.addNewPackage.trackingNumber) !== -1;
        },
        actionModalText: function () {
            return (this.packageState.action === "move") ? ((this.packageState.tab === "active") ? "Архивирај" : "Активирај") : "Избриши";
        },
        disableEditing: function () {
            // disable edit button if the package description is same as the old package description
            return this.packageState.packageDescription === this.packageState.oldPackageDescription;
        },
        disableNewActive: function () {
            return this.settings.maxActivePackages === this.activePackages.length;
        },
        disableNewArchive: function () {
            return this.settings.maxArchivePackages === this.archivePackages.length;
        },
        disableRefreshing: function () {
            return this.activePackages.length === 0;
        }
    },
    methods: {


        /**********************
        **   COMMON METHODS  **
        ***********************/

        updateRefreshIntervalSelect: function () {
            // update this select manually (materialize doesn't handle vue property change)
            var nOptions = MaterializeComponents.refreshIntervalInstance.$selectOptions.length;
            for (var i = 0; i < nOptions; i++) {
                if (MaterializeComponents.refreshIntervalInstance.$selectOptions[i].value == this.settings.refreshInterval) {
                    MaterializeComponents.refreshIntervalInstance.$selectOptions[i].selected = true;
                } else {
                    MaterializeComponents.refreshIntervalInstance.$selectOptions[i].selected = false;
                }
            }
            MaterializeComponents.refreshIntervalInstance._setValueToInput();
        },
        updateFromState: function () {
            if (this.packageState.action === "move") {
                this.movePackageFromState();
            } else {
                this.deletePackageFromState();
            }

            // close modal
            MaterializeComponents.actionModalInstance.close();
        },
        removeNotifications: function (index) {
            var thisApp = this;
            if (thisApp.activePackages[index].notifications > 0) {
                Common.removeNotifications(thisApp.activePackages[index].trackingNumber, function () {
                    thisApp.activePackages[index].notifications = 0;
                });
            }
        },


        /**********************
        **   DELETE PACKAGE  **
        ***********************/


        deletePackageFromState: function () {
            /*
            * TODO: DELETE FROM STORAGE
           */

            if (this.packageState.tab === "active") {
                this.deleteActivePackage();
            } else {
                this.deleteArchivePackage();
            }

            var allTrackingNumbersIndex = this.allTrackingNumbers.indexOf(this.packageState.trackingNumber);
            this.allTrackingNumbers.splice(allTrackingNumbersIndex, 1);
        },
        deleteActivePackage: function () {
            var activeIndex = this.packageState.index;
            MaterializeComponents.activeInstance.options.outDuration = 0;
            MaterializeComponents.activeInstance.close(activeIndex);
            MaterializeComponents.activeInstance.options.outDuration = 300;
            this.activePackages.splice(activeIndex, 1);
        },
        saveActiveStateDeleteModal: function (index) {
            // save which element should be deleted
            this.packageState.action = "delete";
            this.packageState.tab = "active";
            this.packageState.index = index;
            this.packageState.trackingNumber = this.activePackages[index].trackingNumber;

            // open delete modal
            MaterializeComponents.actionModalInstance.open();
        },
        deleteArchivePackage: function () {
            var archiveIndex = this.packageState.index;
            MaterializeComponents.archiveInstance.options.outDuration = 0;
            MaterializeComponents.archiveInstance.close(archiveIndex);
            MaterializeComponents.archiveInstance.options.outDuration = 300;
            this.archivePackages.splice(archiveIndex, 1);
        },
        saveArchiveStateDeleteModal: function (index) {
            // save which element should be deleted
            this.packageState.action = "delete";
            this.packageState.tab = "archive";
            this.packageState.index = index;
            this.packageState.trackingNumber = this.archivePackages[index].trackingNumber;

            // open delete modal
            MaterializeComponents.actionModalInstance.open();
        },


        /********************
        **   MOVE PACKAGE  **
        *********************/


        movePackageFromState: function () {
            /*
            * TODO: MOVE IN STORAGE
            */

            if (this.packageState.tab === "active") {
                this.moveActivePackage();
            } else {
                this.moveArchivePackage();
            }
        },
        moveActivePackage: function () {
            var activeIndex = this.packageState.index;
            this.archivePackages.push(this.activePackages[activeIndex]);
            this.deleteActivePackage();
        },
        saveActiveStateMoveModal: function (index) {
            // save which element should be moved
            this.packageState.action = "move";
            this.packageState.tab = "active";
            this.packageState.index = index;
            this.packageState.trackingNumber = this.activePackages[index].trackingNumber;

            // open delete modal
            MaterializeComponents.actionModalInstance.open();
        },
        moveArchivePackage: function () {
            var archiveIndex = this.packageState.index;
            this.activePackages.push(this.archivePackages[archiveIndex]);
            this.deleteArchivePackage();
        },
        saveArchiveStateMoveModal: function (index) {
            // save which element should be moved
            this.packageState.action = "move";
            this.packageState.tab = "archive";
            this.packageState.index = index;
            this.packageState.trackingNumber = this.archivePackages[index].trackingNumber;

            // open delete modal
            MaterializeComponents.actionModalInstance.open();
        },


        /*********************
        **  ADD NEW PACKAGE **
        **********************/


        openAddModal: function () {
            // update input fields
            this.addNewPackage.trackingNumber = "";
            this.addNewPackage.packageDescription = "";

            MaterializeComponents.addModal.trackingNumberLabel.classList.remove("active");
            MaterializeComponents.addModal.packageDescriptionLabel.classList.remove("active");

            // remove add spinner
            MaterializeComponents.addModal.addSpinner.style.display = "none";

            // open modal
            MaterializeComponents.addModal.addModalInstance.open();

            // focus on first field
            MaterializeComponents.addModal.trackingNumberInput.focus();
        },
        addNewActivePackage: function () {
            // add spinner
            MaterializeComponents.addModal.addSpinner.style.display = "block";

            /*
            * TODO: ADD IN STORAGE
            */

            var thisApp = this;

            var callback = function (response) {
                console.log(response);

                if (response === "error") {
                    // error
                }

                // add the new package
                thisApp.activePackages.push({
                    trackingNumber: thisApp.addNewPackage.trackingNumber,
                    packageDescription: thisApp.addNewPackage.packageDescription,
                    lastRefresh: Common.formatDate(new Date()),
                    status: "local_shipping",
                    notifications: 0,
                    trackingData: []
                    /*
                    // example data
                    [{
                        date: "15 Февруари 2019, 22:04:04",
                        beginning: "MKSPG",
                        end: "",
                        notice: "Пристигната во наизменична пошта"
                    }, {
                        date: "15 Февруари 2019, 22:04:04",
                        beginning: "Skopje IO 1003",
                        end: "1020",
                        notice: "Во пошта"
                    }, {
                        date: "15 Февруари 2019, 22:04:04",
                        beginning: "Skopje -20 1020",
                        end: "Dostava",
                        notice: "Испорачана"
                    }]
                    */
                });

                // push this tracking number in the list with all tracking numbers
                thisApp.allTrackingNumbers.push(thisApp.addNewPackage.trackingNumber);

                // open the last added package
                var latestPackage = thisApp.activePackages.length - 1;
                MaterializeComponents.addModal.addModalInstance.options.onCloseEnd = function () {
                    MaterializeComponents.activeInstance.open(latestPackage);
                };

                // close modal after getting the results from the api and writting them in storage
                MaterializeComponents.addModal.addModalInstance.close();
            };

            callback("error");
            //   Common.getPackage(this.addNewPackage.trackingNumber, end, end);
        },


        /**********************
        **  REFRESH PACKAGE  **
        ***********************/


        openRefreshModal: function () {
            // remove refresh spinner
            MaterializeComponents.refreshModal.refreshSpinner.style.display = "none";

            // open modal
            MaterializeComponents.refreshModal.refreshModalInstance.open();
        },
        refreshPackages: function () {
            // add refresh spinner
            MaterializeComponents.refreshModal.refreshSpinner.style.display = "block";

            // close the active collapsibles
            for (var i = 0; i < this.activePackages.length; i++) {
                MaterializeComponents.activeInstance.close(i);
            }

            /*
            * TODO: REFRESH IN STORAGE
            */

            // close modal after 3 seconds
            setTimeout(function () {
                MaterializeComponents.refreshModal.refreshModalInstance.close();
            }, 3000);
        },


        /********************
        **   EDIT PACKAGE  **
        *********************/


        editPackageFromState: function () {
            /*
            * TODO: EDIT IN STORAGE
            */

            if (this.packageState.tab === "active") {
                this.editActivePackage();
            } else {
                this.editArchivePackage();
            }

            // close modal
            MaterializeComponents.editModal.editModalInstance.close();
        },
        editActivePackage: function () {
            this.activePackages[this.packageState.index].packageDescription = this.packageState.packageDescription;
        },
        saveActiveStateEditModal: function (index) {
            // save which element should be edited
            this.packageState.action = "edit";
            this.packageState.tab = "active";
            this.packageState.index = index;
            this.packageState.trackingNumber = this.activePackages[index].trackingNumber;
            this.packageState.packageDescription = this.activePackages[index].packageDescription;
            this.packageState.oldPackageDescription = this.activePackages[index].packageDescription;

            this.updateFocusAndOpenEditModal();
        },
        editArchivePackage: function () {
            this.archivePackages[this.packageState.index].packageDescription = this.packageState.packageDescription;
        },
        saveArchiveStateEditModal: function (index) {
            // save which element should be edited
            this.packageState.action = "edit";
            this.packageState.tab = "archive";
            this.packageState.index = index;
            this.packageState.trackingNumber = this.archivePackages[index].trackingNumber;
            this.packageState.packageDescription = this.archivePackages[index].packageDescription;
            this.packageState.oldPackageDescription = this.archivePackages[index].packageDescription;

            this.updateFocusAndOpenEditModal();
        },
        updateFocusAndOpenEditModal: function () {
            // update input field label
            MaterializeComponents.editModal.packageDescriptionLabel.classList.remove("active");
            if (this.packageState.packageDescription.length > 0) {
                MaterializeComponents.editModal.packageDescriptionLabel.classList.add("active");
            }

            // open delete modal
            MaterializeComponents.editModal.editModalInstance.open();

            // focus the input field
            MaterializeComponents.editModal.packageDescriptionInput.focus();
        }
    }
});