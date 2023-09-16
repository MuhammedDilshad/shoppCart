var express = require('express');
const { reservationsUrl } = require('twilio/lib/jwt/taskrouter/util');
const productHelper = require('../helpers/product-helper');
const categoryHelper = require('../helpers/category-helper')
const adminHelper = require('../helpers/admin-helper')
var router = express.Router();
const multer = require('../middleware/multer');
const async = require('hbs/lib/async');
const userHelpers = require('../helpers/user-helpers');
const bannerHelpers = require('../helpers/banner-helpers');
const couponHelpers = require('../helpers/couponHelpers')


/* GET users listing. */
router.get('/', async (req, res, next)=>{
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

  if (req.session.adminLoggedIn) {
    let dialyTotalSales = await adminHelper.dialyTotalSales()
    let SalesDate = await adminHelper.SalesDate()
    let arrayLength = dialyTotalSales.length - 1
    let dailySales = dialyTotalSales[arrayLength]
    res.render('admin/admin-dashboard', { dialyTotalSales,SalesDate,layout: 'adminlayout', admin: true, });
  } else {
    res.redirect('/admin/login');
  }
});

router.get('/login', (req, res) => {
  res.render('admin/admin-login', { layout: 'loginlayout' })
  req.session.adminLoggErr = false;
})

router.post('/login', (req, res) => {
  adminHelper.adminLoggin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.adminLoggedIn = true;
      res.redirect('/admin')
    } else {
      req.session.loginErr = 'Invaild Email or Password'
      res.redirect('admin/login')
    }
  })
})

