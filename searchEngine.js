const proxy = "https://corsproxy.io/?";
const apiKey = "e2f3f110298c08833d1d7b1bb43764155bb9a78796011efd0ad6cd459ffb27af"; // Coloque sua chave aqui
const apiUrl = "https://serpapi.com/search.json";
const ipLocationApiUrl = "https://ipapi.co/json/";

// Pegando elementos do HTML
const resultsContainer = document.getElementById("results");
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");

// Detectar idioma do navegador
function getUserLanguage() {
  return navigator.language || navigator.userLanguage || "pt-BR";
}

// Função para obter a cidade e país pelo IP (sem proxy)
async function getUserLocation() {
  try {
    const response = await fetch(ipLocationApiUrl, { // Removido o proxy daqui
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error("Erro na API de geolocalização:", response.status);
      return "Brazil"; // Retorna o padrão em caso de erro na API
    }

    const data = await response.json();
    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    } else {
      console.warn("Dados de localização incompletos:", data);
    }
  } catch (error) {
    console.error("Erro ao obter localização pelo IP:", error);
  }
  return "Brazil"; // Padrão caso falhe
}

// Variável para armazenar os últimos resultados da busca
let lastSearchResults = null;

// Adiciona event listeners para as abas (EXECUTAR UMA VEZ!)
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
        // Remove a classe 'active' de todos os botões
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        // Adiciona a classe 'active' ao botão clicado
        this.classList.add('active');

        const tab = this.dataset.tab;
        displayResults(lastSearchResults, tab); // Passa a aba selecionada para displayResults
    });
});



// Isso pra o Proteção de Idade
// Função para definir um cookie
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
      let date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Função para obter um cookie
function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Função para inicializar o Age Protection com base no cookie
function initializeAgeProtection() {
  let ageProtectionState = getCookie('ageProtection') || 'active'; // 'active' por padrão
  const ageProtectionToggle = document.getElementById('ageProtectionToggle');
  
  // Garante que o dataset.state está definido corretamente
  ageProtectionToggle.dataset.state = ageProtectionState;

  // Garante que o texto do botão corresponde ao estado
  updateButtonText(ageProtectionToggle);
}

// Função auxiliar para atualizar o texto do botão
function updateButtonText(button) {
  button.innerText = button.dataset.state === 'active' ? 'Ligado' : 'Desligado';
}

// Inicializa o Age Protection ao carregar a página
initializeAgeProtection();

// Adiciona event listener para o botão de Age Protection
document.getElementById('ageProtectionToggle').addEventListener('click', function() {
  let currentState = this.dataset.state;
  let newState = currentState === 'active' ? 'off' : 'active'; // Inverte o estado

  this.dataset.state = newState; // Atualiza o atributo data-state
  updateButtonText(this); // Atualiza o texto do botão

  setCookie('ageProtection', newState, 30); // Salva no cookie por 30 dias
});




// Função para buscar resultados
async function search(query, tab = 'all') {
    const location = await getUserLocation(); // Obtém localização do IP
    const language = getUserLanguage();
    const ageProtectionState = getCookie('ageProtection') || 'active';
    const safe = ageProtectionState === 'active' ? 'active' : 'off';

    let engine = 'google'; // Motor de busca padrão
    if (tab === 'images') {
        engine = 'google_images'; // Usar Google Images
    }

    const encodedQuery = encodeURIComponent(query);
    const params = new URLSearchParams({
        q: encodedQuery,
        location: location,
        hl: language,
        gl: "br",
        google_domain: "google.com.br",
        num: "100",
        start: "50",
        safe: safe,  // Use 'active' ou 'off' baseado no estado
        api_key: apiKey,
        engine: engine // Adiciona o parâmetro 'engine'
    });

    try {
        resultsContainer.innerHTML = `<p>🔍 Buscando resultados para "<b>${query}</b>" em "<b>${location}</b>" na aba "${tab}"...</p>`;
        const response = await fetch(proxy + `${apiUrl}?${params.toString()}`); // Adicionado o proxy aqui

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();

        lastSearchResults = data; // Salva os resultados
        displayResults(data, tab); // Exibe os resultados na aba selecionada
    } catch (error) {
        console.error("Erro ao buscar resultados:", error);
        resultsContainer.innerHTML = `<p>⚠️ Ocorreu um erro ao buscar os resultados.</p>
        <p><a style="color:red;"> ${error}</a></p>
        `;
    }
}

