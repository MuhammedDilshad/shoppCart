const { ObjectID } = require('bson')
const { resolve, reject } = require('promise')
var db = require('../config/connection')
var collection = require('../config/connections')

module.exports = {
    AddBanner: (Image) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).insertOne({ Image }).then(() => {
                resolve()
            })
        })
    },
    getBanner: () => {
        return new Promise((resolve, reject) => {
            let banner = db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },
    deleteBanner: (bannerId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:ObjectID(bannerId)}).then(()=>{
                resolve()
            })
        })
    }
}
