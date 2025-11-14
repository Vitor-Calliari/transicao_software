// animacao suave no scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// efeito de fade-in no quando carrega
document.addEventListener('DOMContentLoaded', function() {
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(20px)';
        hero.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 100);
    }
});

document.addEventListener("DOMContentLoaded", () => {

    const addButton = document.querySelector(".addbotaocliente");
    const modalOverlay = document.querySelector("#modalOverlay");
    const fecharModalCancelar = document.querySelector("#fecharModalCancelar");

    if (!addButton || !modalOverlay) {
        console.error("Erro: elementos do modal não encontrados.");
        return;
    }

    // ABRIR O MODAL
    addButton.addEventListener("click", () => {
        modalOverlay.style.display = "flex";
    });

    // FECHAR NO CANCELAR
    fecharModalCancelar.addEventListener("click", () => {
        modalOverlay.style.display = "none";
    });

    // FECHAR CLICANDO FORA DO MODAL
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = "none";
        }
    });

});
