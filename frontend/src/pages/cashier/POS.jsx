import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import { getSocket } from '../../utils/socket';
import {
  Search,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Printer,
  X,
  CreditCard,
  QrCode,
  DollarSign,
  ShoppingBag
} from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  
  // Receipt/Invoice states
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  const receiptRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat katalog produk POS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for live product updates
    const socket = getSocket();
    if (socket) {
      socket.on('product-change', (data) => {
        console.log('POS product list updated via Socket.io!', data);
        if (data.action === 'update') {
          setProducts((prev) =>
            prev.map((p) => (p.id === data.product.id ? data.product : p))
          );
        } else if (data.action === 'create') {
          setProducts((prev) => [...prev, data.product].sort((a, b) => a.name.localeCompare(b.name)));
        } else if (data.action === 'delete') {
          setProducts((prev) => prev.filter((p) => p.id !== data.id));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('product-change');
      }
    };
  }, []);

  const getSubtotal = () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setAmountPaid(getSubtotal().toString());
    } else {
      setAmountPaid('');
    }
  }, [paymentMethod, cart]);

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      alert('Stok produk habis!');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Tidak bisa menambah lebih banyak. Stok terbatas (${product.stock} pcs)`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, change) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + change;
            if (nextQty > product.stock) {
              alert(`Jumlah melebihi batas stok tersedia (${product.stock} pcs)`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (window.confirm('Bersihkan keranjang belanja?')) {
      setCart([]);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    const subtotal = getSubtotal();

    if (cart.length === 0) {
      setCheckoutError('Keranjang masih kosong.');
      return;
    }

    const paidVal = parseFloat(amountPaid);
    if (isNaN(paidVal) || paidVal < subtotal) {
      setCheckoutError(`Jumlah bayar kurang. Total tagihan: Rp ${subtotal.toLocaleString('id-ID')}`);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');

    const payload = {
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      paymentMethod,
      amountPaid: paidVal,
    };

    try {
      const response = await api.post('/transactions/checkout', payload);
      setCompletedTransaction(response.data);
      setCart([]);
      setAmountPaid('');
      setPaymentMethod('CASH');
      setShowReceipt(true);
    } catch (err) {
      console.error(err);
      setCheckoutError(err.response?.data?.message || 'Gagal memproses checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Struk Pembayaran</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 14px; max-width: 300px; margin: auto; color: #000; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .flex { display: flex; justify-content: space-between; }
            .border-top { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      !selectedCategory ||
      product.categories.some((cat) => cat.id === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const grandTotal = getSubtotal();
  const paidFloat = parseFloat(amountPaid) || 0;
  const changeDue = paymentMethod === 'CASH' && paidFloat >= grandTotal ? paidFloat - grandTotal : 0;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />

      {/* POS Content Grid */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Product Catalog */}
        <section className="flex-1 flex flex-col border-r border-slate-200/80 overflow-hidden p-6">
          {/* Search bar & Category filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Point of Sale (POS)</h1>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border border-emerald-100/50">
                Kasir Aktif
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari menu makanan, minuman, atau SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium"
                />
              </div>

              {/* Category selector capsules */}
              <div className="flex space-x-2 overflow-x-auto pb-1 max-w-full no-scrollbar self-center">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                    selectedCategory === ''
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-600/10'
                      : 'bg-white border-slate-250/60 text-slate-500 hover:border-slate-350 hover:text-slate-700'
                  }`}
                >
                  Semua Menu
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-600/10'
                        : 'bg-white border-slate-250/60 text-slate-500 hover:border-slate-350 hover:text-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-150 text-rose-600 p-3 rounded-xl flex items-center space-x-2 mb-4">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          )}

          {/* Catalog grid */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-450">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-semibold">Memuat menu makanan...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-white shadow-[0_8px_30px_rgb(0,0,0,0.005)]">
              <ShoppingBag className="h-10 w-10 mb-2 text-slate-300" />
              <p className="font-bold text-xs text-slate-500">Tidak ada produk dalam kategori ini</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pr-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  disabled={product.stock <= 0}
                  onClick={() => handleAddToCart(product)}
                  className={`bg-white border border-slate-200/80 hover:border-emerald-500/80 hover:shadow-md p-3 rounded-2xl transition-all duration-200 text-left flex flex-col h-56 justify-between relative group shadow-[0_4px_15px_rgba(0,0,0,0.015)] ${
                    product.stock <= 0 ? 'opacity-50 cursor-not-allowed border-dashed' : ''
                  }`}
                >
                  {/* Thumbnail container */}
                  <div className="h-24 w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center mb-2.5">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-slate-300" />
                    )}
                  </div>

                  <div className="overflow-hidden">
                    <h5 className="font-extrabold text-xs text-slate-800 truncate leading-tight group-hover:text-emerald-700 transition-colors">{product.name}</h5>
                    <div className="flex items-center space-x-1 mt-1.5">
                      {product.categories.slice(0, 1).map((cat) => (
                        <span key={cat.id} className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {cat.name}
                        </span>
                      ))}
                      {product.categories.length > 1 && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                          +{product.categories.length - 1}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2 w-full">
                    <p className="font-black text-xs text-emerald-600">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      product.stock <= 5 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : 'bg-slate-50 text-slate-400 border border-slate-150/60'
                    }`}>
                      Stok: {product.stock}
                    </span>
                  </div>

                  {/* Out of Stock banner */}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center rounded-2xl">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 px-3 py-1 bg-rose-50 border border-rose-250 rounded-md">
                        Habis
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right Side: Cart panel */}
        <section className="w-full md:w-96 bg-white border-t md:border-t-0 border-slate-200/80 flex flex-col h-full overflow-hidden shadow-2xl">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2 text-emerald-600">
              <ShoppingCart className="h-5 w-5" />
              <h3 className="font-extrabold text-slate-800 text-sm">Pesanan Baru</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors flex items-center space-x-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                <ShoppingCart className="h-10 w-10 mb-2 text-slate-200" />
                <p className="font-bold text-xs text-slate-500">Keranjang Kosong</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Pilih menu makanan untuk menambahkan pesanan</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white border border-slate-200/80 p-3 rounded-xl flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="overflow-hidden pr-2 flex-1">
                    <p className="font-extrabold text-xs text-slate-800 truncate leading-tight">{item.product.name}</p>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                      Rp {item.product.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    {/* Controls quantity */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="text-rose-500 hover:text-rose-600 p-1 transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Bottom Checkout Drawer */}
          <div className="p-4 border-t border-slate-150 bg-white space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pembayaran</span>
              <span className="text-xl font-black text-slate-900">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="space-y-3.5">
                {checkoutError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] p-2.5 rounded-xl font-bold flex items-center space-x-1.5 animate-headShake">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Payment method selector capsules */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Tunai</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                      paymentMethod === 'CARD'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Kartu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                      paymentMethod === 'QRIS'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>QRIS</span>
                  </button>
                </div>

                {/* Input cash received */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    {paymentMethod === 'CASH' ? 'Uang Tunai Diterima (Rp)' : 'Total Bayar (Otomatis)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={paymentMethod === 'CASH' ? "Contoh: 50000" : ""}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    disabled={paymentMethod !== 'CASH'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-mono font-bold disabled:opacity-75 disabled:text-slate-400"
                  />
                </div>

                {/* Change return details */}
                {paymentMethod === 'CASH' && paidFloat > 0 && (
                  <div className="flex items-center justify-between text-xs py-1 text-slate-500 font-bold border-b border-dashed border-slate-100 pb-2">
                    <span>Kembalian</span>
                    <span className={`font-black text-sm ${changeDue >= 0 ? 'text-emerald-650' : 'text-rose-600'}`}>
                      Rp {changeDue.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-550 active:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-650/20 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-75"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Memproses Pembayaran...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Bayar</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Realistic Receipt Popup Modal */}
      {showReceipt && completedTransaction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Success banner */}
            <div className="bg-emerald-600 p-4 text-center text-white flex flex-col items-center">
              <CheckCircle className="h-8 w-8 mb-1" />
              <h4 className="font-extrabold text-sm leading-none">Pembayaran Lunas</h4>
              <p className="text-[10px] text-emerald-100 font-bold mt-1.5">{completedTransaction.invoiceNumber}</p>
            </div>

            {/* Receipt area */}
            <div className="p-6 bg-amber-50/10 text-slate-900 text-xs font-mono overflow-y-auto max-h-[50vh] border-b border-slate-100" ref={receiptRef}>
              <div className="text-center mb-4">
                <h3 className="font-bold text-sm uppercase">Rayyan Cafe & Resto</h3>
                <p className="text-[10px] text-slate-500">Jakarta, Indonesia</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Tlp: 0812-3456-7890</p>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 mb-3 space-y-0.5">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span>{completedTransaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(completedTransaction.createdAt).toLocaleDateString('id-ID')} {new Date(completedTransaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{completedTransaction.cashier?.name || 'Kasir'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-dashed border-slate-300 py-2 space-y-1.5">
                {completedTransaction.items.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between font-bold text-slate-800">
                      <span className="truncate max-w-[170px]">{item.product.name}</span>
                      <span>{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {item.quantity} x {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1.5">
                <div className="flex justify-between font-bold text-sm text-slate-950">
                  <span>TOTAL TAGIHAN</span>
                  <span>Rp {completedTransaction.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-650">
                  <span>Metode Bayar ({completedTransaction.paymentMethod})</span>
                  <span>Rp {completedTransaction.amountPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-650">
                  <span>Kembalian</span>
                  <span>Rp {completedTransaction.changeAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 mt-4 pt-3 text-center">
                <p className="font-bold text-[10px] uppercase">Terima Kasih</p>
                <p className="text-[9px] text-slate-400 mt-1">Silakan Berkunjung Kembali</p>
              </div>
            </div>

            {/* Modal actions */}
            <div className="p-4 bg-slate-50 flex items-center justify-end space-x-2.5">
              <button
                onClick={() => setShowReceipt(false)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-550 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
              >
                <X className="h-4 w-4" />
                <span>Tutup</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-555 active:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/10"
              >
                <Printer className="h-4.5 w-4.5" />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
