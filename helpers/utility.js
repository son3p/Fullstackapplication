export default randomNumber = function (length) {
	const text = "";
	const possible = "123456789";
	for (const i = 0; i < length; i++) {
		const sup = Math.floor(Math.random() * possible.length);
		text += i > 0 && sup == i ? "0" : possible.charAt(sup);
	}
	return Number(text);
};