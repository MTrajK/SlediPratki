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
        packageDescriptionLabel: undefined
    },
    editModal: {
        editModalInstance: undefined,
        packageDescriptionInput: undefined,
        packageDescriptionLabel: undefined
    },
    actionModalInstance: undefined
};

var vueApp = new Vue({
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
            MaxActivePackages: 20,
            MaxArchivePackages: 15
        },
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

            // action package modal
            MaterializeComponents.actionModalInstance = M.Modal.init(this.$el.querySelector("#actionModal"), {
                dismissible: false
            });

            // edit package modal
            MaterializeComponents.editModal.editModalInstance = M.Modal.init(this.$el.querySelector("#editModal"), {
                dismissible: false
            });
            MaterializeComponents.editModal.packageDescriptionInput = this.$el.querySelector("#edit_package_description");
            MaterializeComponents.editModal.packageDescriptionLabel = this.$el.querySelector("#edit_package_description_label");
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
        }
    },
    computed: {
        disableAdding: function () {
            // disable add button if the tracking number contains less than 8 chars
            return this.addNewPackage.trackingNumber.length < 8;
        },
        actionModalText: function () {
            return (this.packageState.action === "move") ? ((this.packageState.tab === "active") ? "Архивирај" : "Активирај") : "Избриши";
        },
        disableEditing: function () {
            // disable edit button if the package description is same as the old package description
            return this.packageState.packageDescription === this.packageState.oldPackageDescription;
        },
        disableNewActive: function () { 
            return this.settings.MaxActivePackages === this.activePackages.length;
        },
        disableNewArchive: function () {
            return this.settings.MaxArchivePackages === this.archivePackages.length; 
        },
        disableRefreshing: function () {
            return this.activePackages.length === 0;
        }
    },
    methods: {


        /**********************
        **   COMMON METHODS  **
        ***********************/

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
            this.activePackages[index].notifications = 0;
        },


        /**********************
        **   DELETE PACKAGE  **
        ***********************/


        deletePackageFromState: function () {
            if (this.packageState.tab === "active") {
                this.deleteActivePackage(this.packageState.index);
            } else {
                this.deleteArchivePackage(this.packageState.index);
            }
        },
        deleteActivePackage: function (index) {
            MaterializeComponents.activeInstance.options.outDuration = 0;
            MaterializeComponents.activeInstance.close(index);
            MaterializeComponents.activeInstance.options.outDuration = 300;
            this.activePackages.splice(index, 1);
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
        deleteArchivePackage: function (index) {
            MaterializeComponents.archiveInstance.options.outDuration = 0;
            MaterializeComponents.archiveInstance.close(index);
            MaterializeComponents.archiveInstance.options.outDuration = 300;
            this.archivePackages.splice(index, 1);
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
            if (this.packageState.tab === "active") {
                this.moveActivePackage(this.packageState.index);
            } else {
                this.moveArchivePackage(this.packageState.index);
            }
        },
        moveActivePackage: function (index) {
            this.archivePackages.push(this.activePackages[index]);
            this.deleteActivePackage(index);
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
        moveArchivePackage: function (index) {
            this.activePackages.push(this.archivePackages[index]);
            this.deleteArchivePackage(index);
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

            // open modal
            MaterializeComponents.addModal.addModalInstance.open();

            // focus on first field
            MaterializeComponents.addModal.trackingNumberInput.focus();
        },
        addNewActivePackage: function () {
            // add the new package
            this.activePackages.push({
                trackingNumber: this.addNewPackage.trackingNumber,
                packageDescription: this.addNewPackage.packageDescription,
                status: "local_shipping",
                notifications: 3,
                lastRefresh: Common.getDateTime()
            });

            var latestPackage = this.activePackages.length - 1;
            MaterializeComponents.addModal.addModalInstance.options.onCloseEnd = function () {
                // open the latest package
                MaterializeComponents.activeInstance.open(latestPackage);
            };

            // close modal
            MaterializeComponents.addModal.addModalInstance.close();
        },


        /********************
        **   EDIT PACKAGE  **
        *********************/


        editPackageFromState: function () {
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