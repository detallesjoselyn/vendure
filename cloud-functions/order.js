/** Orders managment */
'use strict';

const { Suggestion } = require('dialogflow-fulfillment');
const api = require('./api');

const dynamic_menu = require('./dynamic-menus');
const user_api = require('./user-profile');
const message_api = require('./message-api');
const vendure_api = require('./vendure-api');

async function processOrderByText(agent, text, psid) {
    try {
        await message_api.sendMessage(psid,'😉 Dame un momento para verificar tu orden 🛒');
    }catch(e){
        agent.add('😉 Dame un momento para verificar tu orden 🛒');
    }
    let validOrder = [];
    getListFromText(text).forEach(item => {
        let itemOrder = splitCodeAndQuantity(item);
        if (itemOrder) {
            let previuslyAdded = false;
            validOrder.forEach((order, index) => {
                if (order.code.toUpperCase() == itemOrder.code.toUpperCase()) {
                    validOrder[index].quantity += itemOrder.quantity;
                    previuslyAdded = true;
                }
            });
            if (!previuslyAdded) {
                validOrder.push(itemOrder);
            }
        }
    });

    let user;
    let credentials = '';
    if (validOrder.length > 0) {
        try {
            user = await api.getAsync(psid, 'https://graph.facebook.com/',
                {
                    fields: "first_name,last_name"
                });
            user = user.data;
        } catch (e) {
            console.log("ERROR IN GET PROFILE INFO FROM FACEBOOK");
            // invalid data user, unavailable service
            notifyOrderErrorToCustomer(psid,'¡Upss!, Servicio temporalmente fuera de servicio, intenta más tarde...',null,false);
            return;
        }

        try {
            let registerResponse = await vendure_api.registerShopCustomer(psid, user);
            console.info("register.data",registerResponse.data);
        } catch (e) {
            console.error("ERROR IN REGISTER CUSTOMER",e);
            notifyOrderErrorToCustomer(psid,'¡Upss!, Servicio temporalmente fuera de servicio, intenta más tarde...',null,false);
            return ;
        }


        try {
            let loginResponse = await vendure_api.loginShopCustomer(psid);
            credentials = vendure_api.getCredentials(loginResponse);

        } catch (e) {
            console.error("ERROR IN LOGIN",e);
            notifyOrderErrorToCustomer(psid,'¡Upss!, Servicio temporalmente fuera de servicio, intenta más tarde...','INVALID_CREDENTIALS',false);
            return;
        }


        let order;
        try {
            order  = await vendure_api.generateCustomerOrderBySkus(credentials,validOrder);
        } catch(e){
            console.error("error on async await",e);
            notifyOrderErrorToCustomer(psid,'¡Upps!, Ocurrio un problema al procesar tu pedido');
            return ;
        }
        if (order.data ) {
            if (order.data.data) {
                if (order.data.data.generateOrderBySkus.state == vendure_api.ORDER_STATES.authorized) {
                    notifyOrderToCustomer(psid,order.data.data.generateOrderBySkus,user.first_name);
                } else {
                    console.warn("Error: no generateOrderBySkus object",order.data.data);
                    notifyOrderErrorToCustomer(psid,'¡Oh oh!, Ocurrio un problema al procesar tu pedido');
                }
            } else {
                let message = '😔Lo sentimos, Ocurrio un problema al procesar tu pedido, ' + 
                (0 in order.data.errors? order.data.errors[0].message : '');
                console.warn("Error response vendure error object: ",order.data.errors);
                notifyOrderErrorToCustomer(psid,message);
            }
        } else {
            console.warn("eror in data.data", order.data);
            notifyOrderErrorToCustomer(psid,'¡Upps!, Ocurrio un problema al procesar tu pedido');
        }

    } else {
        console.warn("order invalid", text);
        notifyOrderErrorToCustomer(psid,'😔Lo sentimos, no pudimos procesar tu pedido');
    }
}

async function cancelCustomerOrder(agent,orderCode, psid) {
    agent.add('Dame un momento para verificar tu pedido😁');
    let credentials = '';
    try {
        let loginResponse = await vendure_api.loginShopCustomer(psid);
        credentials = vendure_api.getCredentials(loginResponse);
    } catch(e) {
        console.log(e.message);
        notifyOrderErrorToCustomer(psid,'¡Upss!, Servicio temporalmente fuera de servicio, intenta más tarde...','INVALID_CREDENTIALS',false);
        return;
    }
    let cancelOrderResponse;
    try {
        cancelOrderResponse = await vendure_api.cancelCustomerOrder(credentials,orderCode);
    } catch(e) {
        console.log(e.message);
    }
    try {
    if ('errors' in cancelOrderResponse.data){
        let titleReply =  Object.values(vendure_api.ORDER_STATES).find((state) => state == cancelOrderResponse.data.errors[0].message.trim()) ? 
            `El peido se encuentra en estado ${cancelOrderResponse.data.errors[0].message} y no se puede cancelar 🤭`: 
            `${cancelOrderResponse.data.errors[0].message}`;
            titleReply+= '🤔, ¿Te puedo ayudar en algo más?';
        await message_api.sendQuickReply(
            psid,
            titleReply,
            [{ title: "📦 Rehacer pedido" }, { title: "👋🏼No, gracias" }, { title: "🏠Menú principal" }]
        );
    } else {
        await message_api.sendQuickReply(
            psid,
            `Hemos cancelado tu pedido ${orderCode},¿Te puedo ayudar en algo más?`,
            [{ title: "📦 Rehacer pedido" }, { title: "👋🏼No, gracias" }, { title: "🏠Menú principal" }]
        );
    }
    } catch(e){
        console.warn(e.message);
    }
}

