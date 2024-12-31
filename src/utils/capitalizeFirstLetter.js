/**
 * Capitalizes the first letter of a string.
 * @param {string} name - The string to capitalize.
 * @returns {string} The capitalized string.
 */
export function capitalizeFirstLetter(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}
