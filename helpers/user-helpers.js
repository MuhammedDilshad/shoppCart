var db = require('../config/connection')
var collection = require('../config/connections')
const bcrypt = require('bcrypt')
const { resolve, reject } = require('promise')
const { USER_COLLECTION } = require('../config/connections')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
const { response } = require('../app')
module.exports = {
    doSignup: (userData) => {
        userData.isBlocked = false
        let response = {}
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(async (data) => {
                let userData = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: data.insertedId })
                response.user = userData
                resolve(response)
            })

        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (!user.isBlocked) {
                if (user) {
                    bcrypt.compare(userData.Password, user.Password).then((status) => {
                        if (status) {
                            console.log('login success');
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            resolve({ status: false })
                        }
                    })
                }
                else {
                    resolve({ status: false })
                }
            } else {
                resolve({ status: false })
            }
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(id) },
                {
                    $set: {
                        isBlocked: true
                    }
                }).then(() => {
                    resolve('udated')
                }).catch(() => {
                    reject('not updated')
                })
        })
    },
    UnblokUser: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(id) },
                {
                    $set: {
                        isBlocked: false
                    }
                }).then(() => {
                    resolve('updated')
                }).catch(() => {
                    reject('not updated')
                })
        })
    },
    addToCart: (proId, userId, size) => {
        size = parseInt(size)
        let prObj = {
            item: ObjectId(proId),
            quantity: 1,
            size: size
        }
        console.log('size availeble or not', prObj);
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
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
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
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    console.log(653465356);
                    resolve(response)
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let CartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        size: '$products.size'
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
                        size: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(CartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.quantity = parseInt(details.quantity)
        details.count = parseInt(details.count)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } }

                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION).
                    updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
            }

        })
    },
    deleteFromCart: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).
                updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(true)
                })
        })
    },
    getTotalAmount: (userId) => {
        console.log("hvnvv", userId);
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([

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
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.productData.price' }] } }
                    }
                }

            ]).toArray()
            if (total[0] === undefined) {
                resolve()
            } else {
                resolve(total[0].total)
            }

        })
    },
    placeOrder: (order, products, total,userId) => {
        return new Promise(async(resolve, reject) => {
            let dateObj = new Date();
            let month = dateObj.getUTCMonth() + 1;
            let year = dateObj.getUTCFullYear();
            let day = dateObj.getUTCDate();
            let currentDate = day + "/" + month + "/" + year;
            let address = await db.get().collection(collection.ADRESS_COLLECTION).findOne({_id: ObjectId(order.addressId)})
            let status = order.paymentMethod === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: address.mobile,
                    fname: address.fname,
                    lname: address.lname,
                    address: address.address,
                    pincode: address.pincode
                },
                userId: ObjectId(userId),
                paymentMethod: order.paymentMethod,
                products: products,
                totalAmount: total,
                status: status,
                date: currentDate
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) })
                resolve(response.insertedId)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            resolve(cart.products)
        })
    },
    getUserOrder: (userId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: ObjectId(userId) }).toArray()
            resolve(order)

        })
    },
    getOrderProduct: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        totalAmount: '$totalAmount'
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
                        totalAmount: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(orderItems)
            console.log('user ordered', orderItems);
        })
    },
    getUserData: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userData = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            resolve(userData)
        })
    },
    AddAddress: (data, userId) => {
        console.log('11111111111', data);
        console.log('2222222', userId);
        return new Promise((resolve, reject) => {
            data.userId = userId
            console.log(userId);
            db.get().collection(collection.ADRESS_COLLECTION).insertOne(data)
            resolve()
        })
    },
    getBillingDeatailes: (userDataId) => {
        return new Promise(async (resolve, reject) => {
            let deatailes = await db.get().collection(collection.ADRESS_COLLECTION).find({ userId: userDataId }).toArray()
            resolve(deatailes)
        })
    },
    deleteFromAddress: (addressId) => {
        return new Promise((resolve, reject) => {
            console.log('eeeeeeeeeeeee',addressId);
            db.get().collection(collection.ADRESS_COLLECTION).deleteOne({_id:ObjectId(addressId)}).then((response)=>{
                console.log('fffffff',response);
                resolve({status:true})
            })
        })
    }

}
