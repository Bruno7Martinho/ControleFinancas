const firebaseConfig = {
  apiKey: "AIzaSyAvBOFmqQNW72jcRhDI6aepu-NhRU11aa4",
  authDomain: "controle-cd5e7.firebaseapp.com",
  databaseURL: "https://controle-cd5e7-default-rtdb.firebaseio.com/",
  projectId: "controle-cd5e7",
  storageBucket: "controle-cd5e7.firebasestorage.app",
  messagingSenderId: "171252113234",
  appId: "1:171252113234:web:2a9db8bf637066062a648b",
  measurementId: "G-68CKJTENL3"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

const lancamentosRef = db.ref("lancamentos");
const investimentosRef = db.ref("investimentos");
const devedoresCartaoRef = db.ref("devedoresCartao");

let lancamentos = [];
let investimentos = [];
let devedoresCartao = [];

let chartResumo;
let chartCategorias;
let chartPagamentos;
let chartInvestimentos;

const formatarMoeda = valor => {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
};

const hoje = new Date();

document.getElementById("data").valueAsDate = hoje;
document.getElementById("dataInvestimento").valueAsDate = hoje;
document.getElementById("dataDividaCartao").valueAsDate = hoje;

document.getElementById("filtroMes").value = String(hoje.getMonth() + 1).padStart(2, "0");
document.getElementById("filtroAno").value = String(hoje.getFullYear());

document.getElementById("filtroMes").addEventListener("change", renderizarTudo);
document.getElementById("filtroAno").addEventListener("change", renderizarTudo);

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.page).classList.add("active");
  });
});

document.getElementById("formLancamento").addEventListener("submit", async e => {
  e.preventDefault();

  const novoLancamento = {
    descricao: document.getElementById("descricao").value.trim(),
    tipo: document.getElementById("tipo").value,
    pagamento: document.getElementById("pagamento").value,
    categoria: document.getElementById("categoria").value,
    valor: Number(document.getElementById("valor").value),
    data: document.getElementById("data").value,
    criadoEm: new Date().toISOString()
  };

  await lancamentosRef.push(novoLancamento);

  e.target.reset();
  document.getElementById("data").valueAsDate = new Date();
});

document.getElementById("formInvestimento").addEventListener("submit", async e => {
  e.preventDefault();

  const novoInvestimento = {
    nome: document.getElementById("nomeInvestimento").value.trim(),
    tipo: document.getElementById("tipoInvestimento").value,
    valor: Number(document.getElementById("valorInvestimento").value),
    data: document.getElementById("dataInvestimento").value,
    criadoEm: new Date().toISOString()
  };

  await investimentosRef.push(novoInvestimento);

  e.target.reset();
  document.getElementById("dataInvestimento").valueAsDate = new Date();
});

document.getElementById("formDividaCartao").addEventListener("submit", async e => {
  e.preventDefault();

  const novaDivida = {
    pessoa: document.getElementById("pessoaDividaCartao").value.trim(),
    descricao: document.getElementById("descricaoDividaCartao").value.trim(),
    valor: Number(document.getElementById("valorDividaCartao").value),
    data: document.getElementById("dataDividaCartao").value,
    criadoEm: new Date().toISOString()
  };

  await devedoresCartaoRef.push(novaDivida);

  e.target.reset();
  document.getElementById("dataDividaCartao").valueAsDate = new Date();
});

lancamentosRef.on("value", snapshot => {
  lancamentos = [];

  snapshot.forEach(child => {
    lancamentos.push({
      id: child.key,
      ...child.val()
    });
  });

  lancamentos.sort((a, b) => {
    if (!a.data || !b.data) return 0;
    return b.data.localeCompare(a.data);
  });

  renderizarTudo();
});

investimentosRef.on("value", snapshot => {
  investimentos = [];

  snapshot.forEach(child => {
    investimentos.push({
      id: child.key,
      ...child.val()
    });
  });

  investimentos.sort((a, b) => {
    if (!a.data || !b.data) return 0;
    return b.data.localeCompare(a.data);
  });

  renderizarTudo();
});

devedoresCartaoRef.on("value", snapshot => {
  devedoresCartao = [];

  snapshot.forEach(child => {
    devedoresCartao.push({
      id: child.key,
      ...child.val()
    });
  });

  devedoresCartao.sort((a, b) => {
    if (!a.data || !b.data) return 0;
    return b.data.localeCompare(a.data);
  });

  renderizarTudo();
});

function obterLancamentosFiltrados() {
  const mes = document.getElementById("filtroMes").value;
  const ano = document.getElementById("filtroAno").value;

  return lancamentos.filter(item => {
    if (!item.data) return false;

    const partes = item.data.split("-");
    const anoItem = partes[0];
    const mesItem = partes[1];

    return mesItem === mes && anoItem === ano;
  });
}