function pipeCurrencyUnits(number) {
    let cents = number.toString().slice(number.toString().length - 2);
    let units = number.toString().slice(0, number.toString().length - 2)
    switch (units.length) {
        case 10:
            units = `${units.slice(0, 1)},${units.slice(1, 4)},${units.slice(4, 7)},${units.slice(7, 10)}`;
            break;
        case 9:
            units = `${units.slice(0, 3)},${units.slice(3, 6)},${units.slice(6, 9)}`;
            break;
        case 8:
            units = `${units.slice(0, 2)},${units.slice(2, 5)},${units.slice(5, 8)}`;
            break;
        case 7:
            units = `${units.slice(0, 1)},${units.slice(1, 4)},${units.slice(4, 7)}`
            break;
        case 6:
            units = `${units.slice(0, 3)},${units.slice(3, 6)}`;
            break;
        case 5:
            units = `${units.slice(0, 2)},${units.slice(2, 5)}`;
            break;
        case 4:
            units = `${units.slice(0, 1)},${units.slice(1, 4)}`;
            break;
        case 3:
            // units = `${units.slice(0,3)}`;
            // NOTHIN TODO
            break;
        case 2:
            break;
        case 1:
            break;
    }
    return units + "." + cents;
}

/** 
 * @param {number} psid Facebook identifier chat of customer.
 * @param {Order} order Vendure Order confirmed, contain {id,code,totalWithTax,state,lines{id,quantity,unitPriceWithTax,productVariant}}
*/
async function notifyOrderToCustomer (psid,order,userName) {
    let messageListProducts = '';
    let totalItems = 0;
    if(order.lines.length > 1) {
        order.lines = order.lines.sort(function(a,b){
            return a.productVariant.sku.localeCompare(b.productVariant.sku);
        });
    }
    order.lines.map((item) => {
        totalItems += item.quantity;
        let totalItem = parseFloat(parseFloat(pipeCurrencyUnits(item.unitPriceWithTax)) * parseInt(item.quantity)).toFixed(2);
        messageListProducts += `✅${item.productVariant.sku}-${item.quantity} $${totalItem}
`;   
    });
    messageListProducts += `Total de materiales: ${totalItems}\n`;
    messageListProducts += `\n🗒️Tu número de pedido: ${order.code}`;
    messageListProducts += `\n💳Total a pagar: $: ${pipeCurrencyUnits(order.totalWithTax)}`;
    
    try {
        await message_api.sendMessage(psid,`✨¡Ya tenemos tu pedido!, a continuación te mostramos los productos que tuvimos en existencia:`);
    }catch(e){
        console.log("ERROR TO SEND MESSAGE");
    }
    try {
        await message_api.sendMessage(psid,messageListProducts);
    }catch(e){
        console.log("ERROR TO SEND MESSAGE");
    }
    orderAssignStaff(psid,userName);
}

function setMenuFallback(agent) {
    let suggess = new Suggestion("Cancelar");
    suggess.title = "¡¡Recuerda!! El formato para hacer un pedido es el siguiente: Código + cantidad de producto, por ejemplo: DDP01-2, B011-5,\n Inténtalo nuevamente";
    suggess.setPlatform(agent.FACEBOOK);
    agent.add(suggess);
}

async function notifyOrderErrorToCustomer(psid,message,errorCode,otherOrder = true) {
    try{
        await message_api.sendMessage(psid,message);
    }catch(e){}
    if (errorCode){
        try{
            await message_api.sendMessage(psid,`Código de error: ${errorCode}`);
        }catch(e){}
    }

    try {
        if (otherOrder){
            await message_api.sendQuickReply(psid,'👇¿Quieres hacer otro pedido?',
                [{title:'📦 Otro pedido'},{title:'👋🏼 No, gracias'},{title:'🏠 Menú principal'}]);
        } else {
            await message_api.sendQuickReply(psid,'👇¿Bella, te puedo ayudar en algo más?',
            [{title:'👋🏼 No, gracias'},{title:'🏠 Menú principal'}]);
        }
    }catch(e){}
}

