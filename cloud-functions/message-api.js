'use strict';

const api = require('./api');

function sendMessage(psid, _text, callback) {
    let payload = {
        recipient: {
            id: psid
        },
        message: {
            text: _text
        }
    };
    if (callback) {
        api.call('/messages',payload,callback);
    } else {
        return api.callAsync('/messages',payload);
    }
}

/**
 * 
 * @param {int} psid ID facebook conversation 
 * @param {string} text Title message quickReply 
 * @param {array<{title,postback}>} _replies Array list of object structure for item reply.
 */
function sendQuickReply(psid, text, _replies,callback) {
    let payload = {};
    payload.recipient = {
        id: psid
    }
    let replies = []
    _replies.forEach(reply => {
        replies.push({
            content_type: 'text',
            title: reply.title,
            payload: reply.title
        })
    });

    payload.message = {
        text: text,
        quick_replies: replies
    }
    if (callback) {
        api.call('/messages', payload, callback);
    } else {
        return api.callAsync('/messages',payload);
    }
}

/**
 * 
 * @param {int} psid ID facebook conversation. 
 * @param {array<{title,image_url,subtile,default_action<{type,url}>,buttons<[{type,url,title,payload}]>}>} _cards 
 * @example
 * sendCard(123445,[
 * {title: "WELCOM",image_url:'MY-IMAGEURL.PNG',subtitle:'subtitle card',default_action: {},
 * buttons: [
 * {type: 'postback',title: 'option 1',payload: 'custom_postback_example'}
 * ]
 * }
 * ])
 */
function sendCard(psid,_cards,callback){
    let cards = [];
    _cards.forEach(card => {
        cards.push({
            title: card.title,
            image_url: card.image_url,
            subtitle: card.subtitle? card.subtitle : '',
            // default_action: card.default_action? card.default_action : {
            //     type: 'postback',title: 'default',messenger_extensions: false,webview_height_ratio: 'COMPACT'
            // },
            buttons: card.buttons ? card.buttons : []
        });
    });
    let _payload = {
        recipient: { id: psid},
        message: {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: cards
                }
            }
        }

    };
    if (callback) {
        api.call('/messages', _payload, callback);
    } else {
        return api.callAsync('/messages',payload);
    }
    

}

module.exports = {
    sendQuickReply,
    sendCard,
    sendMessage
};