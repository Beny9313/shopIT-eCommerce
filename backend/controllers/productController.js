const Product = require("../models/product");
const User = require("../models/user");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary");

const sendEmail = require("../utils/sendEmail");

// Create new product   =>   /api/v1/admin/product/new
exports.newProduct = catchAsyncErrors(async (req, res, next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  let imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "products",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  // Get all subscribed users => /api/v1/admin/user/subscribed

  const users = await User.find({ consent: "true" });
  let subbedEmails = "";

  users.forEach(user => {
    subbedEmails += `${user.email}, `;
  });

  const message = `Bună ziua! \n\n Vă anunțăm, că am adăugat un nou produs ( ${product.name} ) in magazinul nostru online \n\n Puteți accesa linkul următor pentru a vedea mai multe detalii
  \n\n https://shopit-ecommerce-beny.herokuapp.com/product/${product._id} \n\n Vă dorim o zi frumoasă! `;
  const html =
    '<p>Bună ziua!</p> <br /><p>Vă anunțăm, că am adăugat un nou produs <a href = "https://shopit-ecommerce-beny.herokuapp.com/product/' +
    product._id +
    '">( ' +
    product.name +
    ' )</a> in magazinul nostru online</p> <br /><p>Puteți accesa linkul următor pentru a vedea mai multe detalii</p> <br /><a href = "https://shopit-ecommerce-beny.herokuapp.com/product/' +
    product._id +
    '"> Link la produs </a> <br /><br />Vă dorim o zi frumoasă!';

  try {
    await sendEmail({
      email: subbedEmails,
      subject: "A apărut un nou produs pe ShopIT! Profită acum!",
      message,
      html,
    });
  } catch (error) {
    console.log("Am intrat la Eroare");
    //await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }

  res.status(201).json({
    success: true,
    product,
  });
});

// Get all products   =>   /api/v1/products?keyword=apple
exports.getProducts = catchAsyncErrors(async (req, res, next) => {
  const resPerPage = 6;
  const productsCount = await Product.countDocuments();

  const apiFeatures = new APIFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await apiFeatures.query;
  let filteredProductsCount = products.length;

  apiFeatures.pagination(resPerPage);
  products = await apiFeatures.query;

  res.status(200).json({
    success: true,
    productsCount,
    resPerPage,
    filteredProductsCount,
    products,
  });
});

// Get all products (Admin)  =>   /api/v1/admin/products
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Get single product details   =>   /api/v1/product/:id
exports.getSingleProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Produsul căutat nu a fost găsit", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product   =>   /api/v1/admin/product/:id
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Produsul căutat nu a fost găsit", 404));
  }

  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting images associated with the product
    for (let i = 0; i < product.images.length; i++) {
      const result = await cloudinary.v2.uploader.destroy(
        product.images[i].public_id
      );
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product   =>   /api/v1/admin/product/:id
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Produsul căutat nu a fost găsit", 404));
  }

  // Deleting images associated with the product
  for (let i = 0; i < product.images.length; i++) {
    const result = await cloudinary.v2.uploader.destroy(
      product.images[i].public_id
    );
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Produsul a fost șters",
  });
});

// Create new review   =>   /api/v1/review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    r => r.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach(review => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get Product Reviews   =>   /api/v1/reviews
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Product Review   =>   /api/v1/reviews
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  console.log(product);

  const reviews = product.reviews.filter(
    review => review._id.toString() !== req.query.id.toString()
  );

  const numOfReviews = reviews.length;

  const ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
