document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // CONFIGURAÇÕES E ELEMENTOS
    // ==============================

    const campos = {
        nome: document.querySelector("#nomeFornecedor"),
        email: document.querySelector("#emailFornecedor"),
        celular: document.querySelector("#celularFornecedor"),
        fixo: document.querySelector("#fixoFornecedor"),
        cod: document.querySelector("#codFornecedor"),
        endereco: document.querySelector("#enderecoFornecedor"),
        cep: document.querySelector("#cepFornecedor"),
        numero: document.querySelector("#numeroFornecedor"),
        uf: document.querySelector("#ufFornecedor"),
        bairro: document.querySelector("#bairroFornecedor"),
        cidade: document.querySelector("#cidadeFornecedor"),
        complemento: document.querySelector("#complementoFornecedor"),
        cnpj: document.querySelector("#cnpjFornecedor")
    };

    const addButton = document.querySelector(".addFornecedorButton");
    const modalOverlay = document.querySelector("#modalOverlay");
    const fecharModalCancelar = document.querySelector("#fecharModalCancelar");
    const salvarButton = document.querySelector("#salvarFornecedor");
    const excluirButton = document.querySelector("#excluirFornecedor");
    const listaFornecedores = document.querySelector(".info-card");

    let modoEdicao = false;
    let fornecedorEditandoID = null;
    let fornecedores = []; // <- agora armazenamos a lista completa aqui
    let paginaAtual = 1;
    const itensPorPagina = 10;

    const API_BASE = "/api/fornecedores/";


    // ==============================
    // FUNÇÕES DE SEGURANÇA / FETCH
    // ==============================

    function getCsrfToken() {
        if (window.CSRF_TOKEN) return window.CSRF_TOKEN;
        const m = document.querySelector('meta[name="csrf-token"]');
        return m ? m.getAttribute('content') : '';
    }

    function fetchJson(url, options = {}) {
        const headers = options.headers || {};
        headers["Content-Type"] = "application/json";

        const csrf = getCsrfToken();
        if (csrf) headers["X-CSRFToken"] = csrf;

        options.headers = headers;

        return fetch(url, options).then(resp => {
            if (!resp.ok)
                return resp.json().then(err => Promise.reject({ status: resp.status, body: err }));
            return resp.json();
        });
    }


    // ==============================
    // PAGINAÇÃO
    // ==============================

    function exibirPagina(pagina) {
        listaFornecedores.innerHTML = "";
        paginaAtual = pagina;

        const inicio = (pagina - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;

        const itensPagina = fornecedores.slice(inicio, fim);

        itensPagina.forEach(f => adicionarFornecedorNaListaDOM(f));

        criarBotoesPaginacao();
    }

    function criarBotoesPaginacao() {
        let totalPaginas = Math.ceil(fornecedores.length / itensPorPagina);
        let container = document.querySelector("#paginacao");

        if (!container) {
            container = document.createElement("div");
            container.id = "paginacao";
            container.style.textAlign = "center";
            container.style.marginTop = "20px";
            listaFornecedores.parentElement.appendChild(container);
        }

        container.innerHTML = "";

        for (let i = 1; i <= totalPaginas; i++) {
            const btn = document.createElement("button");
            btn.innerText = i;
            btn.classList.add("pagina-btn");
            if (i === paginaAtual) btn.classList.add("ativa");

            btn.addEventListener("click", () => exibirPagina(i));
            container.appendChild(btn);
        }
    }


    // ==============================
    // CRUD - VISUAL
    // ==============================

    function adicionarFornecedorNaListaDOM(dadosFornecedor) {
        const item = document.createElement("div");
        item.classList.add("info-item");
        item.setAttribute("data-id", dadosFornecedor.id);
        item.dados = dadosFornecedor;

        item.innerHTML = `
            <span class="label">${dadosFornecedor.nome}</span>
            <span class="value-center">#${dadosFornecedor.cod}</span>
            <img src="/static/icons/editar_icon.svg" class="editar-icon">
        `;

        item.querySelector(".editar-icon").addEventListener("click", () => {
            abrirEdicao(dadosFornecedor.id);
        });

        listaFornecedores.appendChild(item);
    }


    // ==============================
    // CRUD - API
    // ==============================

    function carregarFornecedores() {
        fetch(API_BASE)
            .then(res => res.json())
            .then(data => {
                fornecedores = data.fornecedores;
                exibirPagina(1);
            })
            .catch(err => console.error("Erro ao carregar fornecedores", err));
    }

    function criarFornecedorAPI() {
        const payload = coletarDadosDoFormulario();

        fetchJson(API_BASE + "create/", {
            method: "POST",
            body: JSON.stringify(payload)
        }).then(data => {
            fornecedores.push(data.fornecedor);
            exibirPagina(paginaAtual);
        });
    }

    function atualizarFornecedorAPI(id) {
        const payload = coletarDadosDoFormulario();

        fetchJson(API_BASE + id + "/", {
            method: "PUT",
            body: JSON.stringify(payload)
        }).then(data => {

            const index = fornecedores.findIndex(f => f.id === id);
            if (index !== -1) fornecedores[index] = data.fornecedor;

            exibirPagina(paginaAtual);
        });
    }

    excluirButton.addEventListener("click", () => {
        if (!modoEdicao) return;
        if (!confirm("Confirma exclusão?")) return;

        fetchJson(API_BASE + fornecedorEditandoID + "/delete/", {
            method: "DELETE"
        }).then(() => {
            fornecedores = fornecedores.filter(f => f.id !== fornecedorEditandoID);
            exibirPagina(1);
            fecharModal();
        });
    });


    // ==============================
    // MODAL E FORMULÁRIO
    // ==============================

    addButton.addEventListener("click", () => {
        modoEdicao = false;
        fornecedorEditandoID = null;
        limparInputs();
        campos.cod.value = gerarCodAutomatico();
        campos.cod.readOnly = true;
        modalOverlay.style.display = "flex";
    });

    function abrirEdicao(id) {
        modoEdicao = true;
        fornecedorEditandoID = id;

        const dados = fornecedores.find(f => f.id === id);

        for (let campo in campos) campos[campo].value = dados[campo] ?? "";
        campos.cod.readOnly = true;

        modalOverlay.style.display = "flex";
    }

    salvarButton.addEventListener("click", () => {
        const nome = campos.nome.value.trim();
        if (!nome) return alert("Preencha o nome!");

        if (modoEdicao) atualizarFornecedorAPI(fornecedorEditandoID);
        else criarFornecedorAPI();

        fecharModal();
    });

    function fecharModal() {
        modalOverlay.style.display = "none";
        modoEdicao = false;
        fornecedorEditandoID = null;
    }

    if (fecharModalCancelar) fecharModalCancelar.addEventListener("click", fecharModal);

    function coletarDadosDoFormulario() {
        return {
            nome: campos.nome.value.trim(),
            email: campos.email.value.trim(),
            celular: campos.celular.value.trim(),
            fixo: campos.fixo.value.trim(),
            cod: Number(campos.cod.value.trim()) || null,
            endereco: campos.endereco.value.trim(),
            cep: campos.cep.value.trim(),
            numero: campos.numero.value.trim(),
            uf: campos.uf.value.trim(),
            bairro: campos.bairro.value.trim(),
            cidade: campos.cidade.value.trim(),
            complemento: campos.complemento.value.trim(),
            cnpj: campos.cnpj.value.trim(),
        };
    }

    function gerarCodAutomatico() {
        if (fornecedores.length === 0) return 1;
        const maior = Math.max(...fornecedores.map(f => Number(f.cod) || 0));
        return maior + 1;
    }

    function limparInputs() {
        for (let campo in campos) campos[campo].value = "";
    }

    carregarFornecedores();


    // ==============================
    // MÁSCARAS DE CAMPOS
    // ==============================

    document.getElementById("nomeFornecedor").addEventListener("input", function () {
        this.value = this.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "");
    });

    document.getElementById("celularFornecedor").addEventListener("input", function () {
        let v = this.value.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);

        if (v.length > 6) this.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        else if (v.length > 2) this.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        else this.value = v;
    });

    document.getElementById("fixoFornecedor").addEventListener("input", function () {
        let v = this.value.replace(/\D/g, "");
        if (v.length > 10) v = v.slice(0, 10);

        if (v.length > 6) this.value = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
        else if (v.length > 2) this.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        else this.value = v;
    });

    document.getElementById("cnpjFornecedor").addEventListener("input", function () {
        let value = this.value.replace(/\D/g, "");
        value = value.replace(/^(\d{2})(\d)/, "$1.$2");
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
        value = value.replace(/(\d{4})(\d)/, "$1-$2");
        this.value = value.slice(0, 18);
    });

    document.getElementById("cepFornecedor").addEventListener("input", function () {
        let v = this.value.replace(/\D/g, "");
        if (v.length > 8) v = v.slice(0, 8);
        this.value = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
    });

    document.getElementById("numeroFornecedor").addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "");
    });

    document.getElementById("ufFornecedor").addEventListener("input", function () {
        let value = this.value.replace(/[^A-Za-z]/g, "");
        this.value = value.toUpperCase().slice(0, 2);
    });

    // ==============================
    // BUSCA DE FORNECEDORES
    // ==============================

    document.getElementById("searchFornecedor").addEventListener("input", function () {
        const termo = this.value.trim().toLowerCase();

        if (termo === "") {
            exibirPagina(1); // Volta ao modo normal com paginação
            return;
        }

        const filtrados = fornecedores.filter(f =>
            (f.nome ?? "").toLowerCase().includes(termo) ||
            (String(f.cod) ?? "").includes(termo) ||
            (f.cnpj ?? "").toLowerCase().includes(termo)
        );

        exibirResultadosBusca(filtrados);
    });

    function exibirResultadosBusca(lista) {
        listaFornecedores.innerHTML = "";

        if (lista.length === 0) {
            listaFornecedores.innerHTML =
                "<p style='color:white; text-align:center;'>Nenhum fornecedor encontrado.</p>";
        } else {
            lista.forEach(f => adicionarFornecedorNaListaDOM(f));
        }

        const pag = document.querySelector("#paginacao");
        if (pag) pag.innerHTML = ""; // Esconde paginação durante busca
    }

});
