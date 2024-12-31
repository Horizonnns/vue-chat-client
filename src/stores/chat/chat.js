import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', {
	state: () => {
		return {
			contactList: JSON.parse(localStorage.getItem('contactList')) || [],
			selectedContact:
				JSON.parse(localStorage.getItem('selectedContact')) || null,
		};
	},
	actions: {
		setContactList(contacts) {
			if (Array.isArray(contacts)) {
				// Обрабатываем массив контактов
				contacts.forEach((contact) => {
					if (!this.contactList.find((c) => c.id === contact.id)) {
						this.contactList.push(contact);
					}
				});
			} else {
				// Обрабатываем одиночный контакт
				if (!this.contactList.find((c) => c.id === contacts.id)) {
					this.contactList.push(contacts);
				}
			}

			// Сохраняем обновленный список контактов в localStorage
			localStorage.setItem('contactList', JSON.stringify(this.contactList));
		},

		setSelectedContact(contact) {
			this.selectedContact = contact;
			localStorage.setItem('selectedContact', JSON.stringify(contact));
		},
	},
	getters: {
		getContactList() {
			return this.contactList;
		},

		getSelectedContact() {
			return this.selectedContact;
		},
	},
});
