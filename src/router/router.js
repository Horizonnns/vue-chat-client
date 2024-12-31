import { useAuthStore } from '../stores/auth/auth';
import { createRouter, createWebHistory } from 'vue-router';
import Menus from '../pages/Menus.vue';
import LoginRegister from '../pages/auth/LoginRegister.vue';

const routes = [
	{
		path: '/login',
		name: 'Login',
		component: LoginRegister,
	},
	{
		path: '/menus',
		name: 'Menus',
		component: Menus,
		meta: { requiresAuth: true },
	},
	{
		path: '/chat/:contactId',
		name: 'Chat',
		component: () => import('../pages/Chat.vue'),
		meta: { requiresAuth: true },
	},
	{ path: '/', redirect: '/login' }, // Перенаправление на /login по умолчанию
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

// Проверка авторизации перед каждым маршрутом
router.beforeEach((to, from, next) => {
	const authStore = useAuthStore();
	const token = authStore.getToken;

	if (to.meta.requiresAuth && !token) {
		// Если требуется авторизация, но токен отсутствует
		next('/login');
	} else {
		next(); // Продолжаем переход
	}
});

export default router;
