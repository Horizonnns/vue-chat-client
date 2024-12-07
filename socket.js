import { io } from 'socket.io-client';

// Подключение к серверу
const socket = io('http://localhost:3000'); // Замените на адрес вашего сервера
export default socket;