// Função para exibir os resultados na página
function displayResults(data, tab = 'all') {
  resultsContainer.innerHTML = "";

  // Esconde todas as seções
  document.querySelectorAll('.organic-section, .video-section, .faq-section, .image-section, .knowledge-graph-section').forEach(section => {
      section.classList.remove('active');
  });

  // Exibir resultados de imagens
  if (tab === 'images') {
      const imageSection = document.createElement("div");
      imageSection.classList.add("image-section");
      imageSection.innerHTML = "<h2>Imagens Relacionadas</h2>";

      // Exibir imagens inline
      if (data.inline_images) {
          data.inline_images.forEach((image) => {
              let imageItem = document.createElement("div");
              imageItem.classList.add("image-item");

              imageItem.innerHTML = `
                  <a href="${image.original}" target="_blank">
                      <img src="${image.thumbnail}" alt="${image.title}">
                  </a>
                  <p class="image-source">Fonte: ${image.source_name}</p>
              `;
              imageSection.appendChild(imageItem);
          });
      }
      // Exibir resultados de imagens (se existirem)
      else if (data.images_results) {
          data.images_results.forEach((image) => {
              let imageItem = document.createElement("div");
              imageItem.classList.add("image-item");

              imageItem.innerHTML = `
                  <a href="${image.link}" target="_blank">
                      <img src="${image.thumbnail}" alt="${image.title}">
                  </a>
              `;
              imageSection.appendChild(imageItem);
          });
      }

      resultsContainer.appendChild(imageSection);
      imageSection.classList.add('active');
  }

  // Exibir Knowledge Graph
  if (data.knowledge_graph && tab !== 'images') { // Não mostrar no tab de imagens
      const kgSection = document.createElement("div");
      kgSection.classList.add("knowledge-graph-section");
      kgSection.innerHTML = `<h2>${data.knowledge_graph.title} (${data.knowledge_graph.type})</h2>
                               <p>${data.knowledge_graph.description || ''}</p>`;

      if (data.knowledge_graph.source) {
          kgSection.innerHTML += `<p>Fonte: <a href="${data.knowledge_graph.source.link}" target="_blank">${data.knowledge_graph.source.name}</a></p>`;
      }

      resultsContainer.appendChild(kgSection);
      kgSection.classList.add('active');
  }

  // Exibir resultados orgânicos
  if (data.organic_results && tab !== 'images') {
      const organicSection = document.createElement("div");
      organicSection.classList.add("organic-section");
      organicSection.innerHTML = "<h2>Resultados da Web</h2>"; // Título para a seção orgânica

      data.organic_results.forEach((result) => {
          let resultItem = document.createElement("div");
          resultItem.classList.add("result-item");

          resultItem.innerHTML = `
              <h3><a href="${result.link}" target="_blank">${result.title}</a></h3>
              <a href="${result.link}" target="_blank" class="result-url">${result.displayed_link || result.link}</a>
              <p>${result.snippet || "Sem descrição disponível."}</p>
          `;

          organicSection.appendChild(resultItem);
      });
      resultsContainer.appendChild(organicSection);
      if (tab === 'all') organicSection.classList.add('active');
  }

  // Exibir vídeos em destaque
  if (data.inline_videos && tab !== 'images') {
      let videoSection = document.createElement("div");
      videoSection.classList.add("video-section");
      videoSection.innerHTML = `<h2>🎥 Vídeos Relacionados</h2>`;

      data.inline_videos.forEach((video) => {
          let videoItem = document.createElement("div");
          videoItem.classList.add("video-item");

          videoItem.innerHTML = `
              <a href="${video.link}" target="_blank">
                  <img src="${video.thumbnail}" alt="${video.title}">
                  <h4>${video.title}</h4>
              </a>
              <p>Canal: ${video.channel} | Duração: ${video.duration}</p>
          `;

          videoSection.appendChild(videoItem);
      });

      resultsContainer.appendChild(videoSection);
      if (tab === 'videos' || tab === 'all') videoSection.classList.add('active');
  }

  // Exibir perguntas relacionadas
  if (data.related_questions && tab !== 'images') {
      let faqSection = document.createElement("div");
      faqSection.classList.add("faq-section");
      faqSection.innerHTML = `<h2>🤔 Perguntas Relacionadas</h2>`;

      data.related_questions.forEach((question) => {
          let questionItem = document.createElement("div");
          questionItem.classList.add("question-item");

          // Cria um botão para expandir/recolher a resposta
          const toggleButton = document.createElement("button");
          toggleButton.classList.add("question-toggle");
          toggleButton.innerHTML = ">";

          const questionContent = document.createElement("div");
          questionContent.classList.add("question-content");
          questionContent.innerHTML = `
              <h4>${question.question}</h4>
              ${question.snippet ? `<p>${question.snippet}</p>` : ""}
              ${question.link ? `<p><a href="${question.link}" target="_blank">Fonte: ${question.title || question.link}</a></p>` : ""}
          `;

          questionItem.appendChild(toggleButton);
          questionItem.appendChild(questionContent);

          // Adiciona evento de clique para expandir/recolher
          toggleButton.addEventListener("click", function () {
              questionItem.classList.toggle("expanded");
              toggleButton.innerHTML = questionItem.classList.contains("expanded") ? "v" : ">";
          });

          faqSection.appendChild(questionItem);
      });

      resultsContainer.appendChild(faqSection);
      if (tab === 'all') faqSection.classList.add('active');
  }
}

// Evento de clique no botão de busca
searchBtn.addEventListener("click", function () {
    let query = searchBox.value.trim();
    if (query) {
        // Obtém a aba ativa
        const activeTab = document.querySelector('.tab-button.active').dataset.tab;
        search(query, activeTab); // Passa a aba ativa para a função de busca
    }
});

// Evento de busca ao pressionar "Enter"
searchBox.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        searchBtn.click();
    }
});


// Função para fechar o popup após 6 segundos
window.onload = function() {
    const popupnotification = document.querySelector('.popupnotification');
    const countdownBar = document.querySelector('.countdown-bar div');
    
    // Countdown para 6 segundos
    setTimeout(() => {
        popupnotification.style.display = 'none'; // Esconde o popup após 6 segundos
    }, 6000);

    // Anima a barra de countdown (de 100% para 0%)
    countdownBar.style.transition = 'width 6s linear';
    countdownBar.style.width = '0%';
};
