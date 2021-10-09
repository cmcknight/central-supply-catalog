// ----- Shopping Cart-related functionality -----
const cartKey = "csc-cart"; // key for localStorage shopping cart

// powers of 10
const unitMultiplier = { Cr: 0, KCr: 3, MCr: 6, BCr: 9, TCr: 12 };

// Apply units to values
const setUnitLabel = (value, shorten) => {
  let text = "";

  if (value > 999999999999) {
    text = shorten === false ? `${value / 10 ** 12} TCr` : `${(value / 10 ** 12).toFixed(3)} TCr`;
  } else if (value > 999999999) {
    text = shorten === false ? `${value / 10 ** 9} BCr` : `${(value / 10 ** 9).toFixed(3)} BCr`;
  } else if (value > 999999) {
    text = shorten === false ? `${value / 10 ** 6} MCr` : `${(value / 10 ** 6).toFixed(3)} MCr`;
  } else if (value > 999) {
    text = shorten === false ? `${value / 10 ** 3} KCr` : `${(value / 10 ** 3).toFixed(3)} KCr`;
  } else {
    text = `${value} Cr`;
  }
  return text;
};

//-------------------------------------------------------------
// Extract marked summary from text.
//-------------------------------------------------------------
const extractSummary = (text) => {
  let summary = null;

  // The start and end separators to try and match to extract the summary
  const separatorsList = [
    { start: "<!-- Summary Start -->", end: "<!-- Summary End -->" },
    { start: "<p>", end: "</p>" },
  ];

  separatorsList.some((separators) => {
    const startPosition = text.indexOf(separators.start);

    // This end position could use "lastIndexOf" to return all
    // the paragraphs rather than just the first paragraph when
    // matching is on "<p>" and "</p>".
    const endPosition = text.indexOf(separators.end);

    if (startPosition !== -1 && endPosition !== -1) {
      summary = text.substring(startPosition + separators.start.length, endPosition).trim();
      return true;
    }
  });

  return summary;
};

// ----------------- add item to cart -----------------
const addItem = () => {
  // retrieve the cart from localStorage
  let cart = localStorage.getItem(cartKey);

  // get image src attribute
  const productImage = document.getElementById("prod-img").src;

  // get the price and units
  const unitPrice = document.getElementById("unit-price").dataset.unitprice;

  // get the product name
  const productName = document.getElementById("product-name").textContent;

  // get the quantity
  const productQty = parseInt(document.getElementById("product-qty").value);

  // get the sku
  const productSku = document.getElementById("product-name").getAttribute("data-sku");

  cart = cart === null || cart === undefined ? (cart = []) : (cart = JSON.parse(cart));

  // attempt to get the item from the cart
  let cartProd = cart.find((s) => s.sku === productSku);

  if (cartProd === null || cartProd === undefined) {
    // product not in cart, add to cart
    cart.push({ sku: productSku, qty: productQty, name: productName, unitPrice: unitPrice, image: productImage });
  } else {
    // product is already in cart, update quantity
    cartProd.qty += productQty;
  }

  cart = cart.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  // save cart to localStorage
  localStorage.setItem(cartKey, JSON.stringify(cart));

  // update shopping cart badge
  updateCartBadge();

  M.toast({ html: "Item added to cart", displayLength: 8000 });
};

// ----------------- remove item from cart ----------------------
const removeItem = (sku) => {
  let cart = JSON.parse(localStorage.getItem(cartKey));
  if (cart !== null && cart !== undefined) {
    cart = cart.filter((item) => item.sku !== sku);
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartUI();
    updateCartBadge();
  }
};

// ---------------- modify quantity of item ----------------------
const updateItemQty = (sku, qty) => {
  let cartContents = localStorage.getItem(cartKey);
  if (cartContents !== null && cartContents !== undefined) {
    let cart = JSON.parse(cartContents);
    let item = cart.find((s) => s.sku === sku);
    if (qty < 0) qty = 0;

    if ((item === null) | (item === undefined)) {
      console.log(`Sku: ${sku} is not in cart`);
    } else {
      item.qty = qty;
    }
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartUI();
  }
};

