document.addEventListener("DOMContentLoaded", () => {

    const campos = {
        cod: document.querySelector("#produtoCod"),
        valorUnitario: document.querySelector("#produtoValorUnitario"),
        qtd: document.querySelector("#produtoQtd"),
        estoque: document.querySelector("#produtoEstoque"),
        descricao: document.querySelector("#produtoDescricao"),
    };

    const addButton = document.querySelector(".addbotaoproduto");
    const modalOverlay = document.querySelector("#modalOverlayProduto");
    const fecharModalCancelar = document.querySelector("#fecharModalProdutoCancelar");

    const salvarButton = document.querySelector("#salvarProduto");
    const excluirButton = document.querySelector("#excluirProduto");
    const listaProdutos = document.querySelector("#produtosTbody");
    const produtoError = document.querySelector('#produtoError');
    const produtoErrorMessage = document.querySelector('#produtoErrorMessage');

    let modoEdicao = false;
    let produtoEditandoID = null;
    let ultimoId = Date.now();
    let todosProdutos = [];
    let paginaAtual = 1;
    const itensPorPagina = 10;

    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const API_BASE = "/api/produtos/";

    function safeNumber(value) {
        const n = parseFloat(value.replace(/,/g, '.'));
        return isNaN(n) ? 0 : n;
    }

    // helper
    function getCsrfToken() {
        if (window.CSRF_TOKEN) return window.CSRF_TOKEN;
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

    // carrega produtos back
    function carregarProdutos() {
        fetch(API_BASE)
            .then(res => res.json())
            .then(data => {
                todosProdutos = data.produtos || [];
                exibirPagina(1);
            })
            .catch(err => {
                console.error('Erro ao carregar produtos', err);
            });
    }

    function exibirPagina(pagina) {
        if (listaProdutos) listaProdutos.innerHTML = '';
        paginaAtual = pagina;

        const inicio = (pagina - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;

        const itensPagina = todosProdutos.slice(inicio, fim);

        itensPagina.forEach(p => adicionarProdutoNaListaDOM(p));

        criarBotoesPaginacao();
    }

    function criarBotoesPaginacao() {
        const totalPaginas = Math.ceil(todosProdutos.length / itensPorPagina);
        let container = document.querySelector('#paginationControls');

        if (!container) return;

        container.innerHTML = '';

        for (let i = 1; i <= totalPaginas; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.classList.add('pagina-btn');
            if (i === paginaAtual) btn.classList.add('ativa');

            btn.addEventListener('click', () => exibirPagina(i));
            container.appendChild(btn);
        }
    }

    function adicionarProdutoNaListaDOM(dadosProduto) {
        const tr = document.createElement('tr');
        tr.dataset.id = dadosProduto.id;
        tr.produtoData = dadosProduto;

        const tdDescricao = document.createElement('td');
        tdDescricao.textContent = dadosProduto.descricao;

        const tdCod = document.createElement('td');
        tdCod.textContent = dadosProduto.cod;

        const tdEstoque = document.createElement('td');
        tdEstoque.textContent = dadosProduto.estoque;

        const tdValor = document.createElement('td');
        tdValor.textContent = currencyFormatter.format(Number(dadosProduto.valorUnitario) || 0);

        const tdAcoes = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'editar-btn';
        editBtn.title = 'Editar';
        const editIcon = document.createElement('img');
        editIcon.src = '/static/icons/editar_icon.svg';
        editIcon.alt = 'Editar';
        editIcon.className = 'editar-btn-icon';
        editIcon.width = 18;
        editIcon.height = 18;
        editBtn.appendChild(editIcon);
        editBtn.addEventListener('click', () => abrirEdicao(dadosProduto.id));
        tdAcoes.appendChild(editBtn);

        tr.appendChild(tdDescricao);
        tr.appendChild(tdCod);
        tr.appendChild(tdEstoque);
        tr.appendChild(tdValor);
        tr.appendChild(tdAcoes);

        if (listaProdutos) listaProdutos.appendChild(tr);
    }

    // abrir o modal
    if (addButton) {
        addButton.addEventListener("click", () => {
            modoEdicao = false;
            produtoEditandoID = null;
            limparInputs();
            configurarModalCriar();
            if (campos.cod) campos.cod.value = gerarCodAutomatico();
            abrirModal();
        });
    }

    function configurarModalCriar() {
        const modalTitle = document.querySelector('#modalProdutoTitle');
        const fieldEstoque = document.querySelector('#fieldEstoqueInicial');
        const fieldQtd = document.querySelector('#fieldQuantidade');
        
        if (modalTitle) modalTitle.textContent = 'Novo produto';
        if (fieldEstoque) fieldEstoque.style.display = '';
        if (fieldQtd) fieldQtd.style.display = 'none';
        if (campos.cod) campos.cod.readOnly = true;
        if (campos.estoque) campos.estoque.disabled = false;
        if (salvarButton) salvarButton.textContent = 'Salvar';
        if (excluirButton) excluirButton.style.display = '';
    }

    function configurarModalEdicao() {
        const modalTitle = document.querySelector('#modalProdutoTitle');
        const fieldEstoque = document.querySelector('#fieldEstoqueInicial');
        const fieldQtd = document.querySelector('#fieldQuantidade');
        
        if (modalTitle) modalTitle.textContent = 'Adicionar ao estoque';
        if (fieldEstoque) fieldEstoque.style.display = 'none';
        if (fieldQtd) fieldQtd.style.display = '';
        if (campos.cod) campos.cod.readOnly = true;
        if (campos.qtd) campos.qtd.value = '';
        if (salvarButton) salvarButton.textContent = 'Adicionar';
        if (excluirButton) excluirButton.style.display = '';
    }

    function abrirModal() {
        if (!modalOverlay) return;
        modalOverlay.style.display = "flex";
        modalOverlay.setAttribute('aria-hidden', 'false');
        // esconder mensagem de erro ao abrir
        if (produtoError) { produtoError.style.display = 'none'; produtoError.setAttribute('aria-hidden','true'); }
        // mover foco para o primeiro input existente
        const first = document.querySelector('#produtoDescricao');
        if (first) first.focus();
    }

    function fecharModal() {
        if (!modalOverlay) return;
        modalOverlay.style.display = "none";
        modalOverlay.setAttribute('aria-hidden', 'true');
        modoEdicao = false;
        produtoEditandoID = null;
        limparInputs();
        // esconder mensagem de erro ao fechar
        if (produtoError) { produtoError.style.display = 'none'; produtoError.setAttribute('aria-hidden','true'); }
    }

    // fechar pelo botão cancelar
    if (fecharModalCancelar) fecharModalCancelar.addEventListener('click', fecharModal);

    // salvar produto
    if (salvarButton) salvarButton.addEventListener('click', () => {
        const descricao = campos.descricao?.value.trim() ?? '';
        const codRaw = campos.cod?.value.trim() ?? '';
        const cod = codRaw || gerarCodAutomatico();
        const valorRaw = campos.valorUnitario?.value.trim() ?? '';

        if (modoEdicao) {
            // Modo edição: validar quantidade a adicionar
            const qtdRaw = campos.qtd?.value.trim() ?? '';
            
            if (!descricao || !valorRaw || !qtdRaw) {
                if (produtoErrorMessage) produtoErrorMessage.textContent = 'Preenchimento de todos os campos é obrigatório.';
                if (produtoError) { produtoError.style.display = 'block'; produtoError.setAttribute('aria-hidden','false'); }
                return;
            }

            adicionarEstoqueAPI(produtoEditandoID);
        } else {
            // Modo criar: validar estoque inicial
            const estoqueRaw = campos.estoque?.value.trim() ?? '';
            
            if (!descricao || !cod || !valorRaw || !estoqueRaw) {
                if (produtoErrorMessage) produtoErrorMessage.textContent = 'Preenchimento de todos os campos é obrigatório.';
                if (produtoError) { produtoError.style.display = 'block'; produtoError.setAttribute('aria-hidden','false'); }
                return;
            }

            criarProdutoAPI();
        }
    });

    // criar produto no backend
    function criarProdutoAPI() {
        const payload = {
            descricao: campos.descricao.value.trim(),
            cod: campos.cod.value.trim(),
            valorUnitario: safeNumber(campos.valorUnitario?.value.trim() ?? ''),
            estoque: parseInt(campos.estoque.value.trim(), 10) || 0
        };

        fetchJson(API_BASE + "create/", {
            method: "POST",
            body: JSON.stringify(payload)
        }).then(data => {
            adicionarProdutoNaListaDOM(data.produto);
            fecharModal();
        }).catch(err => {
            console.error(err);
            if (produtoErrorMessage) produtoErrorMessage.textContent = 'Erro ao criar produto';
            if (produtoError) { produtoError.style.display = 'block'; produtoError.setAttribute('aria-hidden','false'); }
        });
    }

    function abrirEdicao(id) {
        modoEdicao = true;
        produtoEditandoID = id;

        const tr = document.querySelector(`tr[data-id="${id}"]`);
        if (!tr || !tr.produtoData) return;
        const dados = tr.produtoData;

        // Preencher campos
        if (campos.cod) campos.cod.value = dados.cod ?? '';
        if (campos.valorUnitario) {
            campos.valorUnitario.value = (typeof dados.valorUnitario === 'number') ? dados.valorUnitario.toFixed(2).replace('.', ',') : (dados.valorUnitario ?? '');
        }
        campos.descricao.value = dados.descricao ?? '';
        
        // Configurar modal para edição (adicionar ao estoque)
        configurarModalEdicao();
        abrirModal();
    }

    function adicionarEstoqueAPI(id) {
        const tr = document.querySelector(`tr[data-id="${id}"]`);
        if (!tr || !tr.produtoData) return;
        
        const qtdAdicionar = parseInt(campos.qtd.value.trim(), 10) || 0;
        const estoqueAtual = tr.produtoData.estoque || 0;
        const novoEstoque = estoqueAtual + qtdAdicionar;

        const payload = {
            descricao: campos.descricao.value.trim(),
            cod: campos.cod.value.trim(),
            valorUnitario: safeNumber(campos.valorUnitario?.value.trim() ?? ''),
            estoque: novoEstoque
        };

        fetchJson(API_BASE + id + "/", {
            method: "PUT",
            body: JSON.stringify(payload)
        }).then(data => {
            tr.produtoData = data.produto;
            const tds = tr.querySelectorAll('td');
            if (tds[0]) tds[0].textContent = data.produto.descricao;
            if (tds[1]) tds[1].textContent = data.produto.cod;
            if (tds[2]) tds[2].textContent = data.produto.estoque;
            if (tds[3]) tds[3].textContent = currencyFormatter.format(Number(data.produto.valorUnitario) || 0);
            fecharModal();
        }).catch(err => {
            console.error(err);
            if (produtoErrorMessage) produtoErrorMessage.textContent = 'Erro ao adicionar ao estoque';
            if (produtoError) { produtoError.style.display = 'block'; produtoError.setAttribute('aria-hidden','false'); }
        });
    }

    // busca/filtragem da lista de produtos: executa somente ao clicar na lupa
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');

    function executarBusca() {
        const q = (searchInput?.value ?? '').trim().toLowerCase();
        const rows = document.querySelectorAll('#produtosTbody tr');
        rows.forEach(row => {
            const data = row.produtoData ?? {};
            const descricao = String(data.descricao ?? '').toLowerCase();
            const cod = String(data.cod ?? '').toLowerCase();
            const matches = q === '' ? true : (descricao.includes(q) || cod.includes(q));
            row.style.display = matches ? '' : 'none';
        });
    }

    if (searchIcon) {
        searchIcon.addEventListener('click', executarBusca);
    }

    // excluir produto
    if (excluirButton) excluirButton.addEventListener('click', () => {
        if (!modoEdicao) return;
        
        fetchJson(API_BASE + produtoEditandoID + "/", {
            method: "DELETE"
        }).then(() => {
            const tr = document.querySelector(`tr[data-id="${produtoEditandoID}"]`);
            if (tr) tr.remove();
            fecharModal();
        }).catch(err => {
            console.error(err);
            alert('Erro ao excluir produto');
        });
    });

    function gerarCodAutomatico() {
        const itens = document.querySelectorAll('tr[data-id]');
        if (itens.length === 0) return '1';
        let maior = 0;
        itens.forEach(item => {
            const p = item.produtoData?.cod ?? '';
            const n = parseInt(String(p).replace(/\D/g, ''), 10);
            if (!isNaN(n) && n > maior) maior = n;
        });
        return String(maior + 1);
    }

    function limparInputs() {
        for (let campo in campos) {
            if (campos[campo]) campos[campo].value = '';
        }
    }

    // Incluir validações de entrada (somente números para qtd e preco)
    function permitirSomenteNumeros(input) {
        if (!input) return;
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9.,]/g, '');
        });
    }

    // aplicar restricoes se elementos existirem
    permitirSomenteNumeros(document.querySelector('#produtoQtd'));
    permitirSomenteNumeros(document.querySelector('#produtoEstoque'));
    permitirSomenteNumeros(document.querySelector('#produtoValorUnitario'));

    // permitir avançar para o próximo campo ao pressionar Enter
    function enableEnterAdvance(orderSelectors) {
        orderSelectors.forEach((sel, idx) => {
            const el = document.querySelector(sel);
            if (!el) return;
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // procura o próximo elemento existente na lista
                    let nextEl = null;
                    for (let j = idx + 1; j < orderSelectors.length; j++) {
                        const candidate = document.querySelector(orderSelectors[j]);
                        if (candidate) { nextEl = candidate; break; }
                    }
                    if (nextEl) {
                        nextEl.focus();
                        if (nextEl.select) try { nextEl.select(); } catch (err) {}
                    } else {
                        // nenhum próximo: dispara salvar
                        if (salvarButton) salvarButton.click();
                    }
                }
            });
        });
    }

    // ordem esperada dentro do modal (criar)
    enableEnterAdvance(['#produtoDescricao', '#produtoValorUnitario', '#produtoEstoque', '#produtoCod']);

    // carregar produtos ao iniciar
    carregarProdutos();

});