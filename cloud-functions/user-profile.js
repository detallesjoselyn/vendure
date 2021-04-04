'use strict';
const api = require('./api');
const message_api = require('./message-api');
const welcome_messages = require('./welcom-messages');
const dynamic_menus = require('./dynamic-menus');

/**
 * Gettin profile information from graph.facebook.com api
 */
function getProfile(psid , callback){
    let queryParams = {
        fields: "first_name,last_name" //,gender NEEDED pages_user_gender permission. 
    };
    api.get(psid,{},(response) => {
        callback(response);
        // console.log(response);
        let name = response.first_name ? ' ' + response.first_name + ' ' + response.last_name + ' ' : ' ';
        // message_api.sendQuickReply(
        //     psid,
        //     welcome_messages.getRamdomMessage(name),
        //     [
        //         {title: "Preguntas Frecuentes ❗❓"},
        //         {title: "Métodos de pago 💳"},
        //         {title: "Reglas de grupo"},
        //         {title:"Hablar con asesor"}
        //     ]
        // );
        let messages = welcome_messages.getRamdomMessage(name).split('||');
        messages.forEach((message,index) => {
            if ((messages.length -1) == index ) {
                message_api.sendMessage(psid,message, () => {
                    message_api.sendCard(psid,dynamic_menus.getWelcomMenuElements(), ()=> {});
                })
            }else {
                message_api.sendMessage(psid,message, () => {});
            }
        });
    },'https://graph.facebook.com/',queryParams);
}

function getUserNameFacebook(psid,callback){
    let queryParams = {
        fields: "first_name,last_name" //,gender NEEDED pages_user_gender permission. 
    };
    api.get(psid,{},callback,'https://graph.facebook.com/',queryParams);
}


module.exports = {
    getProfile,
    getUserNameFacebook
};