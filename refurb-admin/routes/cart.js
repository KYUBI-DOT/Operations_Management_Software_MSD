// routes/cart.js
import express from "express";

const router = express.Router();

// ---- helpers ----
function getCart(req) {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
}
function asMoney(n) {
  return (Number(n) || 0).toFixed(2);
}
function calcTotals(cart) {
  const subtotal = cart.reduce((s, it) => s + (Number(it.price) * Number(it.qty || 1)), 0);
  const shipping = cart.length ? 20 : 0;      // flat example
  const taxRate  = 0.10;                      // 10% example
  const tax      = subtotal * taxRate;
  const total    = subtotal + tax + shipping;
  return { subtotal, shipping, tax, taxRate, total };
}

// ---- pages ----
router.get("/", (req, res) => {
  const cart = getCart(req);
  res.render("cart/index", {
    title: "Your Cart",
    active: "shop",
    cart,
    totals: calcTotals(cart),
  });
});

router.get("/checkout", (req, res) => {
  const cart = getCart(req);
  if (!cart.length) return res.redirect("/cart");
  res.render("cart/checkout", {
    title: "Checkout",
    active: "shop",
    cart,
    totals: calcTotals(cart),
    form: {}, // empty form
    errors: {},
  });
});

// simulate order creation
router.post("/checkout", (req, res) => {
  const cart = getCart(req);
  if (!cart.length) return res.redirect("/cart");

  const { full_name, email, phone, address, city, state, postcode, pay_method } = req.body;
  // basic validation
  const errors = {};
  if (!full_name) errors.full_name = "Required";
  if (!email)     errors.email = "Required";
  if (!address)   errors.address = "Required";
  if (!city)      errors.city = "Required";
  if (!postcode)  errors.postcode = "Required";

  if (Object.keys(errors).length) {
    return res.status(422).render("cart/checkout", {
      title: "Checkout",
      active: "shop",
      cart,
      totals: calcTotals(cart),
      form: req.body,
      errors,
    });
  }

  // generate fake order id, clear cart
  const orderId = Math.floor(100000 + Math.random()*899999);
  const totals = calcTotals(cart);
  const order  = { id: orderId, items: cart, totals, pay_method, full_name, email };

  req.session.lastOrder = order;
  req.session.cart = [];

  return res.redirect("/cart/success");
});

router.get("/success", (req, res) => {
  const order = req.session.lastOrder;
  if (!order) return res.redirect("/shop");
  res.render("cart/success", {
    title: "Order Confirmed",
    active: "shop",
    order
  });
});

// ---- cart mutations ----
router.post("/add", (req, res) => {
  const { id, brand, model, grade, price } = req.body;
  if (!id) return res.redirect("/shop");

  const cart = getCart(req);
  const existing = cart.find(i => String(i.id) === String(id));
  if (existing) {
    existing.qty = Number(existing.qty || 1) + 1;
  } else {
    cart.push({
      id,
      brand: brand || "",
      model: model || "",
      grade: grade || "",
      price: Number(price) || 0,
      qty: 1
    });
  }
  res.redirect("/cart");
});

router.post("/update", (req, res) => {
  const { id, qty } = req.body;
  const cart = getCart(req);
  const item = cart.find(i => String(i.id) === String(id));
  if (item) {
    const n = Math.max(0, parseInt(qty, 10) || 0);
    item.qty = n;
    req.session.cart = cart.filter(i => i.qty > 0);
  }
  res.redirect("/cart");
});

router.post("/remove", (req, res) => {
  const { id } = req.body;
  const cart = getCart(req);
  req.session.cart = cart.filter(i => String(i.id) !== String(id));
  res.redirect("/cart");
});

router.post("/clear", (req, res) => {
  req.session.cart = [];
  res.redirect("/cart");
});

export default router;
