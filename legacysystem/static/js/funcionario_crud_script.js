document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "/api/funcionarios/";  // Para itens individuais
  const API_LIST = "/api/funcionarios/list/";  // Restaurado para list (o que estava funcionando antes)
  const API_CREATE = "/api/funcionarios/create/";  // Mantido

  // DOM
  const listaEl = document.querySelector(".funcionarios-lista");
  const modal = document.getElementById("modalOverlay");

  const btnAdd = document.querySelector(".addbotaoFuncionario");
  const btnSalvar = document.getElementById("salvarFuncionario");
  const btnExcluir = document.getElementById("excluirFuncionario");
  const btnCancelar = document.getElementById("fecharModalCancelar");

  // Campos (com fixo adicionado)
  const campos = {
    nome: document.getElementById("nome"),
    email: document.getElementById("email"),
    celular: document.getElementById("celular"),
    fixo: document.getElementById("fixo"),  // Telefone fixo
    cod: document.getElementById("cod"),
    endereco: document.getElementById("endereco"),
    cep: document.getElementById("cep"),
    numero: document.getElementById("numero"),
    uf: document.getElementById("uf"),
    bairro: document.getElementById("bairro"),
    cidade: document.getElementById("cidade"),
    complemento: document.getElementById("complemento"),
    rg: document.getElementById("rg"),
    cpf: document.getElementById("cpf"),
    id: document.getElementById("funcionarioID"),
    senha: document.getElementById("senha"),
    cargo: document.getElementById("cargo"),
    nivel_acesso: document.getElementById("nivel_acesso")
  };

  let modoEdicao = false;
  let funcionarioEditandoID = null;

  // CSRF + fetch
  function getCsrfToken() {
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

  // Carregar lista (usando API_LIST restaurado)
  async function carregarFuncionarios() {
    try {
      const data = await fetchJson(API_LIST);
      listaEl.innerHTML = "";
      const list = data.funcionarios || [];
      list.forEach(f => adicionarFuncionarioNaLista(f));
    } catch (err) {
      console.error("Erro ao carregar funcionários:", err);
      listaEl.innerHTML = "<p>Erro ao carregar funcionários.</p>";
    }
  }

  // Criar card (sem celular na exibição)
  function criarCard(func) {
    const item = document.createElement("div");
    item.className = "info-item";
    item.setAttribute("data-id", func.id);
    item.dados = func;

    item.innerHTML = `
      <span class="label">${func.nome}</span>
      <span class="value-center">#${func.cod ?? ""}</span>
      <img src="/static/icons/editar_icon.svg" class="editar-icon" alt="Editar">
    `;

    const editar = item.querySelector(".editar-icon");
    if (editar) {
      editar.addEventListener("click", (ev) => {
        ev.stopPropagation();
        abrirEdicao(func.id);
      });
    }

    return item;
  }

  function adicionarFuncionarioNaLista(func) {
    const existing = listaEl.querySelector(`[data-id="${func.id}"]`);
    if (existing) {
      existing.dados = func;
      existing.querySelector(".label").innerText = func.nome || "";
      const center = existing.querySelector(".value-center");
      if (center) center.innerText = "#" + (func.cod ?? "");
      return;
    }
    const card = criarCard(func);
    listaEl.appendChild(card);  // Append para ordem crescente
  }

  // Modal e formulário
  function abrirModal() { if (modal) modal.style.display = "flex"; }
  function fecharModal() { 
    if (modal) modal.style.display = "none"; 
    modoEdicao = false;
    funcionarioEditandoID = null;
    limparFormulario();
  }

  function limparFormulario() {
    Object.values(campos).forEach(c => { if (c) c.value = ""; });
  }

  function preencherFormulario(func) {
    if (!func) return;
    campos.id.value = func.id || "";
    campos.nome.value = func.nome || "";
    campos.email.value = func.email || "";
    campos.celular.value = func.celular || "";
    campos.fixo.value = func.fixo || "";
    campos.cod.value = func.cod || "";
    campos.endereco.value = func.endereco || "";
    campos.cep.value = func.cep || "";
    campos.numero.value = func.numero || "";
    campos.uf.value = func.uf || "";
    campos.bairro.value = func.bairro || "";
    campos.cidade.value = func.cidade || "";
    campos.complemento.value = func.complemento || "";
    campos.rg.value = func.rg || "";
    campos.cpf.value = func.cpf || "";
    campos.senha.value = func.senha || "";
    campos.cargo.value = func.cargo || "";
    campos.nivel_acesso.value = func.nivel_acesso || "";
  }

  function abrirEdicao(id) {
    modoEdicao = true;
    funcionarioEditandoID = id;
    const item = listaEl.querySelector(`[data-id="${id}"]`);
    const dados = item.dados;
    preencherFormulario(dados);
    campos.cod.readOnly = true;
    abrirModal();
  }

  // Validações (com fixo)
  function permitirSomenteNumeros(inputEl, limite = null) {
    if (!inputEl) return;
    inputEl.addEventListener("input", () => {
      inputEl.value = inputEl.value.replace(/\D/g, "");
      if (limite) inputEl.value = inputEl.value.slice(0, limite);
    });
  }

  function permitirSomenteLetrasESpaces(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", () => {
      inputEl.value = inputEl.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "");
    });
  }

  permitirSomenteLetrasESpaces(campos.nome);
  permitirSomenteNumeros(campos.celular, 11);
  permitirSomenteNumeros(campos.fixo, 10);  // Ajuste o limite se precisar
  permitirSomenteNumeros(campos.cep);
  permitirSomenteNumeros(campos.numero);
  permitirSomenteNumeros(campos.cpf, 11);
  permitirSomenteNumeros(campos.rg, 9);

  // Coletar dados (com fixo)
  function coletarDadosDoFormulario() {
    return {
        nome: campos.nome.value.trim(),
        email: campos.email.value.trim(),
        celular: campos.celular.value.trim(),
        fixo: campos.fixo.value.trim(),
        cod: campos.cod.value.trim() ? Number(campos.cod.value.trim()) : gerarCodAutomatico(),
        endereco: campos.endereco.value.trim(),
        cep: campos.cep.value.trim(),
        numero: campos.numero.value.trim(),
        uf: campos.uf.value.trim(),
        bairro: campos.bairro.value.trim(),
        cidade: campos.cidade.value.trim(),
        complemento: campos.complemento.value.trim(),
        rg: campos.rg.value.trim(),
        cpf: campos.cpf.value.trim(),
        senha: campos.senha.value,
        cargo: campos.cargo.value.trim(),
        nivel_acesso: campos.nivel_acesso.value || null  // string mesmo, não número
    };
}

  // CRUD
  function criarFuncionarioAPI() {
    const payload = coletarDadosDoFormulario();
    fetchJson(API_CREATE, { method: "POST", body: JSON.stringify(payload) })
      .then(data => {
        adicionarFuncionarioNaLista(data.funcionario);
      })
      .catch(err => {
        console.error("Erro ao criar funcionário:", err);
        alert("Erro ao criar funcionário.");
      });
  }

  function atualizarFuncionarioAPI(id) {
    const payload = coletarDadosDoFormulario();
    fetchJson(API_BASE + id + "/", { method: "PUT", body: JSON.stringify(payload) })
      .then(data => {
        const item = listaEl.querySelector(`[data-id="${id}"]`);
        if (item) {
          item.dados = data.funcionario;
          item.querySelector(".label").innerText = data.funcionario.nome;
          const center = item.querySelector(".value-center");
          if (center) center.innerText = "#" + data.funcionario.cod;
        }
      })
      .catch(err => {
        console.error("Erro ao atualizar funcionário:", err);
        alert("Erro ao atualizar funcionário.");
      });
  }

  async function excluirFuncionario() {
    try {
      const id = campos.id.value;
      if (!id) { alert("Selecione um funcionário!"); return; }
      if (!confirm("Tem certeza que deseja excluir?")) return;

      await fetchJson(API_BASE + id + "/delete/", { method: "DELETE" });
      const el = listaEl.querySelector(`[data-id="${id}"]`);
      if (el) el.remove();
      fecharModal();
    } catch (err) {
      console.error("Erro ao excluir funcionário:", err);
      alert("Erro ao excluir funcionário.");
    }
  }

  function gerarCodAutomatico() {
    const itens = listaEl.querySelectorAll(".info-item");
    if (!itens.length) return 1;
    let maior = 0;
    itens.forEach(i => {
      const c = parseInt(i.dados?.cod);
      if (!isNaN(c) && c > maior) maior = c;
    });
    return maior + 1;
  }

  // Eventos
  btnAdd.addEventListener("click", () => {
    modoEdicao = false;
    funcionarioEditandoID = null;
    limparFormulario();
    campos.cod.value = gerarCodAutomatico();
    campos.cod.readOnly = true;
    abrirModal();
  });

  btnSalvar.addEventListener("click", (ev) => {
    ev.preventDefault();
    const nome = campos.nome.value.trim();
    if (!nome) { alert("Preencha o nome!"); return; }
    if (modoEdicao) {
      atualizarFuncionarioAPI(funcionarioEditandoID);
    } else {
      criarFuncionarioAPI();
    }
    fecharModal();
  });

  btnExcluir.addEventListener("click", excluirFuncionario);
  btnCancelar.addEventListener("click", fecharModal);

  carregarFuncionarios();

});