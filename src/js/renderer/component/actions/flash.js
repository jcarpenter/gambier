export function flash(element) {
	requestAnimationFrame(() => {
		element.style.transition = 'none';
		element.style.color = 'rgba(255,62,0,1)';
		element.style.backgroundColor = 'rgba(255,62,0,1)';
		element.style.outline = '4px solid black';

		setTimeout(() => {
			element.style.transition = 'color 1s, background 1s, outline 1s';
			element.style.color = '';
			element.style.backgroundColor = '';
			element.style.outline = '';
		});
	});
}