// -------------------- update the cart ui -------------------------
const updateCartUI = () => {
  let cart = JSON.parse(localStorage.getItem(cartKey));
  let itemContainer = document.querySelector(".cart-items-container");
  let cartTotal = document.querySelector(".cart-total");
  let text = "";
  let total = 0;

  if (cart === null || cart === undefined || cart.length === 0) {
    console.log("No items in cart");
    text = `<div class="row">
              <h5 class="center">No items in cart</h5>
            </div>`;
  } else {
    cart.forEach((item) => {
      text += `
      <div class="row product-row">

        <div class="prod-img col s3 m2 l2">
          <a href="#">
            <img src="${item.image}" class="responsive-img" alt="${item.name}">
          </a>
        </div>

        <div class="col s9 m10">
          <div class="row">

            <div class="prod-title col s8">
                <a href="{{ ../products/${item.name} | url }}" data-sku="${item.sku}" class="item-name">${item.name}</a>
            </div>

            <div class="prod-total col s4 right-align right">
              ${setUnitLabel(item.qty * item.unitPrice, false)}
            </div>

          </div>

          <div class="row">
            <div class="col s12 prod-qty">
                  <button><i class="fa fa-minus subtract-btn"></i></button>
                  <input type="number" class="qty" value="${item.qty}">
                  <button><i class="fa fa-plus add-btn"></i></button>
                  <button class="remove-item"><i class="fa fa-trash"></i></button>
            </div>
          </div>
        </div>

        </div>

      </div>
      `;
      total += item.unitPrice * item.qty;
    });
  }

  if (cart.length === 0) {
    // cart is empty, no display
    cartTotal.innerHTML = "";
  } else {
    // set cart total
    cartTotal.innerHTML = `Total: ${setUnitLabel(total, false)}`;
  }

  itemContainer.innerHTML = text;
};

// --------- set up listener for click events on cart items --------------
const cartItemsList = document.querySelector(".cart-items-container");
if (cartItemsList !== null && cartItemsList !== undefined) {
  // event for manually changing quantity
  cartItemsList.addEventListener("change", (e) => {
    e.preventDefault;
    if (e.target.className === "qty") {
      let qtyNode = e.target.parentNode.parentNode.querySelector(".qty");
      let qty = Number(qtyNode.value);
      let sku = e.target.parentNode.parentNode.parentNode.querySelector(".item-name").dataset.sku;
      updateItemQty(sku, qty);
    }
  });

  // event for handling button clicks
  cartItemsList.addEventListener("click", (e) => {
    e.preventDefault;

    let qtyNode = e.target.parentNode.parentNode.querySelector(".qty");
    let qty = Number(qtyNode.value);

    let sku = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector(".item-name").dataset.sku;

    if (e.target.className.includes("fa-minus")) {
      // update the cart
      updateItemQty(sku, qty - 1);
    } else if (e.target.className.includes("fa-plus")) {
      // update the cart
      updateItemQty(sku, qty + 1);
    } else if (e.target.className.includes("fa-trash")) {
      removeItem(sku);
    }
  });
}

// ------------------ Remove all items from cart ----------------------
const removeAllItemsBtn = document.getElementById("empty-cart");
if (removeAllItemsBtn !== null && removeAllItemsBtn !== undefined) {
  removeAllItemsBtn.addEventListener("click", () => {
    localStorage.setItem(cartKey, JSON.stringify([]));
    document.querySelector(".cart-total").textContent = "";
    updateCartUI();
    updateCartBadge();
  });
}

// ---------- Manage Cart Count Badge ---------------------

const updateCartBadge = () => {
  const cartCountSpan = document.getElementById("cart-badge");
  let cart = JSON.parse(localStorage.getItem(cartKey));
  let cartCount = cart === null || cart === undefined ? 0 : cart.length;

  if (cartCount === 0) {
    cartCountSpan.style.display = "none";
  } else {
    cartCountSpan.textContent = cartCount;
    cartCountSpan.style.display = "block";
  }
};
// ---- End of Shopping Cart-related Functionality --------

// ------------ Search-related Functionality ---------------
const searchField = document.getElementById("search");
const clearSearch = document.getElementById("search-close");
const searchBar = document.querySelector(".search-bar");

