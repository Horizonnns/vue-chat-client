<template>
	<div class="container mx-auto p-4">
		<h1 class="text-2xl font-bold mb-4">Реальный чат</h1>
		<Chat />
	</div>
</template>

<script>
import Chat from './components/Chat.vue';

export default {
	components: { Chat },
};
</script>

<style>
/* TailwindCSS добавит стили автоматически */
</style>
