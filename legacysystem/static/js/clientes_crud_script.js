document.addEventListener("DOMContentLoaded", () => {

    const campos = {
        nome: document.querySelector("#nome"),
        email: document.querySelector("#email"),
        celular: document.querySelector("#celular"),
        fixo: document.querySelector("#fixo"),
        cod: document.querySelector("#cod"),
        endereco: document.querySelector("#endereco"),
        cep: document.querySelector("#cep"),
        numero: document.querySelector("#numero"),
        uf: document.querySelector("#uf"),
        bairro: document.querySelector("#bairro"),
        cidade: document.querySelector("#cidade"),
        complemento: document.querySelector("#complemento"),
        rg: document.querySelector("#rg"),
        cpf: document.querySelector("#cpf"),
    };

    const addButton = document.querySelector(".addbotaocliente");
    const modalOverlay = document.querySelector("#modalOverlay");
    const fecharModalCancelar = document.querySelector("#fecharModalCancelar");

    const salvarButton = document.querySelector("#salvarCliente");
    const excluirButton = document.querySelector("#excluirCliente");
    const listaClientes = document.querySelector(".info-card");

    const inputNome = document.querySelector("#nome");
    const inputCod = document.querySelector("#cod");

    let modoEdicao = false;
    let clienteEditandoID = null;

    // abrir o modal
    addButton.addEventListener("click", () => {
        modoEdicao = false;
        clienteEditandoID = null;
        limparInputs();
        campos.cod.value = gerarCodAutomatico(); // gerar cod automático
        modalOverlay.style.display = "flex";
    });


    // fechar o modal
    function fecharModal() {
        modalOverlay.style.display = "none";
        modoEdicao = false;
        clienteEditandoID = null;

        document.querySelectorAll("#modalOverlay input").forEach(input => {
            input.value = "";
        });
    }

    // Botão cancelar
    if (fecharModalCancelar) {
        fecharModalCancelar.addEventListener("click", fecharModal);
    }


    // Salvar cliente
    salvarButton.addEventListener("click", () => {
        let cod = inputCod.value.trim();
        const nome = inputNome.value.trim();

        if (!nome) {
            alert("Preencha o nome do cliente!");
            return;
        }

        if (!cod) {
            cod = gerarCodAutomatico();
            campos.cod.value = cod;
        }

        if (modoEdicao) {
            atualizarCliente(clienteEditandoID);
        } else {
            criarCliente(nome, cod);
        }

        fecharModal();
    });

    // Criar cliente
    function criarCliente(nome, cod) {

        const id = Date.now();

        const dadosCliente = {
            id,
            nome: campos.nome.value.trim(),
            email: campos.email.value.trim(),
            celular: campos.celular.value.trim(),
            fixo: campos.fixo.value.trim(),
            cod: cod,
            endereco: campos.endereco.value.trim(),
            cep: campos.cep.value.trim(),
            numero: campos.numero.value.trim(),
            uf: campos.uf.value.trim(),
            bairro: campos.bairro.value.trim(),
            cidade: campos.cidade.value.trim(),
            complemento: campos.complemento.value.trim(),
            rg: campos.rg.value.trim(),
            cpf: campos.cpf.value.trim()
        };

        const item = document.createElement("div");
        item.classList.add("info-item");
        item.setAttribute("data-id", id);
        item.dados = dadosCliente; // salva todos os dados no elemento

        item.innerHTML = `
            <span class="label">${dadosCliente.nome}</span>
            <span class="value-center">#${dadosCliente.cod}</span>
            <img src="/static/icons/editar_icon.svg" class="editar-icon">
        `;

        item.querySelector(".editar-icon").addEventListener("click", () => {
            abrirEdicao(id);
        });

        listaClientes.appendChild(item);
    }


    // editar cliente

    function abrirEdicao(id) {
        modoEdicao = true;
        clienteEditandoID = id;

        const item = document.querySelector(`[data-id="${id}"]`);
        const dados = item.dados;

        for (let campo in campos) {
            campos[campo].value = dados[campo] ?? "";
        }

        modalOverlay.style.display = "flex";
    }

    // atualizar cliente

    function atualizarCliente(id) {
        const item = document.querySelector(`[data-id="${id}"]`);
        const dados = item.dados;

        for (let campo in campos) {
            dados[campo] = campos[campo].value.trim();
        }

        item.querySelector(".label").innerText = dados.nome;
        item.querySelector(".value-center").innerText = "#" + dados.cod;
    }


    // Excluir cliente

    excluirButton.addEventListener("click", () => {
        if (!modoEdicao) return;

        const item = document.querySelector(`[data-id="${clienteEditandoID}"]`);
        if (item) item.remove();

        fecharModal();
    });

    // Gerar ID 
  
    function gerarCodAutomatico() {
        const itens = document.querySelectorAll(".info-item");

        if (itens.length === 0) return 1;

        let maior = 0;

        itens.forEach(item => {
            const cod = parseInt(item.dados.cod);
            if (!isNaN(cod) && cod > maior) maior = cod;
        });

        return maior + 1;
    }


    // lipar os inputs
    function limparInputs() {
        for (let campo in campos) {
            campos[campo].value = "";
        }
    }

});


// somente numeros 
function permitirSomenteNumeros(input) {
    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
    });
}

// somente letras
document.getElementById("nome").addEventListener("input", function () {
    this.value = this.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "");
})

permitirSomenteNumeros(document.querySelector("#celular"));
permitirSomenteNumeros(document.querySelector("#fixo"));
permitirSomenteNumeros(document.querySelector("#cep"));
permitirSomenteNumeros(document.querySelector("#numero"));
permitirSomenteNumeros(document.querySelector("#cpf"));
permitirSomenteNumeros(document.querySelector("#rg"));
