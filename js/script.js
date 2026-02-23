/* ===============================
   ELEMENTOS
=================================*/
const horas = document.getElementById('horas');
const minutos = document.getElementById('minutos');
const segundos = document.getElementById('segundos');
const dataAtual = document.getElementById('dataAtual');

const painel = document.getElementById("painelConfig");
const btnConfig = document.getElementById("btnConfig");
const boxRelogio = document.querySelector(".boxRelogio");

/* ===============================
   ESTADO GLOBAL
=================================*/
let climaAtual = ""; // ← guarda clima sem ser apagado

/* ===============================
   DIAS DA SEMANA
=================================*/
const diasSemana = [
    "Domingo","Segunda-feira","Terça-feira",
    "Quarta-feira","Quinta-feira","Sexta-feira","Sábado"
];

/* ===============================
   PREFERÊNCIAS
=================================*/
const preferenciasPadrao = {
    formato: "24",
    segundos: true,
    tema: "auto",
    cor: "#00e5ff",
    focus: {
        scale: 1.6,
        x: 0,
        y: 0
    }
};

let preferencias =
    JSON.parse(localStorage.getItem("clockPrefs"))
    || preferenciasPadrao;

function salvarPrefs(){
    localStorage.setItem("clockPrefs", JSON.stringify(preferencias));
}

/* ===============================
   ANIMAÇÃO DOS NÚMEROS
=================================*/
function animar(el, novoValor){
    if(el.textContent !== novoValor){
        el.classList.remove("tick");
        void el.offsetWidth;
        el.textContent = novoValor;
        el.classList.add("tick");
    }
}

/* ===============================
   RELÓGIO SINCRONIZADO
=================================*/
let timer = null;

function atualizarRelogio(){

    const agora = new Date();

    let hr = agora.getHours();
    let min = agora.getMinutes();
    let sec = agora.getSeconds();

    if(preferencias.formato === "12"){
        hr = hr % 12 || 12;
    }

    const dia = String(agora.getDate()).padStart(2,'0');
    const mes = String(agora.getMonth()+1).padStart(2,'0');
    const ano = agora.getFullYear();
    const diaSemana = diasSemana[agora.getDay()];

    animar(horas, String(hr).padStart(2,'0'));
    animar(minutos, String(min).padStart(2,'0'));
    animar(segundos, String(sec).padStart(2,'0'));

    /* DATA + CLIMA (corrigido) */
    dataAtual.textContent =
        `${dia}/${mes}/${ano} - ${diaSemana}${climaAtual}`;

    aplicarTemaAutomatico(agora.getHours());

    timer = setTimeout(
        atualizarRelogio,
        1000 - agora.getMilliseconds()
    );
}

/* economia CPU */
document.addEventListener("visibilitychange", () => {
    if(document.hidden){
        clearTimeout(timer);
    }else{
        atualizarRelogio();
    }
});

/* ===============================
   PAINEL CONFIG (corrigido)
=================================*/
btnConfig.addEventListener("click", e => {
    e.stopPropagation();

    if(document.body.classList.contains("focus")) return;

    painel.classList.toggle("hidden");
});

// EVITA FECHAR AO CLICAR DENTRO DO PAINEL
painel.addEventListener("click", e => {
    e.stopPropagation();
});

// FECHAR CLICANDO FORA
document.addEventListener("click", e => {
    if(painel.classList.contains("hidden")) return;

    if(
        !painel.contains(e.target) &&
        !btnConfig.contains(e.target)
    ){
        painel.classList.add("hidden");
    }
});

/* ===============================
   FORMATO
=================================*/
document.getElementById("formatoHora").onchange = e=>{
    preferencias.formato = e.target.value;
    salvarPrefs();
};

/* ===============================
   SEGUNDOS
=================================*/
document.getElementById("toggleSegundos").onchange = e=>{
    preferencias.segundos = e.target.checked;

    segundos.parentElement.style.display =
        preferencias.segundos ? "flex" : "none";

    salvarPrefs();
};

