/**
 * Get the color for a contact based on their name.
 * @param {string} name - Name of contact.
 * @returns {string} - Color class.
 */

const colors = [
	'bg-blue-400',
	'bg-green-400',
	'bg-red-400',
	'bg-yellow-400',
	'bg-purple-400',
	'bg-pink-400',
	'bg-orange-400',
	'bg-teal-400',
];

export const getColorForContact = (name) => {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash % colors.length);
	return colors[index];
};
