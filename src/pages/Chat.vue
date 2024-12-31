<script setup>
import { useAuthStore } from '../stores/auth/auth';
import { useChatStore } from '../stores/chat/chat';
import { getColorForContact } from '../utils/colorGenerator';
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { capitalizeFirstLetter } from '../utils/capitalizeFirstLetter';
import axios from 'axios';
import io from 'socket.io-client';
import router from '../router/router';
import IconDots from '../components/icons/IconDots.vue';
import IconSend from '../components/icons/IconSend.vue';
import IconAttach from '../components/icons/IconAttach.vue';
import IconUpload from '../components/icons/IconUpload.vue';
import IconMicrophone from '../components/icons/IconMicrophone.vue';
import IconArrowDown from '../components/icons/IconArrowDown.vue';
import IconArrowBack from '../components/icons/IconArrowBack.vue';
import IconPhoneOutline from '../components/icons/IconPhoneOutline.vue';

const authStore = useAuthStore();
const chatStore = useChatStore();

const token = computed(() => authStore.getToken);
const userId = computed(() => authStore.getUserId);
const selectedContact = computed(() => chatStore.getSelectedContact);

const socket = ref(null);
const messages = ref([]);
const newMessage = ref('');
const chatContainer = ref(null); // Ссылка на контейнер чата
const showScrollButton = ref(false); // Состояние для отображения кнопки

const scrollToBottom = (smooth = true) => {
	if (chatContainer.value) {
		chatContainer.value.scrollTo({
			top: chatContainer.value.scrollHeight,
			behavior: smooth ? 'smooth' : 'auto', // Опционально включаем плавность
		});
	}
};

const handleScroll = () => {
	if (chatContainer.value) {
		// Проверяем, прокручен ли пользователь вверх
		const isScrolledUp =
			chatContainer.value.scrollTop + chatContainer.value.clientHeight <
			chatContainer.value.scrollHeight - 100; // 100px от нижней границы
		showScrollButton.value = isScrolledUp;
	}
};

const loadMessages = async (contact) => {
	try {
		const response = await axios.get(`http://localhost:3000/messages`, {
			params: { userId: userId.value, contactId: contact.id },
			headers: { Authorization: `Bearer ${token.value}` },
		});
		messages.value = response.data;

		await nextTick(); // Ждем отрисовки сообщений
		scrollToBottom(false); // Скроллим вниз без плавности
	} catch (err) {
		console.error('Ошибка загрузки сообщений:', err);
	}
};

const sendMessage = async () => {
	if (newMessage.value.trim()) {
		const message = {
			senderId: userId.value,
			receiverId: selectedContact.value.id,
			content: newMessage.value.trim(),
			timestamp: new Date().toISOString(),
		};

		socket.value.emit('send message', message);
		messages.value.push(message); // Отображаем сообщение сразу
		newMessage.value = '';

		await nextTick(); // Ждем отрисовки нового сообщения
		scrollToBottom(); // Скроллим вниз
	}
};

