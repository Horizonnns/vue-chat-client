<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import socket from '../../socket';
import FileUpload from './FileUpload.vue';
import IconSend from './icons/IconSend.vue';
import IconDots from './icons/IconDots.vue';
import IconUpload from './icons/IconUpload.vue';
import IconLeave from './icons/IconLeave.vue';

const messages = ref([]);
const newMessage = ref('');
const userName = ref('');
const password = ref('');
const chatPassword = ref('');
const isInChat = ref(false);
const typingUser = ref(null); // Имя пользователя, который печатает
const typingTimeout = ref(null);
// let typingTimeout = null;
const connectedUser = ref(null);
const action = ref(null); // null, "create", "join"
const chatCreator = ref(null); // Имя создателя комнаты
const userStatuses = ref({});
const isModalOpen = ref(false); // Состояние модального окна
const timeoutId = ref(null); // Состояние модального окна


// Создать комнату
const createRoom = () => {
	if (!userName.value.trim() || password.value.length !== 6) {
		alert('Введите имя и пароль (6 символов).');
		return;
	}

	socket.emit(
		'create_room',
		{ userName: userName.value, password: password.value },
		(response) => {
			if (response.success) {
				isInChat.value = true;
				action.value = null;
				chatCreator.value = userName.value; // Сохраняем себя как создателя
				messages.value = [];
			} else {
				alert(response.message);
			}
		}
	);
};

</script>

<template>
	<div class="chat-container bg-gray-100 p-4 rounded shadow">
		<!-- Список сообщений -->
		<div class="messages h-64 overflow-y-scroll mb-4">
			<div
				v-for="message in messages"
				:key="message.id"
				:class="[
					'break-words max-w-xs rounded-lg my-1 px-2 py-1 ',
					message.sender === userName
						? 'bg-green-200 self-end'
						: 'bg-gray-200 self-start',
				]"
			>
				{{ message.text }}
			</div>
		</div>

		<!-- Показать, кто печатает -->
		<div v-if="typingUser" class="typing-indicator text-sm text-gray-500 mb-2">
			{{ typingUser }} печатает...
		</div>

		<!-- Поле ввода сообщения -->
		<input
			v-model="newMessage"
			type="text"
			placeholder="Введите сообщение..."
			class="w-full p-2 border rounded mb-2"
			@keyup.enter="sendMessage"
			@input="notifyTyping"
		/>
		<FileUpload @fileSent="sendFile" />
		<button
			class="btn bg-blue-500 text-white px-4 py-2 rounded"
			@click="sendMessage"
		>
			Отправить
		</button>
	</div>
</template>

<script>
import socket from '../../socket';
import FileUpload from './FileUpload.vue';

export default {
	components: { FileUpload },
	data() {
		return {
			messages: [], // Список сообщений
			newMessage: '', // Текст нового сообщения
			userName: '', // Имя текущего пользователя
			typingUser: null, // Имя пользователя, который печатает
		};
	},
	created() {
		// Устанавливаем имя пользователя при подключении
		this.userName = prompt('Введите ваше имя') || 'Гость';

		// Слушаем новые сообщения от сервера
		socket.on('new_message', (message) => {
			this.messages.push(message);
		});

		// Слушаем уведомление о том, кто печатает
		socket.on('typing', (user) => {
			console.log('user: ', user);

			if (user !== this.userName) {
				this.typingUser = user;
				// Таймер для скрытия статуса через 2 секунды после прекращения набора
				clearTimeout(this.typingTimeout);
				this.typingTimeout = setTimeout(() => {
					this.typingUser = null;
				}, 2000);
			}
		});

		// Сообщаем серверу имя пользователя
		socket.emit('join', { userName: this.userName });
	},
	methods: {
		// Отправка нового сообщения
		sendMessage() {
			if (this.newMessage.trim()) {
				const message = {
					sender: this.userName,
					text: this.newMessage,
				};
				socket.emit('send_message', message); // Отправляем на сервер
				this.newMessage = ''; // Очищаем поле ввода
				this.typingUser = null; // Скрываем статус печати после отправки
			}
		},
		// Уведомление о том, что пользователь печатает
		notifyTyping() {
			socket.emit('typing', this.userName); // Отправляем на сервер, что пользователь печатает
		},
		sendFile(file) {
			const reader = new FileReader();
			reader.onload = () => {
				const data = {
					sender: this.userName,
					file: reader.result,
					fileName: file.name,
				};
				socket.emit('send_file', data);
			};
			reader.readAsDataURL(file);
		},
	},
};
</script>

<style scoped>
.chat-container {
	max-width: 600px;
	margin: 0 auto;
}

.user-name {
	color: #1d4ed8; /* Синий для имени пользователя */
	padding: 10px;
	background-color: #e0f2fe; /* Светло-голубой фон */
	border-radius: 8px;
	margin-bottom: 10px;
	text-align: center;
	font-weight: bold;
}

.messages {
	display: flex;
	flex-direction: column;
}

.typing-indicator {
	font-style: italic;
	color: #aaa;
}
</style>
