var app = new Vue({
    el: '#app',
    data: {
        tabsInstance: undefined,
        activeInstance: undefined,
        archiveInstance: undefined,
        floatingButtonInstance: undefined,
        addModalInstance: undefined,
        trackingNumber: "",
        packageDescription: "",
        activePackages: [],
        archivePackages: []
    },
    mounted: function () {
        this.$nextTick(function () { // init materialize components
            // tabs
            this.tabsInstance = M.Tabs.init(this.$el.querySelector("#tabs"));
            this.tabsInstance.select("activeView");
            // collapsible
            this.activeInstance = M.Collapsible.init(this.$el.querySelector("#activeCollapsible"));
            this.archiveInstance = M.Collapsible.init(this.$el.querySelector("#archiveCollapsible"));
            // floating button
            this.floatingButtonInstance = M.FloatingActionButton.init(this.$el.querySelector("#floatingButton"));
            // add package modal instance
            this.addModalInstance = M.Modal.init(this.$el.querySelector("#addModal"));
        })
    },
    methods: {
        deleteActivePackage: function (index) {
            this.activeInstance.options.outDuration = 0;
            this.activeInstance.close(index);
            this.activeInstance.options.outDuration = 300;
            this.activePackages.splice(index, 1);
        },
        deleteArchivePackage: function (index) {
            this.archiveInstance.options.outDuration = 0;
            this.archiveInstance.close(index);
            this.archiveInstance.options.outDuration = 300;
            this.archivePackages.splice(index, 1);
        },
        addNewActivePackage: function () {
            this.activePackages.push({
                trackingNumber: this.trackingNumber,
                packageDescription: this.packageDescription,
                status: "local_shipping",
                notifications: 3
            });

            this.trackingNumber = "";
            this.packageDescription = "";
            
            // update input field
            this.$el.querySelector("#tracking_number").classList.remove("valid");
            this.$el.querySelector("#tracking_number").classList.remove("invalid");
            this.$el.querySelector("#tracking_number_label").classList.remove("active");

            this.$el.querySelector("#package_description").classList.remove("valid");
            this.$el.querySelector("#package_description").classList.remove("invalid");
            this.$el.querySelector("#package_description_label").classList.remove("active");
        },
        archiveActivePackage: function (index) {
            this.archivePackages.push(this.activePackages[index]);
            this.deleteActivePackage(index);
        },
        activeArchivePackage: function (index) {
            this.activePackages.push(this.archivePackages[index]);
            this.deleteArchivePackage(index);
        }
    }
});