const formatTimestamp = (timestamp) => {
	const date = new Date(timestamp);
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const back = () => {
	router.back();
};

onMounted(() => {
	loadMessages(selectedContact.value);
	updateContactStatus(); // Обновляем статус контакта
	statusInterval = setInterval(updateContactStatus, 5000); // Каждые 30 секунд

	// Устанавливаем соединение
	socket.value = io('http://localhost:3000', {
		query: { userId: userId.value },
	});

	// Получаем входящие сообщения
	socket.value.on('receive message', async (message) => {
		messages.value.push(message);

		await nextTick(); // Ждем отрисовки нового сообщения
		scrollToBottom(); // Скроллим вниз
	});

	// Добавляем обработчик прокрутки
	if (chatContainer.value) {
		chatContainer.value.addEventListener('scroll', handleScroll);
	}
});

onUnmounted(() => {
	if (socket.value) socket.value.disconnect();

	// Удаляем обработчик прокрутки
	if (chatContainer.value) {
		chatContainer.value.removeEventListener('scroll', handleScroll);
	}

	// Очищаем интервал
	if (statusInterval) clearInterval(statusInterval);
});

watch(selectedContact, () => {
	loadMessages(selectedContact.value);
	updateContactStatus(); // Обновляем статус при смене контакта
});

let statusInterval = null;
const contactStatus = ref({ isOnline: false, lastSeen: null });

const updateContactStatus = async () => {
	try {
		const response = await axios.get(
			`http://localhost:3000/status/${selectedContact.value.id}`,
			{
				headers: { Authorization: `Bearer ${token.value}` },
			}
		);
		contactStatus.value = response.data;
	} catch (err) {
		console.error('Ошибка получения статуса контакта:', err);
	}
};
</script>

<template>
	<section
		class="relative bg-gray-50 dark:bg-black/20 w-full h-full flex flex-col justify-between"
	>
		<!-- header -->
		<div
			class="select-none flex items-center justify-between border-b dark:border-none px-3 py-2"
		>
			<div class="flex items-center space-x-2">
				<button
					@click="back"
					class="focus-within:outline-none outline-none active:scale-95 duration-150"
				>
					<IconArrowBack
						class="w-6 h-6 dark:text-white hover:opacity-60 duration-150"
					/>
				</button>

				<div class="flex items-center space-x-2.5">
					<p
						:class="getColorForContact(selectedContact.name)"
						class="font-semibold rounded-full p-2 text-white w-10 h-10 flex items-center justify-center"
					>
						{{ capitalizeFirstLetter(selectedContact.name)[0] }}
					</p>

					<div class="flex flex-col items-start">
						<h2 class="dark:text-white text-black text-center font-medium">
							{{ selectedContact.name }}
						</h2>

						<div>
							<p class="text-xs text-gray-500">
								<template v-if="contactStatus.isOnline">в сети</template>
								<template v-else-if="contactStatus.lastSeen">
									был(а) в
									{{
										new Date(contactStatus.lastSeen).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
										})
									}}
								</template>
								<template v-else>нет данных</template>
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="flex items-center space-x-3">
				<button
					class="w-6 h-6 dark:text-white focus-within:outline-none outline-none active:scale-90 duration-150"
				>
					<IconPhoneOutline />
				</button>

				<button
					class="w-8 h-8 dark:text-white focus-within:outline-none outline-none active:scale-90 duration-150"
				>
					<IconDots />
				</button>
			</div>
		</div>

		<!-- Chat -->
		<div
			ref="chatContainer"
			class="h-full dark:bg-black/80 flex flex-col space-y-2 overflow-y-scroll px-3 pt-4 pb-2"
		>
			<div
				v-for="message in messages"
				:key="message.timestamp"
				:class="[
					'break-words max-w-xs rounded-lg text-sm px-2 py-1 flex space-x-2',
					message.senderId !== selectedContact.id &&
					message.receiverId === selectedContact.id
						? 'bg-green-200 dark:bg-green-600 self-end message-sent'
						: 'bg-gray-200 dark:bg-gray-600 self-start message-received',
				]"
			>
				<div class="flex items-end space-x-1 leading-4">
					<p>{{ message.content }}</p>

					<p class="text-[10px] font-medium text-gray-500 opacity-0">
						{{ formatTimestamp(message.timestamp) }}
					</p>

					<p
						class="absolute text-[10px] right-1 bottom-px font-medium text-gray-500"
					>
						{{ formatTimestamp(message.timestamp) }}
					</p>
				</div>
			</div>
		</div>

		<!-- Message entry field -->
		<div
			class="border-t dark:border-none bottom-0 flex items-center justify-between space-x-2 p-2 mb-7 z-10"
		>
			<button
				class="focus-within:outline-none outline-none active:scale-90 duration-150 w-6 h-6 dark:text-gray-500"
			>
				<IconAttach />
			</button>

			<!-- Message input -->
			<div class="flex-1 relative">
				<input
					v-model="newMessage"
					type="text"
					placeholder="Сообщение"
					class="w-full px-3 py-1.5 rounded-full outline-none dark:bg-black dark:placeholder:text-gray-500 tracking-wide text-sm"
					@keyup.enter="sendMessage"
				/>

				<button
					v-show="newMessage.length > 0"
					class="absolute top-0.5 right-0.5 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 duration-150 text-white outline-none focus:outline-none rounded-full w-7 h-7 p-1.5"
					@click="sendMessage"
				>
					<IconSend />
				</button>
			</div>

			<button
				class="focus-within:outline-none outline-none active:scale-90 duration-150 w-6 h-6 dark:text-gray-500"
			>
				<IconMicrophone />
			</button>
		</div>

		<!-- Кнопка прокрутки вниз -->
		<button v-if="showScrollButton" @click="scrollToBottom">
			<IconArrowDown
				class="w-8 h-8 p-1 absolute bottom-24 right-2 hover:opacity-60 bg-gray-50 dark:bg-black/80 dark:text-white text-gray-500 duration-150 rounded-full shadow-lg focus-within:outline-none outline-none z-10"
			/>
		</button>
	</section>
</template>

<style scoped>
.message-sent {
	position: relative;
	background-color: #d1fae5; /* Светло-зеленый */
	color: #065f46; /* Темно-зеленый текст */
}

.message-received {
	position: relative;
	background-color: #e5e7eb; /* Светло-серый */
	color: #111827; /* Темный текст */
}

/* Стрелка для отправленных сообщений */
.message-sent::after {
	content: '';
	position: absolute;
	right: -2px;
	bottom: 0;
	width: 0;
	height: 0;
	border-width: 5px;
	border-style: solid;
	border-color: transparent transparent #d1fae5 transparent;
}

/* Стрелка для полученных сообщений */
.message-received::after {
	transform: rotate(90deg);
	content: '';
	position: absolute;
	left: -2px;
	bottom: 0;
	width: 0;
	height: 0;
	border-width: 5px;
	border-style: solid;
	border-color: transparent #e5e7eb transparent transparent;
}
</style>
