document.addEventListener("DOMContentLoaded", () => {

    // campos e elementos...
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
    const btnPrint = document.querySelector('.btn-print');

    const inputNome = campos.nome;
    const inputCod = campos.cod;

    let modoEdicao = false;
    let clienteEditandoID = null;

    const API_BASE = "/api/clientes/"; // endpoints montados acima

    // CSRF helper
    function getCsrfToken() {
        // tenta a variável global (inserida no template)
        if (window.CSRF_TOKEN) return window.CSRF_TOKEN;
        // fallback: meta tag
        const m = document.querySelector('meta[name="csrf-token"]');
        return m ? m.getAttribute('content') : '';
    }

    function fetchJson(url, options = {}) {
        const headers = options.headers || {};
        headers['Content-Type'] = 'application/json';
        const csrf = getCsrfToken();
        if (csrf) headers['X-CSRFToken'] = csrf;
        options.headers = headers;
        return fetch(url, options).then(resp => {
            if (!resp.ok) return resp.json().then(err => Promise.reject({status: resp.status, body: err}));
            return resp.json();
        });
    }

    // carregar clientes iniciais
    function carregarClientes() {
        fetch(API_BASE)
            .then(res => res.json())
            .then(data => {
                listaClientes.innerHTML = '';
                data.clientes.forEach(c => {
                    adicionarClienteNaListaDOM(c);
                });
            })
            .catch(err => {
                console.error('Erro ao carregar clientes', err);
            });
    }

    function adicionarClienteNaListaDOM(dadosCliente) {
        const item = document.createElement("div");
        item.classList.add("info-item");
        item.setAttribute("data-id", dadosCliente.id);
        item.dados = dadosCliente;

        item.innerHTML = `
            <span class="label">${dadosCliente.nome}</span>
            <span class="value-center">#${dadosCliente.cod}</span>
            <img src="/static/icons/editar_icon.svg" class="editar-icon">
        `;

        item.querySelector(".editar-icon").addEventListener("click", () => {
            abrirEdicao(dadosCliente.id);
        });

        listaClientes.appendChild(item);
    }

    // abrir modal para criar
    addButton.addEventListener("click", () => {
        modoEdicao = false;
        clienteEditandoID = null;
        limparInputs();
        // gerar cod automático no frontend com base nos itens já carregados
        campos.cod.value = gerarCodAutomatico();
        modalOverlay.style.display = "flex";
    });

    function fecharModal() {
        modalOverlay.style.display = "none";
        modoEdicao = false;
        clienteEditandoID = null;
        limparInputs();
    }
    if (fecharModalCancelar) fecharModalCancelar.addEventListener("click", fecharModal);

    // salvar (criar ou atualizar)
    salvarButton.addEventListener("click", () => {
        const nome = inputNome.value.trim();
        if (!nome) {
            alert("Preencha o nome do cliente!");
            return;
        }
        if (modoEdicao) {
            atualizarClienteAPI(clienteEditandoID);
        } else {
            criarClienteAPI();
        }
        fecharModal();
    });

    // criar no backend
    function criarClienteAPI() {
        const payload = coletarDadosDoFormulario();
        // POST para /api/clientes/create/
        fetchJson(API_BASE + "create/", {
            method: "POST",
            body: JSON.stringify(payload)
        }).then(data => {
            adicionarClienteNaListaDOM(data.cliente);
        }).catch(err => {
            console.error(err);
            alert("Erro ao criar cliente");
        });
    }

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

    function atualizarClienteAPI(id) {
        const payload = coletarDadosDoFormulario();
        fetchJson(API_BASE + id + "/", {
            method: "PUT",
            body: JSON.stringify(payload)
        }).then(data => {
            // atualizar DOM
            const item = document.querySelector(`[data-id="${id}"]`);
            item.dados = data.cliente;
            item.querySelector(".label").innerText = data.cliente.nome;
            item.querySelector(".value-center").innerText = "#" + data.cliente.cod;
        }).catch(err => {
            console.error(err);
            alert("Erro ao atualizar cliente");
        });
    }

    excluirButton.addEventListener("click", () => {
        if (!modoEdicao) return;
        if (!confirm("Confirma exclusão?")) return;
        fetchJson(API_BASE + clienteEditandoID + "/delete/", {
            method: "DELETE"
        }).then(() => {
            const item = document.querySelector(`[data-id="${clienteEditandoID}"]`);
            if (item) item.remove();
            fecharModal();
        }).catch(err => {
            console.error(err);
            alert("Erro ao excluir cliente");
        });
    });

    function coletarDadosDoFormulario() {
        return {
            nome: campos.nome.value.trim(),
            email: campos.email.value.trim(),
            celular: campos.celular.value.trim(),
            fixo: campos.fixo.value.trim(),
            cod: campos.cod.value.trim() ? Number(campos.cod.value.trim()) : null,
            endereco: campos.endereco.value.trim(),
            cep: campos.cep.value.trim(),
            numero: campos.numero.value.trim(),
            uf: campos.uf.value.trim(),
            bairro: campos.bairro.value.trim(),
            cidade: campos.cidade.value.trim(),
            complemento: campos.complemento.value.trim(),
            rg: campos.rg.value.trim(),
            cpf: campos.cpf.value.trim(),
        };
    }

    // gerar cod baseado em DOM (se preferir, peça ao backend)
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

    function limparInputs() {
        for (let campo in campos) campos[campo].value = "";
    }

    // validações de números/letras (mantive como estava)
    function permitirSomenteNumeros(input) {
        if (!input) return;
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "");
        });
    }

    document.getElementById("nome").addEventListener("input", function () {
        this.value = this.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "");
    })

    permitirSomenteNumeros(document.querySelector("#celular"));
    permitirSomenteNumeros(document.querySelector("#fixo"));
    permitirSomenteNumeros(document.querySelector("#cep"));
    permitirSomenteNumeros(document.querySelector("#numero"));
    permitirSomenteNumeros(document.querySelector("#cpf"));
    permitirSomenteNumeros(document.querySelector("#rg"));

    // por fim, carrega os clientes do backend
    carregarClientes();


if (btnPrint) {
    btnPrint.addEventListener('click', function() {
        const exportUrl = this.getAttribute('data-export-url');

        if (exportUrl) {
            window.location.href = "/exportar_clientes_csv/";
        } else {
            console.error("URL de exportação não encontrada no botão.");
        }
    });
}

}); 