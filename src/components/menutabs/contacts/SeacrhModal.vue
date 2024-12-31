<script setup>
import { ref, toRaw } from 'vue';
import { TransitionRoot, TransitionChild, Dialog } from '@headlessui/vue';
import { useChatStore } from '../../../stores/chat/chat';
import { capitalizeFirstLetter } from '../../../utils/capitalizeFirstLetter';
import axios from 'axios';
import IconExit from '../../icons/IconExit.vue';
import IconSearch from '../../icons/IconSearch.vue';

const chatStore = useChatStore();

const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');

const searchPhone = ref('');
const searchResult = ref(null);

const props = defineProps({
	isOpen: Boolean,
});

const emit = defineEmits(['closeModal']);
function closeModal() {
	setTimeout(() => {
		searchResult.value = null;
		searchPhone.value = '';
	}, 500);

	emit('closeModal');
}

const searchContact = async () => {
	try {
		const response = await axios.get('http://localhost:3000/search', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params: { phone: searchPhone.value },
		});
		searchResult.value = response.data;
	} catch (err) {
		searchResult.value = null;
		alert('Пользователь не найден');
	}
};

const addContact = async () => {
	if (searchResult.value) {
		try {
			await axios.post(
				'http://localhost:3000/add-contact',
				{
					userId: userId,
					contactPhone: searchResult.value.phone,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			// Сохраняем контакт в хранилище
			const rawResult = toRaw(searchResult.value);
			chatStore.setContactList(rawResult);

			alert('Контакт успешно добавлен');

			// Очищаем состояние
			searchResult.value = null;
			searchPhone.value = '';
			emit('closeModal');
		} catch (err) {
			// Обрабатываем ошибку с ответом сервера
			if (err.response && err.response.data) {
				alert(err.response.data); // Выводим сообщение сервера
			} else {
				alert('Контакт уже существует');
			}

			emit('closeModal');

			setTimeout(() => {
				searchResult.value = null;
				searchPhone.value = '';
			}, 500);
		}
	}
};
</script>

<template>
	<TransitionRoot appear :show="isOpen" @close="closeModal" as="template">
		<Dialog as="div" class="relative z-10">
			<TransitionChild
				as="template"
				enter="duration-300 ease-out"
				enter-from="opacity-0"
				enter-to="opacity-100"
				leave="duration-200 ease-in"
				leave-from="opacity-100"
				leave-to="opacity-0"
			>
				<div class="fixed inset-0 bg-black/25" />
			</TransitionChild>

			<div class="fixed inset-0 overflow-y-auto">
				<div
					class="flex min-h-full items-center justify-center p-4 text-center"
				>
					<TransitionChild
						as="template"
						enter="duration-300 ease-out"
						enter-from="opacity-0 scale-95"
						enter-to="opacity-100 scale-100"
						leave="duration-200 ease-in"
						leave-from="opacity-100 scale-100"
						leave-to="opacity-0 scale-95"
					>
						<div class="max-w-xs w-full space-y-4 rounded-md bg-gray-800 p-3">
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<div></div>

									<p>Поиск контакта</p>

									<button
										@click="closeModal"
										class="focus-within:outline-none outline-none active:scale-95 duration-150"
									>
										<IconExit class="w-7 h-7 text-blue-10" />
									</button>
								</div>

								<div class="relative">
									<input
										v-model="searchPhone"
										placeholder="Номер телефона"
										class="w-full px-3 py-2 rounded-md outline-gray-700 focus-within:outline-gray-800 hover:outline-gray-800"
									/>

									<button @click="searchContact">
										<IconSearch
											class="w-8 h-8 absolute top-1 right-1 rounded-full p-1.5 hover:bg-gray-800 duration-150 z-20"
										/>
									</button>
								</div>
							</div>

							<div
								v-if="searchResult"
								class="flex items-center space-x-2 text-sm"
							>
								<p
									class="font-semibold rounded-full bg-gray-500 text-white w-10 h-10 flex items-center justify-center"
								>
									{{ capitalizeFirstLetter(searchResult.name)[0] }}
								</p>

								<div class="flex flex-col items-start">
									<p class="font-semibold">
										{{ capitalizeFirstLetter(searchResult.name) }}
									</p>
									<p>{{ searchResult.phone }}</p>
								</div>
							</div>

							<button
								@click="addContact"
								:disabled="!searchResult"
								:class="[
									'w-full duration-150 rounded-md px-3 py-2 focus-within:outline-none outline-none',
									!searchResult
										? 'bg-gray-100/5'
										: 'bg-gray-900 active:bg-gray-950',
								]"
							>
								Добавить в контакты
							</button>
						</div>
					</TransitionChild>
				</div>
			</div>
		</Dialog>
	</TransitionRoot>
</template>
