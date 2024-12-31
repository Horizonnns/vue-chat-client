import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
	state: () => {
		return {
			token: localStorage.getItem('token') || null,
			userId: localStorage.getItem('userId') || null,
		};
	},
	actions: {
		setToken(token) {
			this.token = token;
			localStorage.setItem('token', token);
		},
		setUserId(userId) {
			this.userId = userId;
			localStorage.setItem('userId', userId);
		},
	},
	getters: {
		getToken() {
			return this.token;
		},
		getUserId() {
			return this.userId;
		},
	},
});
