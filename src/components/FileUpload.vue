<template>
	<div class="file-upload">
		<input type="file" @change="handleFile" />
	</div>
</template>

<script>
export default {
	methods: {
		handleFile(event) {
			const file = event.target.files[0];
			if (file && file.size <= 5 * 1024 * 1024) {
				this.$emit('fileSent', file); // Отправляем файл в родительский компонент
			} else {
				alert('Файл слишком большой! Максимум 5МБ.');
			}
		},
	},
};
</script>
