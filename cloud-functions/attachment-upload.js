/**
 * Attachment upload api facebook
 * 
 */

 /**
  * CURL EXAMPLE UPLOAD FILE LOCALY
  curl  \
  -F 'message={"attachment":{"type":"image", "payload":{"is_reusable":true}}}' \
  -F 'filedata=@/tmp/shirt.png;type=image/png' \
  "https://graph.facebook.com/v2.6/me/message_attachments?access_token=<PAGE_ACCESS_TOKEN>"
  */
 'use strict';
const api = require('./api');
const message_api = require('./message-api');

/**
 * Send payment methods image to user with attachment file api facebook.
 * @param {number} userPsid 
 */
function sendPaymentMethodsToConversation(userPsid, attachmentId){
    // let attachmentId = env.PAYMENT_METHODS_ATTACH_ID;
    if (attachmentId){
        attachmentFileToConversation(userPsid,attachmentId, (body) => {
            sendMenuPaymentsMethods(userPsid);
        });
    } else {
        setTimeout(() => {
            sendMenuPaymentsMethods(userPsid);
        },4000)
    }
}

function sendMenuPaymentsMethods(userPsid){
    message_api.sendQuickReply(
        userPsid,
        '👇¿Te puedo ayudar en algo más❓',
        [
            {title: 'Métodos de pago 💳'},
            {title: "🏠Menú principal"},
            {title: "No, Gracias 😁"},
            {title:"Hablar con asesor"}
        ]
    );
}
/**
 * Generate payload and call to send attachment file to messenger user.
 * @param {number} userPsid 
 * @param {number} attachmentId 
 */
function attachmentFileToConversation(userPsid,attachmentId,callback) {
    let payload = {
        recipient: {
            id: userPsid
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    attachment_id: attachmentId
                }
            }
        }
    };
    api.call('/messages',payload, callback);
}
module.exports = {
    sendPaymentMethodsToConversation,
    attachmentFileToConversation
}