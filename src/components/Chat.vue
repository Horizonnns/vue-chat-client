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

onUnmounted(() => {
	socket.off('new_message');
	socket.off('user_connected');
	socket.off('typing');
	socket.off('room_deleted');
});
</script>

<template>
	<div
		class="bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 h-full flex flex-col justify-between px-2 pb-5"
	>
		<div>
			<!-- Сообщение о подключении другого пользователя -->
			<div
				class="flex items-center justify-between text-center border-b dark:border-gray-700 mt-4 pb-4"
			>
				<div></div>

				<!-- users-in-chat -->
				<div class="leading-5">
					<div>
						<p v-if="connectedUser && chatCreator" class="font-light">
							{{
								connectedUser
									? `В чате: ${connectedUser}`
									: 'Пользователь не присоединился к чату'
							}}
						</p>

						<p v-if="chatCreator && !connectedUser" class="font-light">
							{{
								chatCreator && !connectedUser
									? `Создатель чата: ${chatCreator}`
									: 'Пользователь не присоединился к чату'
							}}
						</p>
					</div>

					<!-- show-users-status -->
					<div
						v-if="userStatuses[connectedUser]"
						class="text-green-500 text-sm font-medium"
					>
						<span v-if="userStatuses[connectedUser].isOnline"> Онлайн </span>

						<span v-else class="text-gray-500">
							был(а) в {{ userStatuses[connectedUser].lastSeen }}
						</span>
					</div>
				</div>

				<!-- modal-for-delete-or-leave-chat -->
				<div v-if="chatCreator" class="relative">
					<!-- Кнопка с тремя точками -->
					<button
						@click="toggleModal"
						title="Меню"
						class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 duration-150 outline-none focus-within:outline-none"
					>
						<IconDots />
					</button>

					<!-- Модальное окно -->
					<div
						v-if="isModalOpen"
						class="overflow-auto absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-10"
					>
						<button
							@click="chatCreator === userName ? deleteChat() : leaveChat()"
							class="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							<IconLeave class="mr-2" />
							<span>
								{{ chatCreator === userName ? 'Удалить чат' : 'Покинуть чат' }}
							</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Начальный экран выбора действия -->
			<div
				v-if="!isInChat && !action"
				class="flex flex-col items-center justify-center mt-4"
			>
				<h2 class="text-lg font-bold">Добро пожаловать в чат</h2>

				<div class="flex space-x-4 mt-4">
					<button
						@click="action = 'create'"
						class="bg-green-500 text-white p-2 rounded"
					>
						Создать чат
					</button>

					<button
						@click="action = 'join'"
						class="bg-blue-500 text-white p-2 rounded"
					>
						Подключиться к чату
					</button>
				</div>
			</div>

			<!-- Интерфейс для создания комнаты -->
			<form
				v-if="action === 'create'"
				class="w-60 mx-auto flex flex-col items-center justify-center mt-4"
			>
				<h3 class="text-lg font-bold mb-4">Создать чат</h3>

				<input
					v-model="userName"
					type="text"
					placeholder="Введите имя"
					class="w-full p-2 rounded mb-4"
				/>
				<input
					autocomplete
					v-model="password"
					type="password"
					placeholder="Введите пароль (6 символов)"
					class="w-full p-2 rounded mb-4"
					maxlength="6"
				/>

				<button
					type="button"
					@click="createRoom"
					class="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 duration-150 text-white px-2 py-1.5 rounded"
				>
					Создать
				</button>
			</form>

			<!-- Интерфейс для подключения к комнате -->
			<form
				v-if="action === 'join'"
				class="w-60 mx-auto flex flex-col items-center mt-4"
			>
				<h3 class="text-lg font-bold mb-4">Подключиться к чату</h3>

				<input
					v-model="userName"
					type="text"
					placeholder="Введите имя"
					class="w-full p-2 rounded mb-4"
				/>
				<input
					autocomplete
					v-model="chatPassword"
					type="password"
					placeholder="Введите пароль чата"
					class="w-full p-2 rounded mb-4"
					maxlength="6"
					@input="notifyTyping"
				/>

				<button
					type="button"
					@click="joinRoom"
					class="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 duration-150 text-white px-2 py-1.5 rounded"
				>
					Подключиться
				</button>
			</form>

			<!-- Чат -->
			<div
				v-if="isInChat"
				class="flex flex-col space-y-2 mt-4 overflow-y-scroll h-[78vh]"
			>
				<div
					v-for="message in messages"
					:key="message.id"
					:class="[
						'break-words max-w-xs rounded-lg text-sm px-2 py-1',
						message.userName === 'Система'
							? 'bg-gray-100 dark:bg-gray-800 dark:text-gray-500 text-gray-400 italic mx-auto max-w-xs my-2'
							: message.userName === userName
							? 'bg-green-200 dark:bg-green-600 self-end message-sent'
							: 'bg-gray-200 dark:bg-gray-600 self-start message-received',
					]"
				>
					<!-- <strong>{{ message.userName }}:</strong> {{ message.message }} -->

					<div class="flex items-end space-x-1 leading-4">
						<p>{{ message.message }}</p>

						<p class="text-[10px] font-medium text-gray-500 opacity-0">
							{{ message.time }}
						</p>

						<p
							class="absolute text-[10px] right-1 bottom-px font-medium text-gray-500"
						>
							{{ message.time }}
						</p>
					</div>
				</div>
			</div>

			<!-- Показать, кто печатает -->
			<div
				v-if="typingUser"
				class="typing-indicator text-sm text-gray-500 mb-2"
			>
				{{ typingUser }} печатает...
			</div>
		</div>

		<!-- Поле ввода сообщения -->
		<div
			v-if="isInChat"
			class="sticky bottom-0 z-10 rounded flex items-center justify-between border dark:border-gray-700 mx-2"
		>
			<input
				v-model="newMessage"
				type="text"
				placeholder="Введите сообщение..."
				class="w-full p-2 rounded-l text-sm dark:outline-none"
				@keyup.enter="sendMessage"
				@input="notifyTyping"
			/>

			<button
				class="bg-green-500 hover:bg-green-600 active:bg-green-700 duration-150 text-white outline-none focus:outline-none px-2.5 py-2.5"
				@click="sendFile"
			>
				<IconUpload />
				<!-- <FileUpload @fileSent="sendFile" /> -->
			</button>

			<button
				class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 duration-150 text-white outline-none focus:outline-none rounded-r px-2.5 py-2.5"
				@click="sendMessage"
			>
				<IconSend />
			</button>
		</div>
	</div>
</template>

<style scoped>
.user-name {
	color: #1d4ed8; /* Синий для имени пользователя */
	padding: 10px;
	background-color: #e0f2fe; /* Светло-голубой фон */
	border-radius: 8px;
	margin-bottom: 10px;
	text-align: center;
	font-weight: bold;
}

.typing-indicator {
	font-style: italic;
	color: #aaa;
}

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
	right: -1px;
	bottom: 0;
	width: 0;
	height: 0;
	border-width: 4px;
	border-style: solid;
	border-color: transparent transparent #d1fae5 transparent;
}

/* Стрелка для полученных сообщений */
.message-received::after {
	transform: rotate(90deg);
	content: '';
	position: absolute;
	left: -1px;
	bottom: 0;
	width: 0;
	height: 0;
	border-width: 4px;
	border-style: solid;
	border-color: transparent #e5e7eb transparent transparent;
}
</style>