if (searchField !== null && searchField !== undefined) {
  searchField.addEventListener("search", (e) => {
    e.preventDefault();
    // console.log(`${window.location.origin}/?s=${e.target.value}`);
    window.location.href = `${window.location.origin}/?s=${e.target.value.replace(/\s+/g, "+")}`;
  });
}

// set up listener
window.addEventListener("load", (event) => {
  const params = new URLSearchParams(window.location.search);

  // console.log(`params: ${params}`);
  if (params.has("s")) {
    // collection search parameters
    const searchParams = params.get("s");
    // console.log(`searchParams: ${searchParams}`);
    // perform search
    performSiteSearch(searchParams);
  }
});

const performSiteSearch = (params) => {
  let searchIndexLocation = "_data/searchindex.idx";
  // console.log(`(performSiteSearch) Params: ${params}`);
  fetch(searchIndexLocation, {
    method: "GET",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
  })
    .then((resp) => resp.json())
    .then((data) => {
      // console.log(data);

      /**
       * Future fields to support filtering
       *  category
       *  type
       *  subtype
       *  mass
       *  size
       *  techLevel
       */

      const miniSearch = new MiniSearch({
        fields: [
          "sku",
          "name",
          "description",
          "cost",
    ],
        storeFields: [
          "sku", 
          "name", 
          "description", 
          "cost"],
      });

      miniSearch.addAll(data);

      let results = miniSearch.search(params, {
        prefix: true
      });

      // start of search results content body
      let str = '<div class="black red-text search-results-container" id="content-body">';

      str += `<h6>Search found ${results.length} results for: ${params}</h6>`

      str += `<div class="container black-text">`

      results.forEach(product => {
        img = (product.image) ? product.image : '/img/products/no-image.png'
        str += `
          <div class="search-result-row row white col s12">
            <div class="prod-img col s3 m2">
              <img src ="${img}" class="responsive-img" alt="{{${product.name}}}">
            </div>
        `;

      let prodlink = '/products/'+product.sku

      str += `
          <div class="product-summary col s9 m10">
            <a href="${prodlink}"><h6>${product.name}</h6></a>
            <p>${extractSummary(product.description)}</p>
            <div class="valign-wrapper">
              <h6 class="right-align">${setUnitLabel(product.cost, true)}</h6>
            </div>
          </div>
        </div>
      `
      });

      // mark end of container search results content body
      str += `</div>
      </div>`

      const contentBody = document.querySelector('.departments-container');

      contentBody.innerHTML = '';
      contentBody.innerHTML = str;
    })
    .catch((err) => console.log(err));
};
// ---------- End of Search-related Functionality ----------

// -------------------  Pager  -----------------------------
let pager = document.getElementById("pager");
if (pager !== null && pager !== undefined) {
  pager.addEventListener("change", (e) => {
    let target = document.location.href.replace(/[0-9]+\/$/, "");
    target += e.target.value === "1" ? "" : e.target.value;
    pager;
    window.location.assign(target);
  });
}

// ----------------  End of Pager  -------------------------

// --------- Perform initializations ---------
document.addEventListener("DOMContentLoaded", function () {
  // sidenav
  const sideNav = document.querySelector(".sidenav");
  M.Sidenav.init(sideNav, {});

  // modal cards
  const modals = document.querySelectorAll(".modal");
  M.Modal.init(modals, {});

  // selects
  const selects = document.querySelector("select");
  M.FormSelect.init(selects, {});

  // set listener on product page add button
  const addItemBtn = document.getElementById("add-to-cart");
  if (addItemBtn !== null && addItemBtn !== undefined) {
    addItemBtn.addEventListener("click", addItem);
  }

  // update the cart badge
  updateCartBadge();

  // update shopping cart ui if on shopping cart page
  if (window.location.href.includes("shopping-cart")) {
    updateCartUI();
  }
});

window.addEventListener("pageshow", () => {
  let pagerForm = document.getElementById("pager-form");
  if (pagerForm !== null && pagerForm !== undefined) {
    pagerForm.reset();
  }
});
