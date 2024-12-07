<template>
	<div>
		<button
			class="btn bg-green-500 text-white px-4 py-2 rounded"
			@click="startCall"
		>
			Начать звонок
		</button>
		<video ref="localVideo" autoplay muted class="w-full"></video>
		<video ref="remoteVideo" autoplay class="w-full"></video>
	</div>
</template>

<script>
export default {
	methods: {
		async startCall() {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			});
			this.$refs.localVideo.srcObject = stream;

			// WebRTC логика для создания звонков
		},
	},
};
</script>
