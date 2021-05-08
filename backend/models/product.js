const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Vă rugăm să introduceți numele produsului"],
    trim: true,
    maxLength: [100, "Numele produsului nu poate depăși 100 de caractere"],
  },
  price: {
    type: Number,
    required: [true, "Vă rugăm să introduceți prețul produsului"],
    maxLength: [5, "Prețul produsului nu poate depăși 5 caractere"],
    default: 0.0,
  },
  description: {
    type: String,
    required: [true, "Vă rugăm să introduceți descrierea produsului"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "Vă rugăm să selectați categoria produsului"],
    enum: {
      values: [
        "Electronice",
        "Camere",
        "Laptopuri",
        "Accessorii",
        "Căști",
        "Mâncare/Băuturi",
        "Cărți",
        "Haine/Pantofi",
        "Frumusețe/Sănătate",
        "Sport",
        "Activități de afară",
        "Casă",
      ],
      message: "Vă rugăm să selectați categoria corectă a produsului",
    },
  },
  seller: {
    type: String,
    required: [true, "Vă rugăm să introduceți vânzâtorul produsului"],
  },
  stock: {
    type: Number,
    required: [true, "Vă rugăm să introduceți stoc-ul produsului"],
    maxLength: [5, "Stoc-ul produsului nu poate depăși 5 caractere"],
    default: 0,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
