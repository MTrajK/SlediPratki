var app = new Vue({
    el: '#app',
    data: {
        tabsInstance: undefined,
        activeInstance: undefined,
        archiveInstance: undefined,
        floatingButtonInstance: undefined,
        message: "Add something",
        activePackages: [],
        archivePackages: []
    },
    mounted: function () {
        this.$nextTick(function () {
            // init materialize components
            // tabs
            this.tabsInstance = M.Tabs.init(this.$el.querySelector("#tabs"));
            this.tabsInstance.select("activeView");
            // collapsible
            this.activeInstance = M.Collapsible.init(this.$el.querySelector("#activeCollapsible"));
            this.archiveInstance = M.Collapsible.init(this.$el.querySelector("#archiveCollapsible"));
            // floating button
            this.floatingButtonInstance = M.FloatingActionButton.init(this.$el.querySelector("#floatingButton"));
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
                header: this.message,
                body: "asad"
            });
            this.message = "";
        },
        archiveActivePackage: function (index) {
            this.archivePackages.push({
                header: this.activePackages[index].header,
                body: this.activePackages[index].body
            });
            this.deleteActivePackage(index);
        },
        activeArchivePackage: function (index) {
            this.activePackages.push({
                header: this.archivePackages[index].header,
                body: this.archivePackages[index].body
            });
            this.deleteArchivePackage(index);
        }
    }
});