function obterInvestimentosFiltrados() {
  const mes = document.getElementById("filtroMes").value;
  const ano = document.getElementById("filtroAno").value;

  return investimentos.filter(item => {
    if (!item.data) return false;

    const partes = item.data.split("-");
    const anoItem = partes[0];
    const mesItem = partes[1];

    return mesItem === mes && anoItem === ano;
  });
}

function obterDevedoresCartaoFiltrados() {
  const mes = document.getElementById("filtroMes").value;
  const ano = document.getElementById("filtroAno").value;

  return devedoresCartao.filter(item => {
    if (!item.data) return false;

    const partes = item.data.split("-");
    const anoItem = partes[0];
    const mesItem = partes[1];

    return mesItem === mes && anoItem === ano;
  });
}

function renderizarTudo() {
  atualizarResumo();
  renderizarLancamentos();
  renderizarCartoes();
  renderizarDevedoresCartao();
  renderizarInvestimentos();
  gerarGraficos();
}

function atualizarResumo() {
  const lancamentosFiltrados = obterLancamentosFiltrados();
  const investimentosFiltrados = obterInvestimentosFiltrados();

  const entradas = lancamentosFiltrados
    .filter(item => item.tipo === "entrada")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const gastos = lancamentosFiltrados
    .filter(item => item.tipo === "gasto")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const investido = investimentosFiltrados
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const saldo = entradas - gastos - investido;

  document.getElementById("totalEntradas").textContent = formatarMoeda(entradas);
  document.getElementById("totalGastos").textContent = formatarMoeda(gastos);
  document.getElementById("saldoAtual").textContent = formatarMoeda(saldo);
  document.getElementById("totalInvestido").textContent = formatarMoeda(investido);
}

function renderizarLancamentos() {
  const lista = document.getElementById("listaLancamentos");
  const lancamentosFiltrados = obterLancamentosFiltrados();

  lista.innerHTML = "";

  if (lancamentosFiltrados.length === 0) {
    lista.innerHTML = `<p>Nenhum lançamento cadastrado neste mês.</p>`;
    return;
  }

  lancamentosFiltrados.forEach(item => {
    lista.innerHTML += `
      <div class="list-item">
        <div class="item-info">
          <h3>${item.descricao}</h3>
          <p>${item.categoria} • ${item.pagamento} • ${formatarData(item.data)}</p>
        </div>

        <div class="item-value">
          <strong class="${item.tipo}">
            ${item.tipo === "entrada" ? "+" : "-"} ${formatarMoeda(item.valor)}
          </strong>
          <button onclick="removerLancamento('${item.id}')">Excluir</button>
        </div>
      </div>
    `;
  });
}

function renderizarCartoes() {
  const lista = document.getElementById("listaCartoes");
  const lancamentosFiltrados = obterLancamentosFiltrados();

  lista.innerHTML = "";

  const gastosCartao = lancamentosFiltrados.filter(item =>
    item.tipo === "gasto" &&
    (item.pagamento === "credito" || item.pagamento === "debito")
  );

  if (gastosCartao.length === 0) {
    lista.innerHTML = `<p>Nenhum gasto com cartão neste mês.</p>`;
    return;
  }

  gastosCartao.forEach(item => {
    lista.innerHTML += `
      <div class="list-item">
        <div class="item-info">
          <h3>${item.descricao}</h3>
          <p>${item.pagamento} • ${item.categoria} • ${formatarData(item.data)}</p>
        </div>

        <div class="item-value">
          <strong class="gasto">- ${formatarMoeda(item.valor)}</strong>
        </div>
      </div>
    `;
  });
}

function renderizarDevedoresCartao() {
  const lista = document.getElementById("listaDevedoresCartao");
  const totalGeral = document.getElementById("totalDevedoresCartao");
  const dividasFiltradas = obterDevedoresCartaoFiltrados();

  lista.innerHTML = "";

  const total = dividasFiltradas
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  totalGeral.textContent = formatarMoeda(total);

  if (dividasFiltradas.length === 0) {
    lista.innerHTML = `<p>Nenhuma conta de cartao cadastrada neste mes.</p>`;
    return;
  }

  const pessoas = dividasFiltradas.reduce((grupos, item) => {
    const pessoa = item.pessoa || "Sem nome";

    if (!grupos[pessoa]) {
      grupos[pessoa] = {
        total: 0,
        contas: []
      };
    }

    grupos[pessoa].total += Number(item.valor || 0);
    grupos[pessoa].contas.push(item);

    return grupos;
  }, {});

  Object.entries(pessoas)
    .sort(([, pessoaA], [, pessoaB]) => pessoaB.total - pessoaA.total)
    .forEach(([pessoa, dados]) => {
      const contas = dados.contas.map(item => `
        <div class="sub-list-item">
          <div class="item-info">
            <h3>${item.descricao}</h3>
            <p>${formatarData(item.data)}</p>
          </div>

          <div class="item-value">
            <strong>${formatarMoeda(item.valor)}</strong>
            <button onclick="removerDividaCartao('${item.id}')">Excluir</button>
          </div>
        </div>
      `).join("");

      lista.innerHTML += `
        <div class="person-card">
          <div class="person-card-header">
            <div class="item-info">
              <h3>${pessoa}</h3>
              <p>${dados.contas.length} conta(s)</p>
            </div>

            <strong>${formatarMoeda(dados.total)}</strong>
          </div>

          <div class="sub-list">
            ${contas}
          </div>
        </div>
      `;
    });
}