/* ===============================
   TEMA
=================================*/
function aplicarTemaAutomatico(hr){

    if(preferencias.tema === "auto"){
        document.body.classList.toggle("light", hr >=6 && hr <18);
    }
    else if(preferencias.tema === "light"){
        document.body.classList.add("light");
    }
    else{
        document.body.classList.remove("light");
    }
}

document.getElementById("tema").onchange = e=>{
    preferencias.tema = e.target.value;
    salvarPrefs();
};

/* ===============================
   COR
=================================*/
document.getElementById("corTema").oninput = e=>{
    preferencias.cor = e.target.value;

    document.documentElement.style
        .setProperty("--cor-principal", preferencias.cor);

    salvarPrefs();
};

/* ===============================
   MODO FOCO
=================================*/
function aplicarTransformFocus(){
    const f = preferencias.focus;
    boxRelogio.style.transform =
        `translate(${f.x}px, ${f.y}px) scale(${f.scale})`;
}

function sairModoFoco(){
    document.body.classList.remove("focus");
}

document.getElementById("modoFoco").onclick = ()=>{

    document.body.classList.toggle("focus");

    aplicarTransformFocus();

    if(!document.fullscreenElement){
        document.documentElement.requestFullscreen();
    }else{
        document.exitFullscreen();
    }
};

/* sair corretamente */
document.addEventListener("fullscreenchange", ()=>{
    if(!document.fullscreenElement){
        sairModoFoco();
    }
});

document.addEventListener("keydown", e=>{
    if(e.key === "Escape"){
        sairModoFoco();
    }
});

/* ===============================
   DRAG + ZOOM
=================================*/
let dragging = false;
let startX, startY;

boxRelogio.addEventListener("mousedown", e=>{
    if(!document.body.classList.contains("focus")) return;

    dragging = true;
    startX = e.clientX - preferencias.focus.x;
    startY = e.clientY - preferencias.focus.y;
});

document.addEventListener("mousemove", e=>{
    if(!dragging) return;

    preferencias.focus.x = e.clientX - startX;
    preferencias.focus.y = e.clientY - startY;

    aplicarTransformFocus();
});

document.addEventListener("mouseup", ()=>{
    if(dragging){
        dragging = false;
        salvarPrefs();
    }
});

/* zoom scroll */
boxRelogio.addEventListener("wheel", e=>{
    if(!document.body.classList.contains("focus")) return;

    e.preventDefault();

    preferencias.focus.scale += e.deltaY * -0.001;
    preferencias.focus.scale =
        Math.min(Math.max(0.8, preferencias.focus.scale), 3);

    aplicarTransformFocus();
    salvarPrefs();
});

/* ===============================
   CLIMA (corrigido)
=================================*/
async function carregarClima(){
    try{
        const pos = await new Promise(res =>
            navigator.geolocation.getCurrentPosition(res)
        );

        const {latitude, longitude} = pos.coords;

        const url =
`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

        const resp = await fetch(url);
        const data = await resp.json();

        const temp = data.current_weather.temperature;

        climaAtual = ` • ${temp}°C`;

    }catch{
        console.log("Localização não permitida.");
    }
}

/* ===============================
   APLICAR PREFS
=================================*/
function aplicarPreferencias(){

    document.documentElement.style
        .setProperty("--cor-principal", preferencias.cor);

    document.getElementById("formatoHora").value = preferencias.formato;
    document.getElementById("toggleSegundos").checked = preferencias.segundos;
    document.getElementById("tema").value = preferencias.tema;
    document.getElementById("corTema").value = preferencias.cor;

    segundos.parentElement.style.display =
        preferencias.segundos ? "flex" : "none";

    aplicarTransformFocus();
}

/* ===============================
   INIT
=================================*/
aplicarPreferencias();
atualizarRelogio();
carregarClima();