router.get('/add-product', (req, res, next) => {
  if (req.session.adminLoggedIn) {
    categoryHelper.viewCategory().then((category) => {
      res.render('admin/add-product', { category, layout: 'adminlayout', admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/add-product', store.array('Image', 3), (req, res) => {
  let Image = []
  let files = req.files
  Image = files.map((value) => {
    return value.filename
  })
  productHelper.Addproduct(req.body, Image).then(() => {
    res.redirect('/admin/view-product')
  })
})

router.get('/view-product', (req, res, next) => {
  productHelper.getAllProduct().then((products) => {
    if (req.session.adminLoggedIn) {
      res.render('admin/view-product', { products, layout: 'adminlayout', admin: true })
    } else {
      res.redirect('/admin/login')
    }
  })
})

router.get('/deleteProduct/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    productHelper.deleteProduct(req.params.id).then(() => {
      res.redirect('/admin/view-product')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/editproduct/:id', async (req, res) => {
  let product = await productHelper.getOneProduct(req.params.id)
  let category = await categoryHelper.viewCategory()
  if (req.session.adminLoggedIn) {
    res.render('admin/edit-product', { category, product, layout: 'adminlayout', admin: true })
  } else {
    res.redirect('/admin')
  }
})

router.post('/edit-product/:id', store.array('Image', 3), (req, res) => {
  let Image = []
  let files = req.files
  Image = files.map((value) => {
    return value.filename
  })
  productHelper.updateProduct(req.body.proId, req.body, Image).then((success) => {
    req.session.successMess = success
    res.redirect('/admin/view-product')
  }).catch((error) => {
    res.redirect('back')
  })
})

router.get('/category-management', (req, res) => {
  if (req.session.adminLoggedIn) {
    categoryHelper.viewCategory().then((category) => {
      res.render('admin/category', { category, layout: 'adminlayout', admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }

})

router.get('/addCategory', ((req, res) => {
  if (req.session.adminLoggedIn) {
    let errmess = req.session.errmess
    res.render('admin/add-category', { errmess, layout: 'adminlayout', admin: true })
  }
  else {
    res.redirect('/admin/login')
  }
}))

router.post('/addCategory', (req, res) => {
  if (req.session.adminLoggedIn) {
    categoryHelper.addCategory(req.body).then((category) => {
      res.redirect('category-management')
    }).catch((err) => {
      req.session.errmess = err;
      res.redirect('back')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/deleteCategory/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    categoryHelper.deleteCategory(req.params.id,).then(() => {
      res.redirect('/admin/category-management')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/editCategory/:id', async (req, res) => {
  let category = await categoryHelper.getOneCategory(req.params.id)
  if (req.session.adminLoggedIn) {
    let errmess = req.session.errmess
    res.render('admin/edit-category', { errmess, category, layout: 'adminlayout', admin: true })
    req.session.errmess = false
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/editCategory/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    categoryHelper.updateCategory(req.params.id, req.body).then(() => {
      res.redirect('/admin/category-management')
    }).catch((err) => {
      req.session.errmess = err;
      res.redirect('back')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/user-management', (req, res) => {
  if (req.session.adminLoggedIn) {
    userHelpers.getAllUsers().then((users) => {
      res.render('admin/view-user', { users, layout: 'adminlayout', admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/BlockUser/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    userHelpers.blockUser(req.params.id).then(() => {
      res.redirect('back')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/UnblockUser/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    userHelpers.UnblokUser(req.params.id).then(() => {
      res.redirect('back')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/orderManegement', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.getUserOrder().then((orders) => {
      res.render('admin/orderManegement', { orders, layout: 'adminlayout', admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/orderEdit/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.getOrderProduct().then((orders) => {
      res.render('admin/orderEdit', { orders, layout: 'adminlayout', admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/orderEdit/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.updateStatus(req.params.id, req.body).then(() => {
      res.redirect('/admin/orderManegement')
    }).catch((err) => {
      req.session.errmess = err;
      res.redirect('back')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/viewBanner', (req, res, next) => {
  if (req.session.adminLoggedIn) {
    bannerHelpers.getBanner().then((banner) => {
      res.render('admin/viewBanner', { banner, layout: 'adminlayout', admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/addBanner', (req, res) => {
  if (req.session.adminLoggedIn) {
    res.render('admin/addBanner', { layout: 'adminlayout', admin: true })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/addBanner', store.single('Image'), (req, res, next) => {
  let Image = req.file.filename
  bannerHelpers.AddBanner(Image).then(() => {
    res.redirect('/admin/viewBanner')
  })
})

router.get('/deleteBanner/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    bannerHelpers.deleteBanner(req.params.id).then(() => {
      res.redirect('/admin/viewBanner')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/dashBoard', async (req, res) => {
  if (req.session.adminLoggedIn) {
    let dialyTotalSales = await adminHelper.dialyTotalSales()
    let SalesDate = await adminHelper.SalesDate()
    let arrayLength = dialyTotalSales.length - 1
    let dailySales = dialyTotalSales[arrayLength]
    console.log('dailySales',dailySales);
    console.log('dialyTotalSales',dialyTotalSales);
    console.log('salesDate',SalesDate);
    res.render('admin/admin-dashboard', { SalesDate, dialyTotalSales, layout: 'adminlayout', admin: true })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/coupon', async (req, res) => {
  if (req.session.adminLoggedIn) {
    let coupon = await couponHelpers.getAllCoupon()
    res.render('admin/coupon', { coupon, layout: 'adminlayout', admin: true })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/addCoupon', (req, res) => {
  if (req.session.adminLoggedIn) {
    res.render('admin/addCoupon', { layout: 'adminlayout', admin: true })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/addCoupon', (req, res) => {
  if (req.session.adminLoggedIn) {
    couponHelpers.addCoupon(req.body).then(() => {
      console.log('addCoupon', req.body)
      res.redirect('coupon')
    }).catch((err) => {
      req.session.errmess = err;
      res.redirect('back')
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/deleteCoupon/:id', (req, res) => {
  if (req.session.adminLoggedIn) {
    couponHelpers.deleteCoupon(req.params.id).then(() => {
      res.redirect('back')
    })
  }
})

module.exports = router;
