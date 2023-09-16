var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers');
let productHelper = require('../helpers/product-helper')
var verifyHelpers = require('../helpers/verify-helper');
const adminHelper = require('../helpers/admin-helper')
const { ObjectId } = require('mongodb');
const async = require('hbs/lib/async');
const razorPayHelpers = require('../helpers/razorPay-helpers');
const wishlistHelpers = require('../helpers/wishlist-helper');
const bannerHelpers = require('../helpers/banner-helpers');
const { response } = require('../app');
const session = require('express-session');
const couponHelpers = require('../helpers/couponHelpers');
const { Router } = require('express');

/* GET home page. */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

router.get('/', async function (req, res, next) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  let user = req.session.user
  let cartCount = null
  let WishlistCount = null
  if (req.session.user) {
    WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelper.getAllProduct().then((products) => {
    bannerHelpers.getBanner().then((banner) => {
      res.render('index', { banner, cartCount, WishlistCount, layout: 'layout', products, user: true, user })
    })
  })
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginErr': req.session.userLoginErr, layout: 'loginlayout' })
    req.session.userLoginErr = false
  }
})

router.get('/signup', (req, res) => {
  res.render('user/signup', { layout: 'loginlayout' })
})

router.post('/signup', (req, res) => {
  req.session.userBody = req.body
  verifyHelpers.getotp(req.body.Number).then((response) => {
    res.redirect('/otp')
  })

})

router.get('/otp', (req, res) => {
  res.render('user/otppage', { 'otp_error': req.session.otpErr })
})

router.post('/otp', (req, res) => {
  let userData = req.session.userBody
  let number = userData.Number
  verifyHelpers.otpVerify(req.body, number).then((data) => {
    if (data.status == 'approved') {
      userHelpers.doSignup(req.session.userBody).then((response) => {
        console.log('signup success');

        req.session.user = response.user
        req.session.loggedIn = true
        res.redirect('/')

      })
    } else {
      req.session.otpErr = 'invalid otp'
      res.redirect(req.get('referer'))
    }
  })
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.loggedIn = true;
      res.redirect('/')
    } else {
      req.session.userLoginErr = 'Invaild Email or Password'
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.loggedIn = false
  res.redirect('/')
})

