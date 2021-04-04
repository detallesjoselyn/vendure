'use strict';

const env = require('./env');

let menuElements = [
    {option: 'Hacer un pedido 🛒',
        response: `Revisa los álbumes de fotos de productos fijos 🛍️en nuestro grupo de Facebook, identifica su código y haz una lista de todo lo que quieras encargar.
    ||Elige la opción “📦Hacer pedido” en este chat, ahí te indicaremos los pasos y el formato que debes seguir para enviarnos tu lista de productos.
    ||Una vez que tengamos tu listado 🗒️, lo revisaremos contra inventario y te enviaremos un mensaje confirmando los productos que tenemos en existencia, así como el costo total de tu orden.
        `},
    {option: 'Ver productos 🛍️',
        response: `Para revisar los productos de venta fija puedes hacerlo a través de los álbumes de fotos de nuestro grupo de Facebook, si aún no te unes te dejo el link para que lo hagas 👉🏽 Detalles Jocelyn https://www.facebook.com/groups/432717543952780/ .
    ||Los álbumes de venta fija siempre llevan el nombre de la familia + “venta fija”, por ejemplo: 
    ||Diademas venta fija
    ||Listones venta fija`},
    
    {option: 'Paqueterías 📮',
        response: `📦 Paqueterías nacionales con 5kg de peso volumétrico:
    FedEx 👉🏽 $190
    Estafeta 👉🏽 $185
    RedPack 👉🏽 $175
    Correos 👉🏽 $85 sin garantía de tiempo de entrega||🗒️ El costo puede cambiar por exceso de peso o zona extendida.||🗒️ En envíos internacionales trabajamos con UPS y se cotiza aparte.
    `},

    {option: 'Quiero apartar 🤲🏼',
        response: `Para hacer un apartado, debes liquidar tu orden de productos, y nosotros dejamos tu material en bodega hasta que juntes más productos y así aproveches el costo del envío en un solo paquete 🌟. Te explico el proceso:
    ||1 . Cuando hagas tu pedido a través de este chat, se generará tu orden y el costo de tu nota, y te enviaremos el link de la asesora que dará seguimiento a tu pedido 😉
    ||2. Paga tu nota 🗒️ y envíale a la asesora el comprobante de pago, mencionando que quieres que tu material quede en apartado
    ||🚨El material solo puede apartarse por 21 días, en ese tiempo debes solicitar el envío. Si después de este periodo no solicitas tu material, lo pondremos nuevamente a la venta y no se reembolsará el pago que hiciste.
    ||Puedes tener máximo 3 apartados con nosotros.
    `},
    {option: 'Liquidar mi pago💰',
        response: `Tienes 24 hrs para liquidar el material, el tiempo corre cuando recibes el folio de tu orden y el costo que debes pagar.  Si el pago no se realiza en ese tiempo, tu compra quedará cancelada y el material saldrá nuevamente a la venta 😥`},

];
function getQuestionMenuElements() {
    return menuElements;
}
function getResponseByText(option){
    let search =  menuElements.find(
        element => {
            return element.option.trim().toUpperCase() == option.trim().toUpperCase() || new RegExp(option.trim().toUpperCase(),'g').exec(element.option.trim().toUpperCase())
        }); 
    if (search){
        return search.response;
    }
    return null;
}
function getResponseById(_id){
    let id = parseInt(_id) - 1;
    if (id in menuElements) {
        return menuElements[id].response;
    } else {
        return null;
    }
}
function getWelcomMenuElements(){
    return [
        {title: 'Hacer un pedido de productos📦',
            image_url: 'https://storage.googleapis.com/detalles-jocelyn-storage/chatbot/pedido-de-productos.png',
            buttons:[
                {type: 'postback',title: 'Pedido de productos',payload: 'pedido de productos'}
            ]
        },
        {title: 'Preguntas Frecuentes ❗❓',
        image_url: 'https://storage.googleapis.com/detalles-jocelyn-storage/chatbot/faq.png',
        buttons:[
            {type: 'postback',title: 'Preguntas frecuentes',payload: 'Preguntas Frecuentes'}
        ]},
        {title: 'Métodos de pago 💳',
        image_url: 'https://storage.googleapis.com/detalles-jocelyn-storage/chatbot/pagos.png',
        buttons:[
            {type: 'postback',title: 'Métodos de pago',payload: 'Métodos de pago'}
        ]},
        // {title: 'Reglas del grupo👥',
        // image_url: 'https://storage.googleapis.com/detalles-jocelyn-storage/chatbot/reglas-de-grupo.png',
        // buttons:[
        //     {type: 'postback',title: 'Reglas del grupo',payload: 'Reglas de grupo'}
        // ]},
        {title: 'Hablar con asesor👤',
        image_url: 'https://storage.googleapis.com/detalles-jocelyn-storage/chatbot/hablar-con-asesor.png',
        buttons:[
            {type: 'postback',title: 'Hablar con asesor',payload: 'Hablar con asesor'}
        ]}
    ];
}

