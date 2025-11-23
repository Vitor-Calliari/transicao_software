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

    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    function safeNumber(value) {
        const n = parseFloat(value.replace(/,/g, '.'));
        return isNaN(n) ? 0 : n;
    }

    // abrir o modal
    if (addButton) {
        addButton.addEventListener("click", () => {
            modoEdicao = false;
            produtoEditandoID = null;
            limparInputs();
            if (campos.cod) campos.cod.value = gerarCodAutomatico();
            abrirModal();
        });
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

        // validar que todos os campos foram preenchidos
        const codRawCheck = campos.cod?.value.trim() ?? '';
        const valorRawCheck = campos.valorUnitario?.value.trim() ?? '';
        const qtdRawCheck = campos.qtd?.value.trim() ?? '';
        const estoqueRawCheck = campos.estoque?.value.trim() ?? '';

        if (!descricao || !codRawCheck || !valorRawCheck || !qtdRawCheck || !estoqueRawCheck) {
            if (produtoErrorMessage) produtoErrorMessage.textContent = 'Preenchimento de todos os campos é obrigatório.';
            if (produtoError) { produtoError.style.display = 'block'; produtoError.setAttribute('aria-hidden','false'); }
            return;
        }

        // validador: CÓD deve ser único (exceto no caso de editar o próprio produto)
        function codigoExiste(codToCheck, ignoreId) {
            if (!codToCheck) return false;
            const rows = document.querySelectorAll('tr[data-id]');
            for (const row of rows) {
                const id = row.dataset.id;
                if (ignoreId && String(ignoreId) === String(id)) continue;
                const existingCod = String(row.produtoData?.cod ?? '');
                if (existingCod.trim() === String(codToCheck).trim()) return true;
            }
            return false;
        }

        const ignoreId = modoEdicao ? produtoEditandoID : null;
        if (codigoExiste(cod, ignoreId)) {
            if (produtoErrorMessage) produtoErrorMessage.textContent = 'Já existe um produto com esse código. Escolha outro código.';
            if (produtoError) { produtoError.style.display = 'block'; produtoError.setAttribute('aria-hidden','false'); }
            return;
        }

        if (modoEdicao) {
            atualizarProduto(produtoEditandoID);
        } else {
            criarProduto({
                id: ++ultimoId,
                descricao: descricao,
                cod: cod,
                valorUnitario: safeNumber(campos.valorUnitario?.value.trim() ?? ''),
                qtd: campos.qtd?.value.trim() ?? '',
                estoque: campos.estoque?.value.trim() ?? ''
            });
        }

        fecharModal();
    });

    // criar produto (DOM-safe) — adiciona uma linha (<tr>) na tabela
    function criarProduto(dadosProduto) {
        const tr = document.createElement('tr');
        tr.dataset.id = dadosProduto.id;
        tr.produtoData = dadosProduto; // armazenamento temporário

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
        // usar ícone em vez de texto
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

    function abrirEdicao(id) {
        modoEdicao = true;
        produtoEditandoID = id;

        const tr = document.querySelector(`tr[data-id="${id}"]`);
        if (!tr || !tr.produtoData) return;
        const dados = tr.produtoData;

        if (campos.cod) campos.cod.value = dados.cod ?? '';
        if (campos.valorUnitario) {
            campos.valorUnitario.value = (typeof dados.valorUnitario === 'number') ? dados.valorUnitario.toFixed(2).replace('.', ',') : (dados.valorUnitario ?? '');
        }
        campos.qtd.value = dados.qtd ?? '';
        if (campos.estoque) campos.estoque.value = dados.estoque ?? '';
        campos.descricao.value = dados.descricao ?? '';

        abrirModal();
    }

    function atualizarProduto(id) {
        const tr = document.querySelector(`tr[data-id="${id}"]`);
        if (!tr || !tr.produtoData) return;
        const dados = tr.produtoData;

        dados.descricao = campos.descricao.value.trim();
        // garantir que valorUnitario esteja armazenado como número
        dados.valorUnitario = safeNumber(campos.valorUnitario?.value.trim() ?? '');
        dados.cod = (campos.cod?.value.trim()) ?? dados.cod;
        dados.valorUnitario = (campos.valorUnitario?.value.trim()) ?? dados.valorUnitario;
        dados.qtd = campos.qtd.value.trim();
        dados.estoque = (campos.estoque?.value.trim()) ?? dados.estoque;
        

        const tds = tr.querySelectorAll('td');
        if (tds[0]) tds[0].textContent = dados.descricao;
        if (tds[1]) tds[1].textContent = dados.cod;
        if (tds[2]) tds[2].textContent = dados.estoque;
        if (tds[3]) tds[3].textContent = currencyFormatter.format(Number(dados.valorUnitario) || 0);
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
        const tr = document.querySelector(`tr[data-id="${produtoEditandoID}"]`);
        if (tr) tr.remove();
        fecharModal();
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

    // ordem esperada dentro do modal
    enableEnterAdvance(['#produtoDescricao', '#produtoQtd', '#produtoValorUnitario', '#produtoEstoque', '#produtoCod']);

});