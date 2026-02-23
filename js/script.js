const horas = document.getElementById('horas');
const minutos = document.getElementById('minutos');
const segundos = document.getElementById('segundos');
const dataAtual = document.getElementById('dataAtual');

const diasSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
];

function atualizarRelogio() {

    const agora = new Date();

    let hr = agora.getHours();
    let min = agora.getMinutes();
    let sec = agora.getSeconds();

    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    const diaSemana = diasSemana[agora.getDay()];

    horas.textContent = hr.toString().padStart(2, '0');
    minutos.textContent = min.toString().padStart(2, '0');
    segundos.textContent = sec.toString().padStart(2, '0');

    dataAtual.textContent = `${dia}/${mes}/${ano} - ${diaSemana}`;
}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();

 // Registro do Service Worker para suporte offline
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
        .then(() => console.log("Service Worker registrado"));
}