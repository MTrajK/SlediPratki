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
    }
};

var vueApp = new Vue({
    el: '#app',
    data: {
        addNewPackage: {
            trackingNumber: "",
            packageDescription: "",
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
        })
    },
    methods: {
        deleteActivePackage: function (index) {
            MaterializeComponents.activeInstance.options.outDuration = 0;
            MaterializeComponents.activeInstance.close(index);
            MaterializeComponents.activeInstance.options.outDuration = 300;
            this.activePackages.splice(index, 1);
        },
        deleteArchivePackage: function (index) {
            MaterializeComponents.archiveInstance.options.outDuration = 0;
            MaterializeComponents.archiveInstance.close(index);
            MaterializeComponents.archiveInstance.options.outDuration = 300;
            this.archivePackages.splice(index, 1);
        },
        archiveActivePackage: function (index) {
            this.archivePackages.push(this.activePackages[index]);
            this.deleteActivePackage(index);
        },
        activeArchivePackage: function (index) {
            this.activePackages.push(this.archivePackages[index]);
            this.deleteArchivePackage(index);
        },
        openAddModal: function () {
            // update input fields
            this.addNewPackage.trackingNumber = "";
            this.addNewPackage.packageDescription = "";

            MaterializeComponents.addModal.trackingNumberInput.classList.remove("valid");
            MaterializeComponents.addModal.trackingNumberInput.classList.remove("invalid");
            MaterializeComponents.addModal.trackingNumberLabel.classList.remove("active");

            MaterializeComponents.addModal.packageDescriptionInput.classList.remove("valid");
            MaterializeComponents.addModal.packageDescriptionInput.classList.remove("invalid");
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
                notifications: 3
            });

            // close modal
            MaterializeComponents.addModal.addModalInstance.close();
        }
    }
});