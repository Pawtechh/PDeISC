export const toggleTheme = () => {

    document.body.classList.toggle('dark');

    const button = document.getElementById('themeButton');

    if (document.body.classList.contains('dark')) {
        button.textContent = 'Modo Claro';
    } else {
        button.textContent = 'Modo Oscuro';
    }
};