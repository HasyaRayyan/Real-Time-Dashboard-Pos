import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import { Plus, Edit2, Trash2, Search, X, Loader2, AlertCircle, ShoppingBag, Filter } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

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
      setError('Gagal memuat data produk atau kategori.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setName('');
    setSku('');
    setPrice('');
    setStock('');
    setDescription('');
    setImageUrl('');
    setSelectedCategoryIds([]);
    setModalError('');
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setModalMode('edit');
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setDescription(product.description || '');
    setImageUrl(product.imageUrl || '');
    setSelectedCategoryIds(product.categories.map((c) => c.id));
    setModalError('');
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleToggleCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !price || !stock) {
      setModalError('Harap isi semua kolom wajib (*)');
      return;
    }

    setModalLoading(true);
    setModalError('');

    const payload = {
      name,
      sku,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      description,
      imageUrl: imageUrl.trim() || null,
      categoryIds: selectedCategoryIds,
    };

    try {
      if (modalMode === 'add') {
        const response = await api.post('/products', payload);
        setProducts((prev) => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const response = await api.put(`/products/${selectedProduct.id}`, payload);
        setProducts((prev) =>
          prev
            .map((p) => (p.id === selectedProduct.id ? response.data : p))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      !selectedFilterCategory ||
      product.categories.some((cat) => cat.id === selectedFilterCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Katalog Produk</h1>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">
                Atur informasi produk, SKU, harga jual, serta status ketersediaan barang
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-550 active:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md shadow-emerald-600/10 transition-all self-start md:self-auto"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Tambah Produk</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari SKU atau nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium"
                />
              </div>

              {/* Category Filter */}
              <div className="relative min-w-[180px]">
                <Filter className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-8 text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all appearance-none cursor-pointer font-semibold"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-3.5 pointer-events-none w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-500"></span>
              </div>
            </div>

            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Total: {filteredProducts.length} Produk
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center space-x-3 mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Products Grid/Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-450">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-semibold text-slate-500">Memuat katalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-500 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-800 text-sm">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan ubah kata kunci pencarian Anda atau tambahkan produk baru.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-250/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Info Produk</th>
                      <th className="py-4 px-6">SKU / Kode</th>
                      <th className="py-4 px-6">Kategori</th>
                      <th className="py-4 px-6">Harga</th>
                      <th className="py-4 px-6">Stok</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-all">
                        {/* Info Product */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3.5">
                            <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.src = '';
                                  }}
                                />
                              ) : (
                                <ShoppingBag className="h-5 w-5 text-slate-300" />
                              )}
                            </div>
                            <div className="overflow-hidden max-w-[220px]">
                              <p className="font-extrabold text-slate-900 truncate leading-tight">{product.name}</p>
                              <p className="text-xs text-slate-400 truncate mt-1">{product.description || '-'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono text-xs text-slate-400">{product.sku}</td>

                        {/* Category list tags */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {product.categories.length > 0 ? (
                              product.categories.map((cat) => (
                                <span
                                  key={cat.id}
                                  className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100/50"
                                >
                                  {cat.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 italic">Tanpa Kategori</span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-black text-slate-900">
                          Rp {product.price.toLocaleString('id-ID')}
                        </td>

                        {/* Stock pill statuses */}
                        <td className="py-4 px-6">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-xs leading-none inline-block ${
                              product.stock <= 5
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : product.stock <= 10
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}
                          >
                            {product.stock} pcs
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-emerald-600 hover:text-emerald-700 rounded-xl transition-all"
                              title="Ubah"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-rose-600 hover:text-rose-700 rounded-xl transition-all"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-extrabold text-slate-900">
                {modalMode === 'add' ? 'Tambah Produk Baru' : 'Ubah Detail Produk'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1 text-slate-800">
              {modalError && (
                <div className="bg-rose-55 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-bold flex items-center space-x-2 animate-headShake">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Nama Produk <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kopi Caramel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-semibold"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    SKU / Kode <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: COF-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-mono font-semibold"
                  />
                </div>

                {/* Harga */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Harga Jual <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 18000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-semibold"
                  />
                </div>

                {/* Stok */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Stok Awal <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* URL Gambar */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  URL Gambar Produk (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium"
                />
              </div>

              {/* Kategori Pills */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Pilih Kategori (Bisa Lebih Dari Satu)
                </label>
                {categories.length === 0 ? (
                  <p className="text-xs text-amber-600 italic">
                    Kategori kosong. Buat kategori terlebih dahulu.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-55 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
                    {categories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-emerald-55 border-emerald-500 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-700'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Deskripsi Produk
                </label>
                <textarea
                  placeholder="Deskripsi singkat produk..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all resize-none font-medium"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-550 active:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/10"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
