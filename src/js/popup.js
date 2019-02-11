MaterializeComponents = {
    tabsInstance: undefined,
    activeInstance: undefined,
    archiveInstance: undefined,
    floatingButtonInstance: undefined,
    refreshIntervalInstance: undefined,
    addModal: {
        addModalInstance: undefined,
        trackingNumberInput: undefined,
        trackingNumberLabel: undefined,
        packageDescriptionInput: undefined,
        packageDescriptionLabel: undefined
    },
    deletePackage: undefined,
    movePackage: undefined
};

var vueApp = new Vue({
    el: '#app',
    data: {
        addNewPackage: {
            trackingNumber: "",
            packageDescription: "",
        },
        deletePackageState: {
            index: -1,
            trackingNumber: "",
            tab: ""
        },
        movePackageState: {
            index: -1,
            trackingNumber: "",
            tab: ""
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
            MaterializeComponents.addModal.packageDescriptionInput = this.$el.querySelector("#package_description");
            MaterializeComponents.addModal.packageDescriptionLabel = this.$el.querySelector("#package_description_label");

            // delete package modal
            MaterializeComponents.deletePackage = M.Modal.init(this.$el.querySelector("#deleteModal"), {
                dismissible: false
            });

            // move package modal
            MaterializeComponents.movePackage = M.Modal.init(this.$el.querySelector("#moveModal"), {
                dismissible: false
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
        }
    },
    computed: {
        disableAdding: function () {
            // disable add button if the tracking number contains less than 8 chars
            return this.addNewPackage.trackingNumber.length < 8;
        },
        movePackageText: function () {
            return (this.movePackageState.tab == "active") ? "Архивирај" : "Активирај";
        }
    },
    methods: {

        
        /**********************
        **   DELETE PACKAGE  **
        ***********************/


        deletePackageFromState: function () {
            if (this.deletePackageState.tab === "active") {
                this.deleteActivePackage(this.deletePackageState.index);
            } else {
                this.deleteArchivePackage(this.deletePackageState.index);
            }

            // close modal
            MaterializeComponents.deletePackage.close();
        },
        deleteActivePackage: function (index) {
            MaterializeComponents.activeInstance.options.outDuration = 0;
            MaterializeComponents.activeInstance.close(index);
            MaterializeComponents.activeInstance.options.outDuration = 300;
            this.activePackages.splice(index, 1);
        },
        saveActiveStateDeleteModal: function (index) {
            // save which element should be deleted
            this.deletePackageState.index = index;
            this.deletePackageState.trackingNumber = this.activePackages[index].trackingNumber;
            this.deletePackageState.tab = "active";

            // open delete modal
            MaterializeComponents.deletePackage.open();
        },
        deleteArchivePackage: function (index) {
            MaterializeComponents.archiveInstance.options.outDuration = 0;
            MaterializeComponents.archiveInstance.close(index);
            MaterializeComponents.archiveInstance.options.outDuration = 300;
            this.archivePackages.splice(index, 1);
        },
        saveArchiveStateDeleteModal: function (index) {
            // save which element should be deleted
            this.deletePackageState.index = index;
            this.deletePackageState.trackingNumber = this.archivePackages[index].trackingNumber;
            this.deletePackageState.tab = "archive";

            // open delete modal
            MaterializeComponents.deletePackage.open();
        },


        /********************
        **   MOVE PACKAGE  **
        *********************/


        moveFromState: function () {
            console.log(this.movePackageState.index);
            if (this.movePackageState.tab === "active") {
                this.moveActivePackage(this.movePackageState.index);
            } else {
                this.moveArchivePackage(this.movePackageState.index);
            }

            // close modal
            MaterializeComponents.movePackage.close();
        },
        moveActivePackage: function (index) {
            this.archivePackages.push(this.activePackages[index]);
            this.deleteActivePackage(index);
        },
        saveActiveStateMoveModal: function (index) {
            // save which element should be deleted
            this.movePackageState.index = index;
            this.movePackageState.trackingNumber = this.activePackages[index].trackingNumber;
            this.movePackageState.tab = "active";

            // open delete modal
            MaterializeComponents.movePackage.open();
        },
        moveArchivePackage: function (index) {
            this.activePackages.push(this.archivePackages[index]);
            this.deleteArchivePackage(index);
        },
        saveArchiveStateMoveModal: function (index) {
            // save which element should be deleted
            this.movePackageState.index = index;
            this.movePackageState.trackingNumber = this.archivePackages[index].trackingNumber;
            this.movePackageState.tab = "archive";

            // open delete modal
            MaterializeComponents.movePackage.open();
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
            this.activePackages.push({
                trackingNumber: this.addNewPackage.trackingNumber,
                packageDescription: this.addNewPackage.packageDescription,
                status: "local_shipping",
                notifications: 3,
                lastRefresh: Common.getDateTime()
            });

            // close modal
            MaterializeComponents.addModal.addModalInstance.close();
        }
    }
});