/** Payments responses */
let paymentsElements = [
    {option: 'Datos Bancarios 💳',response: 'Ok, te envío los datos bancarios, dame un segundo😁',attachmentId: env.PAYMENT_METHODS_ATTACH_ID,
        default_response: ''},
    {option: 'Dinámica de pagos 💸',response: `Para realizar el pago de tu orden deberás tener a la mano tu nota, la cual te haremos llegar a través de inbox. 
||Las chicas de ventas, atienden dependiendo de la letra con la que inicia tu nombre en Facebook 👇🏽

||🙋🏻‍♀️ Penélope Marian (A-I)
🙋🏻‍♀️ Estefani Alisson (J-Q)
🙋🏻‍♀️ María Eugenia Rentería Mireles (R-Z)

Ubica quién de ellas te estará atendiendo ☝🏽 y envíale un mensaje donde le pidas tu nota de pago.
    
||🗒️ Una vez que tengas tu nota, tienes de 24 a 48 hrs para liquidarla (sujeto a cambio). 💳 Realiza el pago y envía a la chica que te atiende, tu comprobante.
    
||Revisa en los comunicados del grupo los métodos de pagos que tenemos 😉
    `,attachmentId: null, default_response: ''},
    {option: 'Reglas de pago 📋',response: `Te pedimos estés atenta a las siguientes reglas de la dinámica de pagos para que la experiencia de tu compra sea placentera 🥰:

||✅ Si tu nota NO es liquidada se te silenciará y/o bloqueará del grupo
||✅ Solo entran en apartados las notas liquidadas completamente
||✅ Revisa tus mensajes “no deseados” cuando te enviemos tu nota
||✅ Te recordamos que no podemos modificar tu cuenta 
||✅ No asignamos materiales por inbox
    `,attachmentId: null, default_response: ''},
];

function getPaymentInfo(option){
    let search =  paymentsElements.find(element => {
        return element.option.toLowerCase() == option.toLowerCase() || new RegExp(option.toLowerCase(),'g').exec(element.option.toLowerCase())
    } ); 
    if (search){
        return search;
    }
    return null;
}
/** End Payments responses */

/** ORDER MENU */
let orderMenuItems = [
    `📝 Dinámica de pedido`,
    `📦 Hacer pedido`
];
let orderDynamicMessages = [
    `Para realizar un pedido deberás tener a la mano los productos que quieres encargar 🛍`,
    `Elige la opción “📦Hacer pedido” en este chat, y envíanos tu listado de productos que quieres comprar, con el siguiente formato:`,
    `Código del producto + cantidad del producto, por ejemplo:
DDP01 - 5, B004 - 2, B046 - 3`,
    `Ojo, ☝🏽debes revisar nuestros álbumes de fotos para ver los materiales que tenemos junto con el código de cada producto 😉`,
    `Una vez que tengamos tu listado 🗒️, lo revisaremos contra inventario y te enviaremos un mensaje confirmando los productos que tenemos en existencia, así como el precio total de tu orden.`,
    `Si no estás contenta con tu orden, podrás cancelar tu pedido, pero te recomendamos no hacerlo porque el material podría agotarse 😥`,
    `Por último se te informará quién de las chicas de nuestro equipo 🙋🏻‍♀️ le dará seguimiento a tu pedido y te entregará tu nota.`,
];
function getDynamicsMessages() {
    return orderDynamicMessages;
}
/** END ORDER MENU */
/** ORDER MESSAGES */
let orderMessages = [
    `📝Envíanos tu lista de productos que necesitas`,
    `El formato para hacer un pedido es el siguiente: Código + cantidad de producto, por ejemplo: DDP01-2, B011-5\n
 ☝🏽 NOTA: Envía tu pedido en un solo mensaje`,
    `🚨 Recuerda que si haces un pedido, se generará una orden de pago.`
];
function getOrderMessages() {
    return orderMessages;
}
/** END ORDER MESSAGES */

module.exports = {
    getQuestionMenuElements,
    getResponseById,
    getResponseByText,
    getWelcomMenuElements,
    getPaymentInfo,
    getDynamicsMessages,
    getOrderMessages
}