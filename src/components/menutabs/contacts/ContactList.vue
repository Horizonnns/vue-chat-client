<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SeacrhModal from './SeacrhModal.vue';
import axios from 'axios';
import io from 'socket.io-client';
import IconAddContacts from '../../icons/IconAddContacts.vue';
import { useAuthStore } from '../../../stores/auth/auth';
import { useChatStore } from '../../../stores/chat/chat';
import { capitalizeFirstLetter } from '../../../utils/capitalizeFirstLetter';
import { getColorForContact } from '../../../utils/colorGenerator';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const token = authStore.getToken;
const userId = authStore.getUserId;

const contactList = computed(() => chatStore.getContactList);
const selectedContact = ref(null);

const socket = io('http://localhost:3000', {
	query: { userId },
});

const openChat = (contact) => {
	selectedContact.value = contact;
	chatStore.setSelectedContact(contact);

	router.push({
		name: 'Chat',
		params: { contactId: contact.id },
	});

	// Уведомляем сервер о начале чата с выбранным контактом
	socket.emit('joinChat', { userId, contactId: contact.id });
};

// Загрузка контактов при монтировании
const loadContacts = async () => {
	try {
		const response = await axios.get(
			`http://localhost:3000/contacts/${userId}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (response.data.length > 0) {
			chatStore.setContactList(response.data);
		}
	} catch (err) {
		console.error('Ошибка загрузки контактов:', err);
	}
};

// Загрузка сообщений для выбранного контакта
const loadMessages = async (contact) => {
	try {
		await axios.get(`http://localhost:3000/messages`, {
			params: { userId: userId, contactId: contact.id },
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	} catch (err) {
		console.error('Ошибка загрузки сообщений:', err);
	}
};

onMounted(() => {
	loadContacts();
});

watch(selectedContact, (newContact) => {
	if (newContact) loadMessages(newContact);
});

const isOpen = ref(false);
const openModal = () => {
	isOpen.value = true;
};

const closeModal = () => {
	isOpen.value = false;
	console.log('closeModal --> isOpen: ', isOpen.value);
};
</script>

<template>
	<section class="bg-gray-50 dark:bg-black/20 dark:text-white select-none">
		<!-- header -->
		<div
			class="mx-3 py-4 flex justify-between items-center border-b dark:border-none"
		>
			<div></div>

			<h2 class="font-medium active:scale-95 duration-150">Контакты</h2>

			<button
				@click="openModal"
				class="focus-within:outline-none outline-none active:scale-90 duration-150"
			>
				<IconAddContacts class="w-6 h-6 text-blue-10" />
			</button>

			<SeacrhModal :isOpen="isOpen" @close-modal="closeModal" />
		</div>

		<!-- contacts -->
		<ul
			class="divide-y dark:divide-gray-20 dark:bg-black/80 overflow-y-auto h-[83vh]"
		>
			<li
				v-for="contact in contactList"
				:key="contact.id"
				@click="openChat(contact)"
				:class="['', selectedContact?.id === contact.id ? 'font-bold' : '']"
			>
				<div
					class="px-3 w-full flex items-center space-x-2.5 hover:bg-gray-100 active:bg-gray-200 hover:dark:bg-white/5 active:dark:bg-black duration-150"
				>
					<p
						:class="getColorForContact(contact.name)"
						class="font-semibold rounded-full p-2 text-white w-10 h-10 flex items-center justify-center my-2.5"
					>
						{{ capitalizeFirstLetter(contact.name)[0] }}
					</p>

					<div class="text-sm">
						<p class="font-semibold">
							{{ capitalizeFirstLetter(contact.name) }}
						</p>
						<p>{{ contact.phone }}</p>
					</div>
				</div>
			</li>
		</ul>
	</section>
</template>

<style scoped>
.me {
	text-align: right;
}
</style>