function getListFromText(text) {
    try {
        if (text.search("\n") && text.search(",")) {
            let items = [];
            text.split("\n").map((item) => {
                if (item != null && item != "") {
                    if ( item.search(",") >= 0 ) {
                        item.split(",").map((subItem) => {
                            if (subItem != "" && subItem != null) {
                                items.push(subItem);
                            }
                        });
                    } else {
                        items.push(item)
                    }
                }
            });
            return items;
        } else if ( text.search("\n") && !text.search(",") ) {
            return text.split("\n");
        } 
        else if ( !text.search("\n") && text.search(",")) {
            return text.split(',');
        } else {
            return [];
        }

    }catch(e){
        return []
    }
}
function splitCodeAndQuantity(itemOrder) {
    // let quantity = 0;
    // OBTENEMOS EL SKU
    itemOrder = itemOrder.match(/[A-Za-z0-9]{3,10}(\s*)/);
    if ( !itemOrder || !(0 in itemOrder)) {
        return null;
    }

    let matchQuantity = '1' in itemOrder.input.split('-') ? parseInt(itemOrder.input.split('-')[1]) : null;

    // OLDER FORMAT regex = ABC001(5)
    // let matchQuantity = itemOrder.input.match(/\((\s*)([0-9]{1,3}|[0-9]{1,3}(\s*)([\w]{1,3}))(\s*)\)/);

    if (!matchQuantity) {
        return null;
    }

    return { code: itemOrder[0].trim().toUpperCase(), quantity: matchQuantity };
}

let existencia = [
    { code: 'DDP01', name: "Diadema Bco 1cm Ancho", stock: 6, price: 28.00 },
    { code: 'DDP03', name: "Diadema Bco 3cm Ancho", stock: 6, price: 45.00 },
    { code: 'DDP04', name: "Diadema Negra para decorar 3cm Ancho", stock: 10, price: 39.00 },
    { code: 'DDP06', name: "Diadema Efecto marmol para decorar 3cm Ancho", stock: 10, price: 39.00 },
    { code: 'B011', name: "Acrílico Diseño Corona Rosa con 2pzas 5/5cm aprox.", stock: 12, price: 40.00 },
    { code: 'B012', name: "Acrílico Diseño Cola de Sirena Dorado/Rosa con 2pzas 5/9cm aprox", stock: 12, price: 66.00 },
    { code: 'B012', name: "Acrílico Diseño Sirena Dorado con 2 pzas 7cm aprox.", stock: 10, price: 40.00 },
    { code: 'B014', name: "Acrílico Diseño Corazón Dorado/Rosa con 2 pzas 6/5cm aprox", stock: 10, price: 48.00 },
    { code: 'B016', name: "Acrílico Diseño Torre Eiffel Dorada con 2pzas 6/5cm aprox", stock: 10, price: 40.00 },
    { code: 'B018', name: "Acrílico Diseño Bicicleta Dorada con 2pzas 5/7.5cm aprox", stock: 10, price: 48.00 },
    { code: 'B021', name: "Acrílico Diseño Concha/Sirena Plata-dorado con 2pzas 7/8cm aprox", stock: 5, price: 59.40 },
    { code: 'B040', name: "Acrílico Coronita Dorado", stock: 6, price: 50.96 },
    { code: 'B041', name: "Acrílico Bailarina con tutu Plata/Rosa (6cm aprox.) 2pzas", stock: 3, price: 50.96 },
    { code: 'B042', name: "Acrílico Espejito Dorado/Plata ", stock: 2, price: 45.68 },
    { code: 'B043', name: "Acrílico Carrusel Dorado (6x4cm aprox)", stock: 20, price: 37.80 },
    { code: 'B044', name: `Acrílico "B" Barbie logotipo Dorado/Rosa`, stock: 13, price: 110.00 },
];

let followOrderStaff = [
    { name: "Penelope Marian", link: "http://m.me/penelope.marian.169", range: "A-I" },
    { name: "Estefani Alisson", link: "http://m.me/edith.berenice.3348", range: "J-Q" },
    { name: "Maria Eugenia Renteria Mireles", link: "http://m.me/mariaeugenia.renteriamireles", range: "R-Z" }
];
function getStaffByUsernameFacebook(name) {
    // console.log(name);
    let staff = {};
    switch (true) {
        case /[A-I]{1}/.test(name[0].toUpperCase()):
            staff = followOrderStaff[0];
            break;
        case /[J-Q]{1}/.test(name[0].toUpperCase()):
            staff = followOrderStaff[1];
            break;
        case /[R-Z]{1}/.test(name[0].toUpperCase()):
            staff = followOrderStaff[2];
            break;
    }
    return staff
}

async function orderAssignStaff(psid,name) {
    let staff = getStaffByUsernameFacebook(name);
    let staffMessage = `Bella para darle seguimiento a tu pedido, escríbele a ${staff.name} 👩🏻 para que le envíes tu voucher de pago.
Escríbele desde este link 👉🏼${staff.link}`;
    try{
        await message_api.sendMessage(psid,staffMessage);
    }catch(e){}

    try{
        await message_api.sendQuickReply(
            psid,
            "¿Te puedo ayudar en algo más?",
            [{ title: "❌ Cancelar mi pedido" }, { title: "Paqueterías 📮" },{title: "Datos Bancarios 💳"}, { title: "👋🏼No, gracias" }, { title: "🏠Menú principal" }]
        );
    }catch(e){}
}

module.exports = {
    processOrderByText,
    orderAssignStaff,
    cancelCustomerOrder
};
