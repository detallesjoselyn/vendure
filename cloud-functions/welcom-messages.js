'use strict';

let responses = [
    {w: "🙋🏻‍♀️Buen día bella",o:"espero te encuentres súper bien y estés teniendo un día increíble, cuéntame ¿cómo puedo ayudarte? ☺️💁🏻‍♀️"},
    {w: "¡Bienvenid@ a Detalles Jocelyn! 🌸🤩 ",o:`En nuestro grupo y página podrás encontrar una extensa variedad de artículos para tus hermosas creaciones. 😍 ||Checa nuestra dinámica de compra en el siguiente link: https://web.facebook.com/groups/432717543952780/announcements o elige alguna de nuestras opciones del menú: 😉☑️`},
    {w: "😁🌟¡Bienvenida a Detalles Jocelyn! Hermosa",o:"me alegra saber que ya eres parte de esta comunidad de creadoras; ¿Estás lista para comprar? 🤩¿Cómo podemos ayudarte? 🥰🤔"},
    {w: "🙌🏼❤️ ¡Bienvenid@ a Detalles Jocelyn! 🌸 Bella",o:"estamos felices de que estés aquí en este espacio donde podemos resolver todas tus dudas, ¿en qué puedo ayudarte? 🤩"},
    {w: "👋🏼 Hola hermosa",o:`buen día ☀, soy el asistente virtual de Detalles Jocelyn y estoy a tu disposición para atenderte en tus compras y en las dudas que puedas tener. ||Dime ¿en qué puedo ayudarte? 😁`},
    {w: "✨🌟¡Hola bella, buen día! Soy JocelynBot 🙋🏻‍♀️ y estoy aquí para ayudarte en tus consultas de los servicios de Detalles Jocelyn. ||Cuéntame", o: ` ¿en qué puedo ayudarte? Selecciona alguna de las siguientes opciones 😉☑️`}
];

function getRamdomMessage(name){
    let number = Math.round(Math.random() * (responses.length -1));
    return responses[number].w + name + responses[number].o;
}
module.exports = {
    getRamdomMessage
};