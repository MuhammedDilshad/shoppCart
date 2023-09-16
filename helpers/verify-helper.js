
require('dotenv').config()


const client = require('twilio')(process.env.TWILIO_ACCOUNTID, process.env.TWILIO_ACCOUNT_TOCKEN);
const ServicesID=process.env.TWILIO_SERVICESID

module.exports = {
    getotp: (Number) => {
        console.log(Number);
        let res = {}
        return new Promise((resolve, reject) => {
            client.verify.services(ServicesID).verifications.create({
                to: `+91${Number}`,
                channel: 'sms'
            }).then((res) => {
                res.valid = true
                resolve(res)
            })
        })
    },
    otpVerify: (otpData, Number) => {
        let resp = {}
        return new Promise((resolve, reject) => {
            client.verify.services(ServicesID).verificationChecks.create({
                to:`+91${Number}`,
                code:otpData.otp
            }).then((resp)=>{
                resolve(resp)
            })
        })
    }
}