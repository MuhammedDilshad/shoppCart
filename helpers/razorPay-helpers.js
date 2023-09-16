
var db = require('../config/connection')
var collection = require('../config/connections')
const Razorpay = require('razorpay');
const { ObjectId } = require('mongodb');
require('dotenv').config()

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_SECRETKEY,
});

module.exports = {
    genarateRazorpay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalPrice * 100,
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(
                options, (err, order) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('rzrpay', order);
                        resolve(order)
                    }
                })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'YM5nBulrKyO5tEvOJ2bzgWV9')
            hmac.update(details['Payment[razorpay_order_id]'] + '|' + details['Payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['Payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
            .update({ _id: ObjectId(orderId) },
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    }
}

