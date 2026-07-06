/* ============================================================
   WOLF PACK — Admin Panel JavaScript
   Firebase Firestore + Storage CRUD
   ============================================================ */

(function () {
  'use strict';

  /* --------------------------------------------------------
     FIREBASE CONFIG
     -------------------------------------------------------- */
  const firebaseConfig = {
    apiKey: "AIzaSyCwlXMIMX1WNzYGYCLjEBSvG93NGvgx7eo",
    authDomain: "wolfpack1995.firebaseapp.com",
    projectId: "wolfpack1995",
    storageBucket: "wolfpack1995.firebasestorage.app",
    messagingSenderId: "257601244012",
    appId: "1:257601244012:web:d3a1974e95c1adf5210149",
    measurementId: "G-CG43R46FX5"
  };

  /* --------------------------------------------------------
     STATE
     -------------------------------------------------------- */
  let db, storage;
  let products = [];
  let banners = [];
  let editingProductId = null;
  const ADMIN_PASSWORD = 'wolfpack@admin';

  /* --------------------------------------------------------
     INIT
     -------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();

    setupLogin();
    setupTabs();
    setupModal();
    setupImageUpload();
    setupOfferPanel();
    setupBannersPanel();
  });

  /* --------------------------------------------------------
     LOGIN
     -------------------------------------------------------- */
  function setupLogin() {
    const loginScreen = document.getElementById('login-screen');
    const adminLayout = document.getElementById('admin-layout');
    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error');

    // Check session
    if (sessionStorage.getItem('wolfpack_admin') === 'true') {
      loginScreen.style.display = 'none';
      adminLayout.classList.add('visible');
      loadData();
      return;
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('admin-password').value;

      // Check against Firestore config, fallback to local
      try {
        const configDoc = await db.collection('config').doc('admin').get();
        const storedPassword = configDoc.exists ? configDoc.data().password : ADMIN_PASSWORD;

        if (password === storedPassword) {
          sessionStorage.setItem('wolfpack_admin', 'true');
          loginScreen.style.display = 'none';
          adminLayout.classList.add('visible');
          loadData();
          errorMsg.classList.remove('show');
        } else {
          errorMsg.textContent = 'Incorrect password. Try again.';
          errorMsg.classList.add('show');
        }
      } catch (err) {
        // Firestore not available, use local password
        if (password === ADMIN_PASSWORD) {
          sessionStorage.setItem('wolfpack_admin', 'true');
          loginScreen.style.display = 'none';
          adminLayout.classList.add('visible');
          loadData();
        } else {
          errorMsg.textContent = 'Incorrect password. Try again.';
          errorMsg.classList.add('show');
        }
      }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      sessionStorage.removeItem('wolfpack_admin');
      location.reload();
    });
  }

  /* --------------------------------------------------------
     TABS
     -------------------------------------------------------- */
  function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(target).classList.add('active');
      });
    });
  }

  /* --------------------------------------------------------
     LOAD DATA
     -------------------------------------------------------- */
  async function loadData() {
    await loadProducts();
    await loadOffer();
    await loadBanners();
  }

  /* --------------------------------------------------------
     PRODUCTS — READ
     -------------------------------------------------------- */
  async function loadProducts() {
    try {
      const snapshot = await db.collection('products').orderBy('order', 'asc').get();
      products = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
      renderProductTable();
      updateStats();
    } catch (err) {
      console.error('Error loading products:', err);
      toast('Failed to load products', 'error');
    }
  }

  function renderProductTable() {
    const tbody = document.getElementById('products-tbody');
    const emptyState = document.getElementById('products-empty');

    if (products.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = products.map(p => {
      const tagHTML = p.tag
        ? `<span class="table-tag ${p.tag}">${p.tag.toUpperCase()}</span>`
        : '<span style="color:var(--gray-400)">—</span>';

      return `
        <tr>
          <td><img src="${p.imageUrl || ''}" alt="${p.name}" class="table-img" onerror="this.src='logo-final.png'" /></td>
          <td><strong>${p.name}</strong></td>
          <td>${p.price}</td>
          <td>${getCategoryLabel(p.category)}</td>
          <td>${tagHTML}</td>
          <td>
            <div class="table-actions">
              <button class="btn-edit" onclick="window.adminEditProduct('${p.id}')">Edit</button>
              <button class="btn-delete" onclick="window.adminDeleteProduct('${p.id}', '${p.name}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function updateStats() {
    document.getElementById('stat-total').textContent = products.length;
    document.getElementById('stat-bestsellers').textContent = products.filter(p => p.tag === 'bestseller').length;
    document.getElementById('stat-limited').textContent = products.filter(p => p.tag === 'limited').length;
  }

  /* --------------------------------------------------------
     PRODUCTS — CREATE / UPDATE
     -------------------------------------------------------- */
  function setupModal() {
    const overlay = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const addBtn = document.getElementById('add-product-btn');
    const closeBtn = overlay.querySelector('.modal-close');
    const cancelBtn = document.getElementById('modal-cancel');

    addBtn.addEventListener('click', () => {
      editingProductId = null;
      form.reset();
      clearImagePreview();
      document.getElementById('modal-title').textContent = 'Add New Product';
      document.getElementById('modal-submit-text').textContent = 'Add Product';
      overlay.classList.add('open');
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    cancelBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });

    form.addEventListener('submit', handleProductSubmit);
  }

  async function handleProductSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('modal-submit');
    const submitText = document.getElementById('modal-submit-text');

    submitBtn.disabled = true;
    submitText.textContent = 'Saving...';

    try {
      const name = document.getElementById('prod-name').value.trim();
      const price = document.getElementById('prod-price').value.trim();
      const category = document.getElementById('prod-category').value;
      const tag = document.getElementById('prod-tag').value || null;
      const order = parseInt(document.getElementById('prod-order').value) || products.length + 1;

      let imageUrl = '';

      // Check if there's a new image to upload
      const fileInput = document.getElementById('prod-image');
      if (fileInput.files.length > 0) {
        imageUrl = await uploadImage(fileInput.files[0], name);
      } else if (editingProductId) {
        // Keep existing image
        const existing = products.find(p => p.id === editingProductId);
        imageUrl = existing ? existing.imageUrl : '';
      }

      const productData = {
        name,
        price,
        category,
        tag,
        imageUrl,
        order,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (editingProductId) {
        await db.collection('products').doc(editingProductId).update(productData);
        toast('Product updated successfully!', 'success');
      } else {
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('products').add(productData);
        toast('Product added successfully!', 'success');
      }

      document.getElementById('product-modal').classList.remove('open');
      await loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      toast('Failed to save product: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitText.textContent = editingProductId ? 'Update Product' : 'Add Product';
    }
  }

  /* --------------------------------------------------------
     PRODUCTS — EDIT
     -------------------------------------------------------- */
  window.adminEditProduct = function (id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-tag').value = product.tag || '';
    document.getElementById('prod-order').value = product.order || 1;

    // Show existing image
    if (product.imageUrl) {
      showImagePreview(product.imageUrl);
    } else {
      clearImagePreview();
    }

    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('modal-submit-text').textContent = 'Update Product';
    document.getElementById('product-modal').classList.add('open');
  };

  /* --------------------------------------------------------
     PRODUCTS — DELETE
     -------------------------------------------------------- */
  window.adminDeleteProduct = async function (id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await db.collection('products').doc(id).delete();
      toast(`"${name}" deleted.`, 'success');
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast('Failed to delete product', 'error');
    }
  };

  /* --------------------------------------------------------
     IMAGE UPLOAD
     -------------------------------------------------------- */
  function setupImageUpload() {
    const fileInput = document.getElementById('prod-image');
    const uploadArea = document.querySelector('.image-upload-area');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => showImagePreview(ev.target.result);
        reader.readAsDataURL(file);
      }
    });

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--gold)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        const reader = new FileReader();
        reader.onload = (ev) => showImagePreview(ev.target.result);
        reader.readAsDataURL(e.dataTransfer.files[0]);
      }
    });
  }

  async function uploadImage(file, productName) {
    const safeName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filePath = `products/${safeName}-${timestamp}.${ext}`;

    const ref = storage.ref().child(filePath);
    const snapshot = await ref.put(file);
    const url = await snapshot.ref.getDownloadURL();
    return url;
  }

  function showImagePreview(src) {
    const area = document.querySelector('.image-upload-area');
    const defaultContent = area.querySelector('.upload-default');
    let preview = area.querySelector('.image-preview');

    if (!preview) {
      preview = document.createElement('img');
      preview.className = 'image-preview';
      area.appendChild(preview);
    }

    preview.src = src;
    preview.style.display = 'block';
    if (defaultContent) defaultContent.style.display = 'none';
    area.classList.add('has-image');
  }

  function clearImagePreview() {
    const area = document.querySelector('.image-upload-area');
    const preview = area.querySelector('.image-preview');
    const defaultContent = area.querySelector('.upload-default');

    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
    if (defaultContent) defaultContent.style.display = 'block';
    area.classList.remove('has-image');
  }

  /* --------------------------------------------------------
     OFFERS
     -------------------------------------------------------- */
  function setupOfferPanel() {
    const form = document.getElementById('offer-form');
    const toggle = document.getElementById('offer-enabled');
    const preview = document.getElementById('offer-preview');
    const textInput = document.getElementById('offer-text');

    // Live preview
    textInput.addEventListener('input', () => {
      preview.textContent = textInput.value || 'Your offer text here...';
    });

    toggle.addEventListener('change', () => {
      preview.style.display = toggle.checked ? 'block' : 'none';
    });

    form.addEventListener('submit', handleOfferSubmit);
  }

  async function loadOffer() {
    try {
      const doc = await db.collection('offers').doc('active').get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('offer-enabled').checked = data.enabled || false;
        document.getElementById('offer-text').value = data.text || '';

        const preview = document.getElementById('offer-preview');
        preview.textContent = data.text || 'Your offer text here...';
        preview.style.display = data.enabled ? 'block' : 'none';

        // Update stat
        document.getElementById('stat-offers').textContent = data.enabled ? '1 Active' : 'None';
      }
    } catch (err) {
      console.error('Error loading offer:', err);
    }
  }

  async function handleOfferSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const enabled = document.getElementById('offer-enabled').checked;
      const text = document.getElementById('offer-text').value.trim();

      await db.collection('offers').doc('active').set({
        enabled,
        text,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      document.getElementById('stat-offers').textContent = enabled ? '1 Active' : 'None';
      toast('Offer updated!', 'success');
    } catch (err) {
      console.error('Error saving offer:', err);
      toast('Failed to save offer: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Offer';
    }
  }

  /* --------------------------------------------------------
     SEED INITIAL DATA
     -------------------------------------------------------- */
  window.adminSeedData = async function () {
    if (!confirm('This will add 6 sample products. Continue?')) return;

    const sampleProducts = [
      { name: 'Shadow Oversized Tee', price: '₹1,499', category: 'oversized', tag: 'bestseller', imageUrl: 'assets/images/product-shadow-tee.png', order: 1 },
      { name: 'Apex Muscle Tank', price: '₹999', category: 'gym', tag: 'bestseller', imageUrl: 'assets/images/product-muscle-tank.png', order: 2 },
      { name: 'Iron Will Joggers', price: '₹1,899', category: 'everyday', tag: 'new', imageUrl: 'assets/images/product-joggers.png', order: 3 },
      { name: 'Midnight Hoodie', price: '₹2,499', category: 'everyday', tag: 'bestseller', imageUrl: 'assets/images/product-hoodie.png', order: 4 },
      { name: 'Alpha Compression Tee', price: '₹1,299', category: 'gym', tag: null, imageUrl: 'assets/images/product-compression.png', order: 5 },
      { name: 'Wolf Emblem Tee — Ltd.', price: '₹1,999', category: 'limited', tag: 'limited', imageUrl: 'assets/images/product-limited-tee.png', order: 6 },
    ];

    try {
      const batch = db.batch();
      sampleProducts.forEach(p => {
        const ref = db.collection('products').doc();
        batch.set(ref, {
          ...p,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Also set admin password
      batch.set(db.collection('config').doc('admin'), { password: ADMIN_PASSWORD });

      await batch.commit();
      toast('Sample products added!', 'success');
      await loadProducts();
    } catch (err) {
      console.error('Seed error:', err);
      toast('Failed to seed data: ' + err.message, 'error');
    }
  };

  /* --------------------------------------------------------
     HELPERS
     -------------------------------------------------------- */
  function getCategoryLabel(cat) {
    const labels = {
      oversized: 'Oversized Tees',
      gym: 'Gym Wear',
      everyday: 'Everyday Premium',
      limited: 'Limited Drops',
    };
    return labels[cat] || cat;
  }

  function toast(msg, type) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type} show`;
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  /* --------------------------------------------------------
     BANNERS
     -------------------------------------------------------- */
  function setupBannersPanel() {
    const form = document.getElementById('banner-form');
    const fileInput = document.getElementById('banner-image');
    const uploadArea = document.getElementById('banner-upload-area');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => showBannerPreview(ev.target.result);
        reader.readAsDataURL(file);
      }
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--gold)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        const reader = new FileReader();
        reader.onload = (ev) => showBannerPreview(ev.target.result);
        reader.readAsDataURL(e.dataTransfer.files[0]);
      }
    });

    form.addEventListener('submit', handleBannerSubmit);
  }

  function showBannerPreview(src) {
    const area = document.getElementById('banner-upload-area');
    const defaultContent = area.querySelector('.upload-default');
    let preview = area.querySelector('.image-preview');

    if (!preview) {
      preview = document.createElement('img');
      preview.className = 'image-preview';
      area.appendChild(preview);
    }

    preview.src = src;
    preview.style.display = 'block';
    if (defaultContent) defaultContent.style.display = 'none';
    area.classList.add('has-image');
  }

  function clearBannerPreview() {
    const area = document.getElementById('banner-upload-area');
    const preview = area.querySelector('.image-preview');
    const defaultContent = area.querySelector('.upload-default');

    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
    if (defaultContent) defaultContent.style.display = 'block';
    area.classList.remove('has-image');
  }

  async function loadBanners() {
    try {
      const snapshot = await db.collection('banners').orderBy('order', 'asc').get();
      banners = [];
      snapshot.forEach(doc => {
        banners.push({ id: doc.id, ...doc.data() });
      });
      renderBannerTable();
    } catch (err) {
      console.error('Error loading banners:', err);
    }
  }

  function renderBannerTable() {
    const tbody = document.getElementById('banners-tbody');
    const emptyState = document.getElementById('banners-empty');

    if (banners.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = banners.map(b => {
      return `
        <tr>
          <td><img src="${b.imageUrl}" style="width: 120px; height: auto; border-radius: 4px;" /></td>
          <td>${b.order}</td>
          <td>
            <div class="table-actions">
              <button class="btn-delete" onclick="window.adminDeleteBanner('${b.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function handleBannerSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('banner-submit');
    const fileInput = document.getElementById('banner-image');
    
    if (fileInput.files.length === 0) {
      toast('Please select an image first.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    try {
      const file = fileInput.files[0];
      const order = parseInt(document.getElementById('banner-order').value) || banners.length + 1;
      
      const imageUrl = await uploadImage(file, 'banner');

      const bannerData = {
        imageUrl,
        order,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('banners').add(bannerData);
      toast('Banner added successfully!', 'success');
      
      document.getElementById('banner-form').reset();
      clearBannerPreview();
      await loadBanners();
    } catch (err) {
      console.error('Error saving banner:', err);
      toast('Failed to save banner: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Upload Banner';
    }
  }

  window.adminDeleteBanner = async function (id) {
    if (!confirm(`Delete this banner? This cannot be undone.`)) return;

    try {
      await db.collection('banners').doc(id).delete();
      toast(`Banner deleted.`, 'success');
      await loadBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      toast('Failed to delete banner', 'error');
    }
  };

})();
