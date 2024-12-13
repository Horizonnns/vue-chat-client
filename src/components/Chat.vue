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

// Открываем модальное окно
const toggleModal = () => {
	isModalOpen.value = !isModalOpen.value;

	if (timeoutId.value) return;
	clearTimeout(timeoutId.value);

	timeoutId.value = setTimeout(() => {
		isModalOpen.value = false;
		timeoutId.value = null;
	}, 5000);
};

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

// Присоединиться к комнате
const joinRoom = () => {
	if (userName.value.trim() && chatPassword.value.trim()) {
		socket.emit(
			'join_room',
			{ userName: userName.value, password: chatPassword.value },
			(response) => {
				if (response.success) {
					isInChat.value = true;
					action.value = null;
					chatCreator.value = response.creator;
					messages.value = [];
					socket.emit('user_connected', userName.value); // Уведомляем сервер о подключении
				} else {
					alert(response.message);
				}
			}
		);
	}
};

// Отправить сообщение
const sendMessage = () => {
	const currentTime = new Date().toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
	}); // Получаем текущее время;

	if (newMessage.value.trim()) {
		socket.emit('send_message', {
			password: password.value || chatPassword.value,
			userName: userName.value,
			message: newMessage.value,
			currentTime,
		});
		newMessage.value = '';
	}
};

// Покинуть чат (для пользователя)
const leaveChat = () => {
	if (password.value || chatPassword.value) {
		socket.emit('leave_room', {
			userName: userName.value,
			password: password.value || chatPassword.value,
		});

		isInChat.value = false; // Выходим из чата
		connectedUser.value = null; // Очищаем подключенного пользователя
		chatCreator.value = null; // Удаляем информацию о создателе чата
		userName.value = null;
		chatPassword.value = null;

		messages.value.push({
			userName: 'Система',
			message: `${userName.value} покинул чат.`,
		});
	}
};

// Удалить чат (доступно только создателю)
const deleteChat = () => {
	if (chatCreator.value === userName.value) {
		socket.emit('delete_room', {
			password: password.value,
		});

		isInChat.value = false; // Завершаем чат
		connectedUser.value = null; // Очищаем подключенного пользователя
		chatCreator.value = null; // Удаляем информацию о создателе чата
		userName.value = null;
		password.value = null;

		messages.value.push({
			userName: 'Система',
			message: `Чат был удален создателем.`,
		});
	} else {
		alert('Только создатель может удалить чат.');
	}
};

// Уведомление о том, что пользователь печатает
const notifyTyping = () => {
	socket.emit('typing', userName.value); // Отправляем на сервер, что пользователь печатает
};

// Отправка файла
const sendFile = (file) => {
	const reader = new FileReader();
	reader.onload = () => {
		const data = {
			sender: userName.value,
			file: reader.result,
			fileName: file.name,
		};
		socket.emit('send_file', data);
	};
	reader.readAsDataURL(file);
};

onMounted(() => {
	socket.on('update_users', (users) => {
		userStatuses.value = users;
		console.log('Updated users:', users);
	});

	// Подключение нового пользователя
	socket.on('user_joined', (userName) => {
		messages.value.push({
			userName: 'Система',
			message: `${userName} присоединился к чату.`,
		});
		connectedUser.value = userName; // Обновляем отображаемое имя подключенного пользователя
	});

	// Отправка сообшении пользователем
	socket.on('new_message', (message) => {
		messages.value.push(message);
	});

	// Слушаем уведомление о подключении пользователя
	socket.on('user_connected', (user) => {
		connectedUser.value = user; // Устанавливаем имя подключившегося пользователя
		console.log(user);
	});

	// Пользователь печатает..
	socket.on('typing', (user) => {
		if (user !== userName.value) {
			typingUser.value = user;
			clearTimeout(typingTimeout.value);
			typingTimeout.value = setTimeout(() => {
				typingUser.value = null;
			}, 2000);
		}
	});

	// пользователь покинул чат
	socket.on('user_left', (userName) => {
		messages.value.push({
			userName: 'Система',
			message: `${userName} покинул чат.`,
		});
		if (connectedUser.value === userName) {
			connectedUser.value = null; // Удаляем информацию о пользователе
		}
	});

	// чат был удален создателем
	socket.on('room_deleted', () => {
		alert('Чат был удален создателем.');
		isInChat.value = false;
		connectedUser.value = null; // Очищаем подключенного пользователя
		chatCreator.value = null; // Удаляем информацию о создателе
		messages.value.push({
			userName: 'Система',
			message: `Чат был удален создателем.`,
		});
	});
});

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
