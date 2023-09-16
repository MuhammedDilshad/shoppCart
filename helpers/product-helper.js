var db = require('../config/connection')
var collection = require('../config/connections')
const async = require('hbs/lib/async');
const { resolve, reject } = require('promise');
const objectId = require('mongodb').ObjectId

module.exports = {
    Addproduct: (productData, Image) => {
        productData.name=productData.name.toUpperCase()
        productData.price=parseInt(productData.price)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne({ productData, Image }).then(() => {
                resolve()
            })
        })

    },
    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getOneProduct: (data) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(data) })
            resolve(product)
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(productId) }).then(() => {
                resolve()
            })
        })
    },
    updateProduct: (productId, productDeatails,Image) => {
        productDeatails.price=parseInt(productDeatails.price)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                _id:objectId(productId)
            },
            {$set:{
                'productData.name':productDeatails.name,
                'productData.price':productDeatails.price,
                'productData.Size':productDeatails.Size,
                'productData.product_categorie':productDeatails.product_categorie,
                'Image':Image,
                'Image':Image,
                'Image':Image
            }}).then(()=>{
                resolve('updated')
            }).catch(()=>{
                reject('not updated')
            })
        })
    }
}