router.get('/product', (async (req, res) => {
  let cartCount = null
  let WishlistCount = null
  if (req.session.loggedIn) {
    WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let user = req.session.user
  productHelper.getAllProduct().then((products) => {
    res.render('user/product', { WishlistCount, cartCount, products, user })
  })
}))

router.get('/contact', (async (req, res) => {
  let cartCount = null
  let WishlistCount = null
  res.locals.message = err.message;
  let user = req.session.user
  if (req.session.loggedIn) {
    WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('user/contact', { cartCount, WishlistCount, user })
}))

router.get('/about', (async (req, res) => {
  let cartCount = null
  let WishlistCount = null
  let user = req.session.user
  if (req.session.loggedIn) {
    WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('user/about', { cartCount, WishlistCount, user })
}))

router.get('/showImg', async (req, res) => {
  let user = req.session.user
  let cartCount = null
  let WishlistCount = null
  if (req.session.user) {
    WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelper.getOneProduct(req.query.id).then((product) => {
    res.render('user/product-detail', { product, user, cartCount, WishlistCount })
  })
})

router.post('/showImg/:id', (req, res) => {
  productHelper.updateSize(req.params.id, req.body).then(() => {

  })
})

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  let totalAmount = 0
  userCoupon = await couponHelpers.getAllCoupon(req.session.user._id)
  WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
  cartCount = await userHelpers.getCartCount(req.session.user._id)
  let products = await userHelpers.getCartProducts(req.session.user._id)
  if (products.length > 0) {
    totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
  }
  console.log('the products', products);
  res.render('user/add-to-cart', { userCoupon, WishlistCount, totalAmount, cartCount, products, layout: 'layout', user: true, user })
})

router.post('/addToCart', verifyLogin, (req, res, next) => {
  let user = req.session.user
  userHelpers.addToCart(req.body.proId, req.session.user._id, req.body.size).then(() => {
    console.log('cart created', req.params.id, req.session.user._id);
    res.redirect('/cart')
  })
})

router.post('/changeProductQuantiy', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    console.log("change ", req.body);
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/deleteFromCart', verifyLogin, (req, res, next) => {
  userHelpers.deleteFromCart(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/placeOrder', verifyLogin, async (req, res, next) => {
  let total = null
  let discount = null
  let WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let userAddress=await userHelpers.getBillingDeatailes(req.session.user._id)
  console.log('user address',userAddress);
  if (req.session.coupon) {
    total = req.session.discount
  } else {
    total = await userHelpers.getTotalAmount(req.session.user._id)
  }
  let coupon = req.session.coupon
  res.render('user/checkout', { userAddress,WishlistCount, coupon, discount, total, cartCount, user: true, user: req.session.user })
})

router.post('/placeOrder', verifyLogin, async (req, res, next) => {
  totalPrice = 0
  let products = await userHelpers.getCartProductList(req.session.user._id)
  if (req.session.discount) {
    totalPrice = req.session.discount
  } else {
    totalPrice = await userHelpers.getTotalAmount(req.session.user._id)
  }
  userHelpers.placeOrder(req.body, products, totalPrice,req.session.user._id).then((orderId) => {
    if (req.body['paymentMethod'] === 'COD') {
      res.json({ codeSuccess: true })
    } else {
      razorPayHelpers.genarateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
  })
  req.session.coupon = null
  req.session.discount = null
})

router.get('/orderPlaced', verifyLogin, async (req, res) => {
  let WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  res.render('user/orderPlaced', { WishlistCount, cartCount, user: req.session.user })
})

router.get('/myOrder', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrder(req.session.user._id)
  let WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  res.render('user/myOrder', { WishlistCount, cartCount, orders, user: req.session.user })
})

router.get('/viewOrderedProduct/:id', verifyLogin, async (req, res) => {
  let product = await userHelpers.getOrderProduct(req.params.id)
  res.render('user/viewOrderedProduct', { user: req.session.user, product })
})

router.post('/verify-Payment', verifyLogin, (req, res) => {
  console.log('verifyPayment', req.body);
  console.log(req.body);
  razorPayHelpers.verifyPayment(req.body).then(() => {
    razorPayHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false, errMsg: '' })
  })
})

router.get('/wishlist', verifyLogin, async (req, res) => {
  let WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let products = await wishlistHelpers.getWishListProducts(req.session.user._id)
  res.render('user/addToWishlist', { user: req.session.user, cartCount, WishlistCount, products })
})

router.get('/addToWishlist/:id', verifyLogin, (req, res, next) => {
  console.log('addtowishlist');
  let user = req.session.user
  wishlistHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    console.log('doooooon');
    res.redirect('/wishlist')
  })
})

router.get('/addingToCart/:id', verifyLogin, (req, res, next) => {
  let user = req.session.user
  wishlistHelpers.addingToCart(req.params.id, req.session.user._id).then(() => {
    console.log('cart created');
    res.redirect('/cart')
  })
})

router.post('/deleteFromWishList', verifyLogin, (req, res, next) => {
  wishlistHelpers.deleteFromWishlist(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/userprofile', verifyLogin, async (req, res) => {
  let WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let deatailes = await userHelpers.getBillingDeatailes(req.session.user._id)
  console.log('23232323', deatailes);
  res.render('user/userProfile', { deatailes, user: req.session.user, WishlistCount, cartCount })
})


router.post('/applyCoupon', (req, res) => {
  couponHelpers.applyCoupon(req.body, req.session.user._id).then((response) => {
    console.log('discount detailes', response);
    if (response.status) {
      req.session.coupon = response.coupon
      req.session.discount = response.discountTotal
    }
    res.json(response)
  })
})

router.get('/addBilingDetails', verifyLogin, async (req, res) => {
  let WishlistCount = await wishlistHelpers.getWishlistCount(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  res.render('user/BilingDetails', { user: req.session.user, WishlistCount, cartCount })
})

router.post('/addBilingDetails', (req, res) => {
  userHelpers.AddAddress(req.body, req.session.user._id).then(() => {
    res.redirect('/userprofile')
  })
})

router.get('/deleteFromAddress/:id', (req, res) => {
  userHelpers.deleteFromAddress(req.params.id).then((response) => {
    console.log('dddddddddddd',response);

    res.json(response)
  })
})
module.exports = router;

