document.addEventListener('DOMContentLoaded', () => {

    const addButton = document.querySelector('.addbotaovenda');
    const modalOverlay = document.querySelector('#modalOverlayVenda');
    const fecharModalCancelar = document.querySelector('#fecharModalVendaCancelar');

    const salvarButton = document.querySelector('#salvarVenda');
    const listaVendas = document.querySelector('#vendasTbody');

    const vendaError = document.querySelector('#vendaError');
    const vendaErrorMessage = document.querySelector('#vendaErrorMessage');

    let modoEdicao = false;
    let vendaEditandoID = null;
    let modoVisualizacao = false;
    let todasVendas = [];
    let paginaAtual = 1;
    const itensPorPagina = 10;

    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    function safeNumber(value) {
        const n = parseFloat(String(value).replace(/,/g, '.'));
        return isNaN(n) ? 0 : n;
    }

    // busca e seleção de clientes
    let todosClientes = [];
    let clienteSelecionado = null;

    const clienteSearchInput = document.querySelector('#vendaClienteSearch');
    const clientesDropdown = document.querySelector('#clientesDropdown');
    const clienteInfoDisplay = document.querySelector('#clienteInfoDisplay');
    const clienteIdInput = document.querySelector('#vendaClienteId');

    async function carregarClientes() {
        try {
            const response = await fetch('/api/clientes/');
            const data = await response.json();
            todosClientes = data.clientes || [];
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    // filtrar
    function filtrarClientes(termo) {
        const termoLower = termo.toLowerCase();
        let clientesFiltrados;

        if (termo.trim()) {
            clientesFiltrados = todosClientes.filter(c => 
                c.nome.toLowerCase().includes(termoLower) ||
                (c.cpf && c.cpf.includes(termo)) ||
                (c.email && c.email.toLowerCase().includes(termoLower))
            );
        } else {
            clientesFiltrados = todosClientes.slice(); // mostrar todos
        }

        if (clientesFiltrados.length > 0) {
            clientesDropdown.innerHTML = clientesFiltrados.map(c => `
                <div class="dropdown-item" data-cliente-id="${c.id}">
                    <div class="dropdown-item-nome">${c.nome}</div>
                    <div class="dropdown-item-info">${c.cpf || 'CPF não cadastrado'} - ${c.email || 'Email não cadastrado'}</div>
                </div>
            `).join('');
            const rect = clienteSearchInput.getBoundingClientRect();
            clientesDropdown.style.position = 'fixed';
            clientesDropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
            clientesDropdown.style.left = (rect.left + window.scrollX) + 'px';
            clientesDropdown.style.width = rect.width + 'px';
            clientesDropdown.style.zIndex = '1300';
            clientesDropdown.style.display = 'block';
        } else {
            clientesDropdown.innerHTML = '<div class="dropdown-item-empty">Nenhum cliente encontrado</div>';
            const rect = clienteSearchInput.getBoundingClientRect();
            clientesDropdown.style.position = 'fixed';
            clientesDropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
            clientesDropdown.style.left = (rect.left + window.scrollX) + 'px';
            clientesDropdown.style.width = rect.width + 'px';
            clientesDropdown.style.zIndex = '1300';
            clientesDropdown.style.display = 'block';
        }
    }

    // selecionar
    function selecionarCliente(clienteId) {
        clienteSelecionado = todosClientes.find(c => c.id === parseInt(clienteId));
        
        if (clienteSelecionado) {
            clienteIdInput.value = clienteSelecionado.id;
            clienteSearchInput.value = clienteSelecionado.nome;
            
            document.querySelector('#clienteNome').textContent = clienteSelecionado.nome;
            document.querySelector('#clienteContato').textContent = clienteSelecionado.celular || clienteSelecionado.fixo || 'Telefone não cadastrado';
            document.querySelector('#clienteEmail').textContent = clienteSelecionado.email || 'Email não cadastrado';
            
            clienteInfoDisplay.style.display = 'flex';
            clientesDropdown.style.display = 'none';
        }
    }

    if (clienteSearchInput) {
        clienteSearchInput.addEventListener('input', (e) => {
            filtrarClientes(e.target.value);
            clienteInfoDisplay.style.display = 'none';
            clienteSelecionado = null;
        });

        clienteSearchInput.addEventListener('focus', () => {
            filtrarClientes(clienteSearchInput.value);
        });
    }

    if (clientesDropdown) {
        clientesDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item && item.dataset.clienteId) {
                selecionarCliente(item.dataset.clienteId);
            }
        });
    }

    // busca e seleção de produtos
    let todosProdutos = [];
    let produtosAdicionados = [];

    const produtoSearchInput = document.querySelector('#vendaProdutoSearch');
    const produtosDropdown = document.querySelector('#produtosDropdown');
    const qtdInput = document.querySelector('#vendaItemQtd');
    const valorUnitInput = document.querySelector('#vendaItemValorUnit');
    const addProdutoBtn = document.querySelector('#adicionarProdutoVenda');
    const produtosContainer = document.querySelector('#produtosAdicionados');

    let produtoSelecionado = null;

    async function carregarProdutos() {
        try {
            const response = await fetch('/api/produtos/');
            const data = await response.json();
            todosProdutos = data.produtos || [];
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    }

    function filtrarProdutos(termo) {
        const termoLower = termo.toLowerCase();
        let produtosFiltrados;

        if (termo.trim()) {
            produtosFiltrados = todosProdutos.filter(p => 
                p.descricao.toLowerCase().includes(termoLower) ||
                p.cod.toLowerCase().includes(termoLower)
            );
        } else {
            produtosFiltrados = todosProdutos.slice(); // mostrar todos
        }

        if (produtosFiltrados.length > 0) {
            produtosDropdown.innerHTML = produtosFiltrados.map(p => `
                <div class="dropdown-item" data-produto-id="${p.id}">
                    <div class="dropdown-item-nome">${p.descricao}</div>
                    <div class="dropdown-item-info">Cód: ${p.cod} - ${currencyFormatter.format(p.valorUnitario)} - Estoque: ${p.estoque}</div>
                </div>
            `).join('');
            const rect = produtoSearchInput.getBoundingClientRect();
            produtosDropdown.style.position = 'fixed';
            produtosDropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
            produtosDropdown.style.left = (rect.left + window.scrollX) + 'px';
            produtosDropdown.style.width = rect.width + 'px';
            produtosDropdown.style.zIndex = '1300';
            produtosDropdown.style.display = 'block';
        } else {
            produtosDropdown.innerHTML = '<div class="dropdown-item-empty">Nenhum produto encontrado</div>';
            const rect = produtoSearchInput.getBoundingClientRect();
            produtosDropdown.style.position = 'fixed';
            produtosDropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
            produtosDropdown.style.left = (rect.left + window.scrollX) + 'px';
            produtosDropdown.style.width = rect.width + 'px';
            produtosDropdown.style.zIndex = '1300';
            produtosDropdown.style.display = 'block';
        }
    }

    function selecionarProduto(produtoId) {
        produtoSelecionado = todosProdutos.find(p => p.id === parseInt(produtoId));
        
        if (produtoSelecionado) {
            produtoSearchInput.value = produtoSelecionado.descricao;
            valorUnitInput.value = currencyFormatter.format(produtoSelecionado.valorUnitario);
            produtosDropdown.style.display = 'none';
        }
    }

    if (produtoSearchInput) {
        produtoSearchInput.addEventListener('input', (e) => {
            filtrarProdutos(e.target.value);
            produtoSelecionado = null;
            valorUnitInput.value = '';
        });

        produtoSearchInput.addEventListener('focus', () => {
            filtrarProdutos(produtoSearchInput.value);
        });
    }

    if (produtosDropdown) {
        produtosDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item && item.dataset.produtoId) {
                selecionarProduto(item.dataset.produtoId);
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (clienteSearchInput && !clienteSearchInput.contains(e.target) && clientesDropdown && !clientesDropdown.contains(e.target)) {
            clientesDropdown.style.display = 'none';
        }
        if (produtoSearchInput && !produtoSearchInput.contains(e.target) && produtosDropdown && !produtosDropdown.contains(e.target)) {
            produtosDropdown.style.display = 'none';
        }
    });

    if (addProdutoBtn) {
        addProdutoBtn.addEventListener('click', () => {
            if (!produtoSelecionado) {
                mostrarErro('Por favor, selecione um produto da lista');
                return;
            }

            const qtd = parseInt(qtdInput.value) || 1;
            if (qtd < 1) {
                mostrarErro('Quantidade deve ser maior que zero');
                return;
            }

            if (qtd > produtoSelecionado.estoque) {
                mostrarErro(`Estoque insuficiente. Disponível: ${produtoSelecionado.estoque} unidades`);
                return;
            }

            const produtoExistente = produtosAdicionados.find(p => p.id === produtoSelecionado.id);
            if (produtoExistente) {
                mostrarErro('Este produto já foi adicionado. Remova-o primeiro se desejar alterar.');
                return;
            }

            const produtoParaAdicionar = {
                id: produtoSelecionado.id,
                descricao: produtoSelecionado.descricao,
                cod: produtoSelecionado.cod,
                valorUnitario: produtoSelecionado.valorUnitario,
                quantidade: qtd,
                subtotal: produtoSelecionado.valorUnitario * qtd,
                estoqueDisponivel: produtoSelecionado.estoque
            };

            produtosAdicionados.push(produtoParaAdicionar);
            renderizarProdutosAdicionados();
            atualizarTotais();

            produtoSearchInput.value = '';
            qtdInput.value = '1';
            valorUnitInput.value = '';
            produtoSelecionado = null;
        });
    }

    function renderizarProdutosAdicionados() {
        if (produtosAdicionados.length === 0) {
            produtosContainer.innerHTML = '<div class="produtos-vazio">Nenhum produto adicionado</div>';
            return;
        }

        produtosContainer.innerHTML = produtosAdicionados.map((p, index) => `
            <div class="produto-adicionado" data-produto-index="${index}">
                <div class="produto-info">
                    <div class="produto-desc">${p.descricao}</div>
                    <div class="produto-detalhes">Cód: ${p.cod} | Qtd: ${p.quantidade} | Unit: ${currencyFormatter.format(p.valorUnitario)}</div>
                </div>
                <div class="produto-subtotal">${currencyFormatter.format(p.subtotal)}</div>
                <button class="btn-remover-produto" data-produto-index="${index}" style="${modoVisualizacao ? 'display: none;' : ''}">✕</button>
            </div>
        `).join('');

        if (!modoVisualizacao) {
            produtosContainer.querySelectorAll('.btn-remover-produto').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.produtoIndex);
                    produtosAdicionados.splice(index, 1);
                    renderizarProdutosAdicionados();
                    atualizarTotais();
                });
            });
        }
    }

    function atualizarTotais() {
        const totalItens = produtosAdicionados.reduce((sum, p) => sum + p.subtotal, 0);
        const descontos = 0;
        const valorFinal = totalItens - descontos;

        document.querySelector('#totalItens').textContent = currencyFormatter.format(totalItens);
        document.querySelector('#totalVenda').textContent = currencyFormatter.format(totalItens);
        document.querySelector('#descontos').textContent = currencyFormatter.format(descontos);
        document.querySelector('#valorFinal').textContent = currencyFormatter.format(valorFinal);
    }

    // gerenciamento do modal

    function mostrarErro(mensagem) {
        if (vendaErrorMessage) vendaErrorMessage.textContent = mensagem;
        if (vendaError) { 
            vendaError.style.display = 'block'; 
            vendaError.setAttribute('aria-hidden','false'); 
        }
    }

    function esconderErro() {
        if (vendaError) { 
            vendaError.style.display = 'none'; 
            vendaError.setAttribute('aria-hidden','true'); 
        }
    }

    if (addButton) {
        addButton.addEventListener('click', () => {
            modoEdicao = false;
            vendaEditandoID = null;
            modoVisualizacao = false;
            limparInputs();
            abrirModal();
        });
    }

    function abrirModal() {
        if (!modalOverlay) return;
        modalOverlay.style.display = 'flex';
        modalOverlay.setAttribute('aria-hidden','false');
        esconderErro();
        carregarClientes();
        carregarProdutos();
        
        if (modoVisualizacao) {
            desabilitarCampos();
            document.querySelector('#modalVendaTitle').textContent = 'Visualizar Venda';
            document.querySelector('#salvarVenda').style.display = 'none';
            const novoProdutoForm = document.querySelector('#novoProdutoForm');
            if (novoProdutoForm) novoProdutoForm.style.display = 'none';
        } else {
            habilitarCampos();
            document.querySelector('#modalVendaTitle').textContent = 'Nova Venda';
            document.querySelector('#salvarVenda').style.display = 'block';
            const novoProdutoForm = document.querySelector('#novoProdutoForm');
            if (novoProdutoForm) novoProdutoForm.style.display = 'flex';
        }
        
        const first = document.querySelector('#vendaClienteSearch'); 
        if (first && !modoVisualizacao) first.focus();
    }

    function fecharModal() {
        if (!modalOverlay) return;
        modalOverlay.style.display = 'none';
        modalOverlay.setAttribute('aria-hidden','true');
        modoEdicao = false; 
        vendaEditandoID = null;
        modoVisualizacao = false;
        limparInputs();
        esconderErro();
    }

    function desabilitarCampos() {
        if (clienteSearchInput) clienteSearchInput.disabled = true;
        
        if (produtoSearchInput) produtoSearchInput.disabled = true;
        if (qtdInput) qtdInput.disabled = true;
        
        if (addProdutoBtn) addProdutoBtn.style.display = 'none';
        
        const formaPagamento = document.querySelector('#formaPagamento');
        const vendaData = document.querySelector('#vendaData');
        if (formaPagamento) formaPagamento.disabled = true;
        if (vendaData) vendaData.disabled = true;
        
        const botoesRemover = document.querySelectorAll('.btn-remover-produto');
        botoesRemover.forEach(btn => btn.style.display = 'none');
    }

    function habilitarCampos() {
        if (clienteSearchInput) clienteSearchInput.disabled = false;
        
        if (produtoSearchInput) produtoSearchInput.disabled = false;
        if (qtdInput) qtdInput.disabled = false;
        
        if (addProdutoBtn) addProdutoBtn.style.display = 'block';
        
        const formaPagamento = document.querySelector('#formaPagamento');
        const vendaData = document.querySelector('#vendaData');
        if (formaPagamento) formaPagamento.disabled = false;
        if (vendaData) vendaData.disabled = false;
    }

    if (fecharModalCancelar) fecharModalCancelar.addEventListener('click', fecharModal);

    //  api de salvar venda
    if (salvarButton) {
        salvarButton.addEventListener('click', async () => {
            esconderErro();

            if (!clienteSelecionado) {
                mostrarErro('Por favor, selecione um cliente');
                return;
            }

            const vendaData = document.querySelector('#vendaData')?.value ?? '';
            if (!vendaData) {
                mostrarErro('Por favor, informe a data da venda');
                return;
            }

            if (produtosAdicionados.length === 0) {
                mostrarErro('Por favor, adicione pelo menos um produto');
                return;
            }

            const formaPagamento = document.querySelector('#formaPagamento')?.value ?? 'Dinheiro';

            const dados = {
                cliente_id: clienteSelecionado.id,
                data_venda: vendaData,
                forma_pagamento: formaPagamento,
                desconto: 0,
                status: 'Concluída',
                itens: produtosAdicionados.map(p => ({
                    produto_id: p.id,
                    quantidade: p.quantidade,
                    valor_unitario: p.valorUnitario
                }))
            };

            try {
                const response = await fetch('/api/vendas/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dados)
                });

                const result = await response.json();

                if (response.ok) {
                    fecharModal();
                    carregarVendas();
                } else {
                    if (result.detalhes && Array.isArray(result.detalhes)) {
                        mostrarErro(result.detalhes.join('<br>'));
                    } else if (result.error) {
                        mostrarErro(result.error);
                    } else {
                        mostrarErro('Erro ao salvar venda');
                    }
                }
            } catch (error) {
                console.error('Erro ao salvar venda:', error);
                mostrarErro('Erro ao comunicar com o servidor');
            }
        });
    }

    //  api de carregar vendas
    async function carregarVendas() {
        try {
            const response = await fetch('/api/vendas/');
            const data = await response.json();
            todasVendas = data.vendas || [];
            
            exibirPagina(1);
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
        }
    }

    function exibirPagina(pagina) {
        paginaAtual = pagina;

        const inicio = (pagina - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;

        const itensPagina = todasVendas.slice(inicio, fim);

        renderizarVendas(itensPagina);
        criarBotoesPaginacao();
    }

    function criarBotoesPaginacao() {
        const totalPaginas = Math.ceil(todasVendas.length / itensPorPagina);
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

    function renderizarVendas(vendas) {
        if (!listaVendas) return;

        listaVendas.innerHTML = '';

        vendas.forEach(venda => {
            const tr = document.createElement('tr');
            tr.dataset.id = venda.id;

            const tdNumero = document.createElement('td');
            tdNumero.textContent = `#${String(venda.id).padStart(4, '0')}`;

            const tdCliente = document.createElement('td');
            tdCliente.textContent = venda.cliente_nome;

            const tdData = document.createElement('td');
            tdData.textContent = formatDataDisplay(venda.data_venda);

            const tdValor = document.createElement('td');
            tdValor.textContent = currencyFormatter.format(venda.valor_final);

            const tdStatus = document.createElement('td');
            const statusWrapper = document.createElement('span');
            statusWrapper.className = 'status-wrapper';
            const statusDot = document.createElement('span');
            statusDot.className = 'status-dot ' + statusClassFor(venda.status);
            statusWrapper.appendChild(statusDot);
            const statusLabel = document.createElement('span');
            statusLabel.textContent = ' ' + venda.status;
            statusWrapper.appendChild(statusLabel);
            tdStatus.appendChild(statusWrapper);

            const tdAcoes = document.createElement('td');
            const viewBtn = document.createElement('button');
            viewBtn.type = 'button';
            viewBtn.className = 'acoes-btn view-btn';
            viewBtn.title = 'Visualizar';
            viewBtn.innerHTML = '<img src="/static/icons/eye.svg" alt="Visualizar" style="width:18px; height:18px;">';
            viewBtn.addEventListener('click', () => visualizarVenda(venda.id));

            tdAcoes.appendChild(viewBtn);

            tr.appendChild(tdNumero);
            tr.appendChild(tdCliente);
            tr.appendChild(tdData);
            tr.appendChild(tdValor);
            tr.appendChild(tdStatus);
            tr.appendChild(tdAcoes);

            listaVendas.appendChild(tr);
        });
    }

    async function visualizarVenda(vendaId) {
        try {
            const response = await fetch(`/api/vendas/${vendaId}/`);
            const data = await response.json();
            const venda = data.venda;

            modoVisualizacao = true;
            vendaEditandoID = vendaId;

            await carregarClientes();
            await carregarProdutos();

            limparInputs();

            const cliente = todosClientes.find(c => c.id === venda.cliente_id);
            if (cliente) {
                clienteSelecionado = cliente;
                clienteIdInput.value = cliente.id;
                clienteSearchInput.value = cliente.nome;
                
                document.querySelector('#clienteNome').textContent = cliente.nome;
                document.querySelector('#clienteContato').textContent = cliente.celular || cliente.fixo || 'Telefone não cadastrado';
                document.querySelector('#clienteEmail').textContent = cliente.email || 'Email não cadastrado';
                clienteInfoDisplay.style.display = 'flex';
            }

            const vendaDataInput = document.querySelector('#vendaData');
            if (vendaDataInput) {
                const dataFormatada = venda.data_venda.split('/').reverse().join('-');
                vendaDataInput.value = dataFormatada;
            }

            const formaPagamento = document.querySelector('#formaPagamento');
            if (formaPagamento) {
                formaPagamento.value = venda.forma_pagamento;
            }

            produtosAdicionados = venda.itens.map(item => ({
                id: item.produto_id,
                descricao: item.produto_descricao,
                cod: item.produto_cod || 'N/A',
                valorUnitario: item.valor_unitario,
                quantidade: item.quantidade,
                subtotal: item.subtotal,
                estoqueDisponivel: 0
            }));

            renderizarProdutosAdicionados();
            atualizarTotais();

            abrirModal();

        } catch (error) {
            console.error('Erro ao carregar detalhes da venda:', error);
            alert('Erro ao carregar detalhes da venda');
        }
    }

    function limparInputs() { 
        if (clienteSearchInput) clienteSearchInput.value = '';
        if (clienteInfoDisplay) clienteInfoDisplay.style.display = 'none';
        if (clienteIdInput) clienteIdInput.value = '';
        clienteSelecionado = null;

        if (produtoSearchInput) produtoSearchInput.value = '';
        if (qtdInput) qtdInput.value = '1';
        if (valorUnitInput) valorUnitInput.value = '';
        produtoSelecionado = null;
        produtosAdicionados = [];
        renderizarProdutosAdicionados();
        atualizarTotais();

        const vendaDataInput = document.querySelector('#vendaData');
        if (vendaDataInput) vendaDataInput.value = '';
        
        const formaPagamento = document.querySelector('#formaPagamento');
        if (formaPagamento) formaPagamento.selectedIndex = 0;
    }

    // helpers
    function formatDataDisplay(d) {
        if (!d) return '';
        if (d.indexOf('/') !== -1) return d;
        const parts = String(d).split('-');
        if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
        return d;
    }

    function statusClassFor(status) {
        const s = String(status).toLowerCase();
        if (s.includes('concl') || s.includes('pago')) return 'status-green';
        if (s.includes('pend')) return 'status-orange';
        if (s.includes('cancel') || s.includes('cancelad')) return 'status-red';
        return 'status-gray';
    }

    // busca somente ao clicar na lupa
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');
    
    function executarBusca() {
        const q = (searchInput?.value ?? '').trim().toLowerCase();
        const rows = document.querySelectorAll('#vendasTbody tr');
        rows.forEach(r => {
            const textos = Array.from(r.querySelectorAll('td')).map(td => td.textContent.toLowerCase()).join(' ');
            const matches = q === '' ? true : textos.includes(q);
            r.style.display = matches ? '' : 'none';
        });
    }
    
    if (searchIcon) searchIcon.addEventListener('click', executarBusca);

    // Inicializar ao carregar página
    renderizarProdutosAdicionados();
    atualizarTotais();
    carregarVendas();

});
