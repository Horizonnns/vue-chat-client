<script setup>
import { computed } from 'vue';
import { useAuthStore } from './stores/auth/auth';
const authStore = useAuthStore();
const token = computed(() => authStore.getToken);
</script>

<template>
	<section
		class="mx-auto rounded-sm w-96 h-screen flex flex-col justify-between bg-gray-20"
	>
		<div class="w-full h-full flex flex-col items-center">
			<h2
				v-if="!token"
				class="bg-gray-20 text-xl text-center font-semibold italic w-full py-3"
			>
				Vue-chat
			</h2>

			<main class="w-full h-full flex items-center justify-center">
				<RouterView />
			</main>
		</div>
	</section>
</template>