function renderizarInvestimentos() {
  const lista = document.getElementById("listaInvestimentos");
  const investimentosFiltrados = obterInvestimentosFiltrados();

  lista.innerHTML = "";

  if (investimentosFiltrados.length === 0) {
    lista.innerHTML = `<p>Nenhum investimento cadastrado neste mês.</p>`;
    return;
  }

  investimentosFiltrados.forEach(item => {
    lista.innerHTML += `
      <div class="list-item">
        <div class="item-info">
          <h3>${item.nome}</h3>
          <p>${item.tipo} • ${formatarData(item.data)}</p>
        </div>

        <div class="item-value">
          <strong>${formatarMoeda(item.valor)}</strong>
          <button onclick="removerInvestimento('${item.id}')">Excluir</button>
        </div>
      </div>
    `;
  });
}

async function removerLancamento(id) {
  await lancamentosRef.child(id).remove();
}

async function removerInvestimento(id) {
  await investimentosRef.child(id).remove();
}

async function removerDividaCartao(id) {
  await devedoresCartaoRef.child(id).remove();
}

function gerarGraficos() {
  gerarChartResumo();
  gerarChartCategorias();
  gerarChartPagamentos();
  gerarChartInvestimentos();
}

function gerarChartResumo() {
  const lancamentosFiltrados = obterLancamentosFiltrados();
  const investimentosFiltrados = obterInvestimentosFiltrados();

  const entradas = lancamentosFiltrados
    .filter(item => item.tipo === "entrada")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const gastos = lancamentosFiltrados
    .filter(item => item.tipo === "gasto")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const investido = investimentosFiltrados
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  if (chartResumo) chartResumo.destroy();

  chartResumo = new Chart(document.getElementById("chartResumo"), {
    type: "bar",
    data: {
      labels: ["Entradas", "Gastos", "Investimentos"],
      datasets: [{
        label: "Valor em R$",
        data: [entradas, gastos, investido],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function gerarChartCategorias() {
  const lancamentosFiltrados = obterLancamentosFiltrados();
  const gastos = lancamentosFiltrados.filter(item => item.tipo === "gasto");
  const categorias = {};

  gastos.forEach(item => {
    categorias[item.categoria] = (categorias[item.categoria] || 0) + Number(item.valor || 0);
  });

  if (chartCategorias) chartCategorias.destroy();

  chartCategorias = new Chart(document.getElementById("chartCategorias"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias)
      }]
    },
    options: {
      responsive: true
    }
  });
}

function gerarChartPagamentos() {
  const lancamentosFiltrados = obterLancamentosFiltrados();
  const gastos = lancamentosFiltrados.filter(item => item.tipo === "gasto");
  const pagamentos = {};

  gastos.forEach(item => {
    pagamentos[item.pagamento] = (pagamentos[item.pagamento] || 0) + Number(item.valor || 0);
  });

  if (chartPagamentos) chartPagamentos.destroy();

  chartPagamentos = new Chart(document.getElementById("chartPagamentos"), {
    type: "bar",
    data: {
      labels: Object.keys(pagamentos),
      datasets: [{
        label: "Gastos",
        data: Object.values(pagamentos),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function gerarChartInvestimentos() {
  const investimentosFiltrados = obterInvestimentosFiltrados();
  const tipos = {};

  investimentosFiltrados.forEach(item => {
    tipos[item.tipo] = (tipos[item.tipo] || 0) + Number(item.valor || 0);
  });

  if (chartInvestimentos) chartInvestimentos.destroy();

  chartInvestimentos = new Chart(document.getElementById("chartInvestimentos"), {
    type: "doughnut",
    data: {
      labels: Object.keys(tipos),
      datasets: [{
        data: Object.values(tipos)
      }]
    },
    options: {
      responsive: true
    }
  });
}

function formatarData(data) {
  if (!data) return "";

  const partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
