document.addEventListener('DOMContentLoaded', () => {
    const pokedexButton = document.getElementById('pokedex-button');
    const pokedexWindow = document.getElementById('pokedex-window');
    const pokedexCloseButton = document.getElementById('pokedex-close-button');

    if (pokedexButton && pokedexWindow) {
        pokedexButton.addEventListener('click', () => {
            const isHidden = pokedexWindow.style.display === 'none' || pokedexWindow.style.display === '';
            if (isHidden) {
                pokedexWindow.style.display = 'block';
            } else {
                pokedexWindow.style.display = 'none';
            }
        });
    } else {
        console.error("Could not find Pokédex button or window. Please check the IDs in the HTML.");
    }

    if(pokedexCloseButton) {
        pokedexCloseButton.addEventListener('click', () => {
            if (pokedexWindow) {
                pokedexWindow.style.display = 'none';
            }
        });
    }
});
