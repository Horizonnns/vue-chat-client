<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
	name: '',
	phone: '',
	password: '',
});

const isLogin = ref(true);
const error = ref('');

const toggleForm = () => {
	isLogin.value = !isLogin.value;
	error.value = '';
	form.name = '';
	form.phone = '';
	form.password = '';
};

const handleSubmit = async () => {
	try {
		error.value = '';
		if (isLogin.value) {
			// login
			const response = await axios.post('http://localhost:3000/login', {
				phone: form.phone,
				password: form.password,
			});

			console.log('user: ', response.data.user);

			authStore.setToken(response.data.token);
			authStore.setUserId(response.data.user.id);

			router.push('/menus');
		} else {
			// register
			await axios.post('http://localhost:3000/register', {
				name: form.name,
				phone: form.phone,
				password: form.password,
			});

			toggleForm();
		}
	} catch (err) {
		error.value = err.response?.data || 'Ошибка сервера';
	}
};
</script>

<template>
	<section class="w-full">
		<form
			@submit.prevent="handleSubmit"
			class="w-full flex flex-col items-center space-y-4"
		>
			<div v-if="!isLogin" class="w-full flex flex-col space-y-1">
				<label for="name">Имя</label>
				<input
					id="name"
					v-model="form.name"
					placeholder="Асалпач"
					required
					class="px-3 py-2 rounded-md outline-gray-700 focus-within:outline-gray-800 hover:outline-gray-800"
				/>
			</div>

			<div class="w-full flex flex-col space-y-1">
				<label for="phone">Телефон</label>
				<input
					id="phone"
					v-model="form.phone"
					placeholder="902000821"
					required
					class="px-3 py-2 rounded-md outline-gray-700 focus-within:outline-gray-800 hover:outline-gray-800"
				/>
			</div>

			<div class="w-full flex flex-col space-y-1">
				<label for="password">Пароль</label>
				<input
					id="password"
					type="password"
					v-model="form.password"
					placeholder="********"
					required
					class="px-3 py-2 rounded-md outline-gray-700 focus-within:outline-gray-800 hover:outline-gray-800"
				/>
			</div>

			<div class="space-y-1 text-center w-full">
				<button
					type="submit"
					class="w-full py-2 text-white bg-blue-800 hover:bg-blue-900 duration-150 active:bg-blue-950 rounded-md focus-within:outline-none outline-none"
				>
					{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
				</button>

				<p
					@click="toggleForm"
					class="cursor-pointer text-sm text-gray-500 hover:text-gray-600 duration-150"
				>
					{{
						isLogin
							? 'Нет аккаунта? Зарегистрироваться'
							: 'Уже есть аккаунт? Войти'
					}}
				</p>
				<p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
			</div>
		</form>
	</section>
</template>
