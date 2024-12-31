import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // socket server address

// auth with socket
export const authenticateSocket = (token) => {
	socket.emit('authenticate', token);
};

export default socket;
