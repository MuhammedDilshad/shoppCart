const { ObjectID } = require('bson')
const async = require('hbs/lib/async')
var db = require('../config/connection')
var collection = require('../config/connections')
const userHelpers = require('./user-helpers')

module.exports = {
    addCoupon: (coupon) => {
        coupon.CouponCode = coupon.CouponCode.toUpperCase()
        coupon.user = []
        coupon.CouponUpto = parseInt(coupon.CouponUpto)
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).findOne({ 'coupon.CouponCode': coupon.CouponCode })
            if (coupons) {
                reject('already exist')
            } else {
                db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getAllCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let userCoupon = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(userCoupon)
        })
    },
    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: ObjectID(couponId) }).then(() => {
                resolve()
            })
        })
    },
    applyCoupon: (coupon, userId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            response.CouponUpto = 0
            console.log('111', coupon);
            let couponData = await db.get().collection(collection.COUPON_COLLECTION).findOne({ CouponCode: coupon.CouponCode })
            console.log('222', couponData);
            if (couponData) {
                let userExit = await db.get().collection(collection.COUPON_COLLECTION).
                    findOne({ CouponCode: coupon.couponData, user: { $in: [ObjectID(userId)] } })
                if (userExit) {
                    response.status = false
                    resolve(response)
                    console.log('333', response);
                } else {
                    response.status = true
                    response.coupon = couponData

                    userHelpers.getTotalAmount(userId).then((total) => {
                        response.discountTotal = total - ((total * couponData.CouponUpto) / 100)
                        response.discountPrice = (total * couponData.CouponUpto) / 100
                        console.log(response);
                        resolve(response)
                    })
                }
            } else {
                response.status = false
                resolve(response)
            }
        })
    }
}