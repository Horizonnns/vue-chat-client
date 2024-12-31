<script setup>
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
import { useMenuTabsStore } from '../stores/menutabs';
import ContactList from '../components/menutabs/contacts/ContactList.vue';
import Calls from '../components/menutabs/calls/Calls.vue';
import Chats from '../components/menutabs/chats/Chats.vue';
import Settings from '../components/menutabs/settings/Settings.vue';

import IconContacts from '../components/icons/IconContacts.vue';
import IconPhoneSolid from '../components/icons/IconPhoneSolid.vue';
import IconChat from '../components/icons/IconChat.vue';
import IconSettings from '../components/icons/IconSettings.vue';

const categories = [
	{ name: 'Контакты', icon: IconContacts, component: ContactList },
	{ name: 'Звонки', icon: IconPhoneSolid, component: Calls },
	{ name: 'Чаты', icon: IconChat, component: Chats },
	{ name: 'Настройки', icon: IconSettings, component: Settings },
];

const menuTabsStore = useMenuTabsStore();
</script>

<template>
	<nav class="w-full h-full bg-gray-40/90 text-active overflow-hidden">
		<ul class="h-full flex flex-col-reverse items-center justify-between">
			<TabGroup
				@change="menuTabsStore.changeTab"
				:selectedIndex="menuTabsStore.selectedTab"
			>
				<TabList class="w-full flex">
					<Tab
						ref="index"
						class="w-full"
						v-for="(category, index) in categories"
						as="template"
						:key="category.name"
						v-slot="{ selected }"
					>
						<button
							class="flex flex-col items-center justify-center px-2 pt-2 pb-6 duration-150 outline-none focus-within:outline-none bg-gray-100 dark:bg-gray-20 text-xs group"
							:class="[selected ? 'text-blue-10' : 'text-gray-10']"
						>
							<!-- Иконка -->
							<component
								:is="category.icon"
								class="w-7 h-7 group-active:scale-90 duration-150"
								:class="[selected ? 'text-blue-10' : 'text-gray-10']"
							/>
							<!-- Название категории -->
							{{ category.name }}
						</button>
					</Tab>
				</TabList>

				<TabPanels class="w-full h-full">
					<TabPanel v-for="(category, idx) in categories" :key="idx">
						<component :is="category.component" />
					</TabPanel>
				</TabPanels>
			</TabGroup>
		</ul>
	</nav>
</template>
