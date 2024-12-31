import { defineStore } from 'pinia';

export const useMenuTabsStore = defineStore('menutabs', {
	state: () => {
		return { selectedTab: 0 };
	},
	actions: {
		changeTab(index) {
			this.selectedTab = index;
		},
	},
	getters: {
		getSelectedTab() {
			return this.selectedTab;
		},
	},
});
