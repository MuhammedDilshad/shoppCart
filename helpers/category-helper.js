var db = require('../config/connection')
var collection = require('../config/connections')
const async = require('hbs/lib/async');
const { resolve, reject } = require('promise');
const objectId = require('mongodb').ObjectId

module.exports = {
    addCategory: (categoryData) => {
        categoryData.categoryName=categoryData.categoryName.toUpperCase()
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ categoryData: categoryData })
            if (category) {
                reject('already exist')
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne({ categoryData }).then(() => {
                    resolve()
                })
            }
        })
    },
    viewCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then(() => {
                resolve()
            })
        })
    },
    getOneCategory: (dataId) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(dataId) })
            resolve(category)
        })
    },
    updateCategory: (categoryId, categoryDeatails) => {
        categoryDeatails.categoryName=categoryDeatails.categoryName.toUpperCase()
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ categoryData: categoryDeatails })
            if (category) {
                reject('you cant add sameOne')
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoryId) },
                    {
                        $set: {
                            'categoryData.categoryName': categoryDeatails.categoryName
                        }
                    }).then(() => {
                        resolve()
                    })
            }
        })
    }
}