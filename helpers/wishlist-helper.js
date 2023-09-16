const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
const { resolve, reject } = require('promise')
var db = require('../config/connection')
var collection = require('../config/connections')

module.exports = {
    addToWishlist: (proId, userId) => {
        console.log("wisj", proId);
        let prObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userWishlist = await db.get().collection(collection.WISH_LIST_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userWishlist) {
                let proExist = userWishlist.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.WISH_LIST_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })

                } else {
                    db.get().collection(collection.WISH_LIST_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: prObj }
                        }
                    ).then(() => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [prObj]
                }
                db.get().collection(collection.WISH_LIST_COLLECTION).insertOne(cartObj).then((response) => {
                    console.log('new user created ');
                    resolve(response)
                })
            }
        })
    },
    getWishListProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishListItems = await db.get().collection(collection.WISH_LIST_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(wishListItems)
        })
    },
    addingToCart: (proId, userId) => {
        let prObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            db.get().collection(collection.WISH_LIST_COLLECTION)
                                .deleteOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) })
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: prObj }
                        }
                    ).then(() => {
                        db.get().collection(collection.WISH_LIST_COLLECTION)
                                .deleteOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) })
                        resolve()
                    })
                }

            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [prObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    db.get().collection(collection.WISH_LIST_COLLECTION)
                                .deleteOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) })

                    resolve(response)
                })
            }
        })
    },
    deleteFromWishlist: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISH_LIST_COLLECTION).
                updateOne({ _id: ObjectId(details.wishlist) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(true)
                })
        })
    },
    getWishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let wishlist = await db.get().collection(collection.WISH_LIST_COLLECTION).findOne({ user: ObjectId(userId) })
            if (wishlist) {
                count = wishlist.products.length
            }
            resolve(count)
        })
    }
}