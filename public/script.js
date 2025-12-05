// ----------------- Chatbot -----------------
const botaoChat = document.getElementById("btnAbrirChatbot");
const dfMessenger = document.querySelector("df-messenger");


botaoChat.addEventListener("click", () => {
    dfMessenger.classList.toggle("aberto");
    dfMessenger.setAttribute("opened", dfMessenger.classList.contains("aberto"));
});
// ----------------- Variáveis globais -----------------
let stream = null;
let modelosCarregados = false;

// Elementos DOM
document.addEventListener("DOMContentLoaded", () => {
const abrirIA = document.getElementById('abrirIA');
const cameraModal = document.getElementById('cameraModal');
const fecharModal = document.getElementById('fecharModal');
const video = document.getElementById('video');
const tirarFoto = document.getElementById('tirarFoto');
const fotoCanvas = document.getElementById('fotoCanvas');
const modalStatus = document.getElementById('modalStatus');

// ----------------- Carregar modelos -----------------
async function carregarModelos() {
  if (modelosCarregados) return;
  modalStatus.innerText = 'Carregando modelos...';
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    modelosCarregados = true;
    modalStatus.innerText = 'Modelos carregados.';
  } catch (err) {
    console.error('Erro carregando modelos:', err);
    modalStatus.innerText = 'Erro ao carregar modelos. Veja console.';
  }
}
// ----------------- Abrir modal e ativar câmera -----------------
  abrirIA.addEventListener('click', async () => {
    cameraModal.classList.add('open');
    cameraModal.setAttribute('aria-hidden', 'false');
    modalStatus.innerText = 'Carregando...';
    await carregarModelos();

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 } });
      video.srcObject = stream;
      await video.play();
      modalStatus.innerText = 'Câmera ativa. Posicione seu rosto e clique em 📸';
    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      modalStatus.innerText = 'Não foi possível acessar a câmera.';
    }
  });

  // ----------------- Fechar modal e parar câmera -----------------
  fecharModal.addEventListener('click', () => {
    pararCamera();
    cameraModal.classList.remove('open');
    cameraModal.setAttribute('aria-hidden', 'true');
    modalStatus.innerText = 'Aguardando...';
  });


// ----------------- Parar câmera -----------------
function pararCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  video.srcObject = null;
}

// ----------------- Tirar foto, enviar para backend e detectar emoção -----------------
tirarFoto.addEventListener('click', async () => {
  if (!video || video.readyState < 2) {
    modalStatus.innerText = 'Vídeo não pronto. Tente novamente.';
    return;
  }

  // Desenha no canvas
  fotoCanvas.width = video.videoWidth || 640;
  fotoCanvas.height = video.videoHeight || 480;
  const ctx = fotoCanvas.getContext('2d');
  ctx.drawImage(video, 0, 0, fotoCanvas.width, fotoCanvas.height);

  modalStatus.innerText = 'Enviando foto para processamento...';

  // Para a câmera e fecha modal
  pararCamera();
  cameraModal.style.display = 'none';
  cameraModal.setAttribute('aria-hidden', 'true');

  // Converte canvas em blob para envio
  fotoCanvas.toBlob(async (blob) => {
    if (!blob) {
      modalStatus.innerText = 'Erro ao capturar a foto.';
      return;
    }

    const formData = new FormData();
    formData.append('foto', blob, 'foto.png');

    try {
      const response = await fetch(`${window.location.origin}/processar-foto`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.facesEncontradas === 0) {
        modalStatus.innerText = 'Nenhuma face detectada na foto.';
        return;
      }

      // Salva imagem no sessionStorage para página de resultado
      const dataUrl = fotoCanvas.toDataURL('image/png');
      sessionStorage.setItem('ultimaFoto', dataUrl);

      // Redireciona para a página resultado com emoção e confiança
      const emocao = data.emocao || 'neutral';
      const confianca = data.confianca || 0;
      window.location.href = `resultado.html?emocao=${encodeURIComponent(emocao)}&conf=${encodeURIComponent(confianca)}`;

    } catch (err) {
      modalStatus.innerText = 'Erro ao enviar foto para o servidor.';
      console.error('Erro fetch:', err);
    }
  }, 'image/png');
});
});

    // Inicialização
    (function(){
      // Estado do tema (claro por padrão)
      const body = document.body;
      const themeToggle = document.getElementById('themeToggle');

      // Carrega preferência do usuário (se existir)
      try {
        const saved = localStorage.getItem('ov_theme');
        if(saved === 'dark'){ body.classList.add('dark'); themeToggle.setAttribute('aria-pressed','true'); }
      } catch(e){ /* localStorage pode falhar em alguns contextos */ }

      themeToggle.addEventListener('click', function(){
        const isDark = body.classList.toggle('dark');
        themeToggle.setAttribute('aria-pressed', String(isDark));
        try { localStorage.setItem('ov_theme', isDark ? 'dark' : 'light'); } catch(e){}
      });


      // enter envia mensagem
      document.getElementById('chatInputField').addEventListener('keydown', function(e){
        if(e.key === 'Enter'){ document.getElementById('sendChat').click(); }
      });

      // Preenche ano atual no rodapé
      const yearSpan = document.getElementById('yearSpan');
      const now = new Date();
      yearSpan.textContent = now.getFullYear();

      // Acessibilidade: atalhos de teclado
      window.addEventListener('keydown', function(e){
        if(e.key === 'c' && (e.ctrlKey || e.metaKey)){
          // Ctrl/Cmd + C abre chatbot — atalho para facilitar testes
          e.preventDefault();
          abrirChatbot();
        }
        if(e.key === 't' && (e.ctrlKey || e.metaKey)){
          // Ctrl/Cmd + T alterna tema
          e.preventDefault();
          themeToggle.click();
        }
      });

      // Funções auxiliares
      function appendChat(sender, text){
        const history = document.querySelector('.chat-history');
        const bubble = document.createElement('div');
        bubble.style.marginTop = '.5rem';
        bubble.innerHTML = '<strong>'+escapeHtml(sender)+':</strong> '+escapeHtml(text);
        history.appendChild(bubble);
        history.scrollTop = history.scrollHeight;
        // anunciar para leitores de tela
        history.setAttribute('aria-live','polite');
      }

      function escapeHtml(s){
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }


    // Controla chat externamente
    function toggleChat(show){
      const panel = document.getElementById('chatPanel');
      if(typeof show === 'boolean'){
        if(show){ panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); document.getElementById('chatInputField').focus(); }
        else { panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); }
      } else {
        panel.classList.toggle('open');
      }
    }

    // Pequena melhoria: navegabilidade por hash (suaviza foco)
    (function(){
      if(location.hash){
        const id = location.hash.slice(1);
        const el = document.getElementById(id);
        if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
      }
      // links âncora com comportamento suave
      document.querySelectorAll('a[href^="#"]').forEach(a=>{
        a.addEventListener('click', function(e){
          const href = this.getAttribute('href');
          if(href.length > 1){
            e.preventDefault();
            const el = document.querySelector(href);
            if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); el.focus({preventScroll:true}); }
            history.replaceState(null,'', href);
          }
        });
      });
            });
                  });
