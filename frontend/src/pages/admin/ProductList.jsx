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

  // Filter products based on search term and category
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
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Kelola Produk</h1>
              <p className="text-slate-400 text-sm mt-1">
                Atur katalog, harga, stok, serta pengelompokan kategori produk Anda
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm shadow-md shadow-indigo-600/10 transition-all self-start md:self-auto"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Tambah Produk</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari SKU atau nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Category Filter */}
              <div className="relative min-w-[180px]">
                <Filter className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Menampilkan {filteredProducts.length} dari {products.length} Produk
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center space-x-3 mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Products Grid/Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm">Memuat data produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-16 text-center text-slate-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-slate-700" />
              <p className="font-semibold text-slate-400">Tidak ada produk ditemukan</p>
              <p className="text-xs mt-1">
                Belum ada produk yang ditambahkan atau filter pencarian terlalu spesifik.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Info Produk</th>
                      <th className="py-4 px-6">SKU / Kode</th>
                      <th className="py-4 px-6">Kategori</th>
                      <th className="py-4 px-6">Harga (Rp)</th>
                      <th className="py-4 px-6">Stok</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-800/20 transition-all">
                        {/* Info Produk with Image thumbnail */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.src = ''; // Clear image to show placeholder
                                  }}
                                />
                              ) : (
                                <ShoppingBag className="h-5 w-5 text-slate-700" />
                              )}
                            </div>
                            <div className="overflow-hidden max-w-[200px]">
                              <p className="font-semibold text-white truncate">{product.name}</p>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{product.description || '-'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono text-xs text-slate-400">{product.sku}</td>

                        {/* Many Categories Display */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {product.categories.length > 0 ? (
                              product.categories.map((cat) => (
                                <span
                                  key={cat.id}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
                                >
                                  {cat.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] font-bold text-slate-600 italic">Tanpa Kategori</span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-semibold text-white">
                          {product.price.toLocaleString('id-ID')}
                        </td>

                        {/* Dynamic Stock Colors */}
                        <td className="py-4 px-6">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-xs ${
                              product.stock <= 5
                                ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                                : product.stock <= 10
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
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
                              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1.5 bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/30 text-rose-400 hover:text-rose-300 rounded-lg transition-all"
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h2 className="font-bold text-white">
                {modalMode === 'add' ? 'Tambah Produk Baru' : 'Ubah Detail Produk'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg font-medium flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Produk */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Nama Produk <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Nasi Goreng Gila"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    SKU / Barcode <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: NSG-008"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Harga */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Harga Jual (Rp) <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Stok */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Stok Awal <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* URL Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  URL Gambar Produk (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="https://domain.com/gambar-produk.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Kategori Multi-Pills Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Kategori Produk (Bisa Pilih Lebih dari Satu)
                </label>
                {categories.length === 0 ? (
                  <p className="text-xs text-amber-400 italic">
                    Belum ada kategori terdaftar. Silakan buat kategori terlebih dahulu.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg max-h-36 overflow-y-auto">
                    {categories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Deskripsi Produk
                </label>
                <textarea
                  placeholder="Deskripsi singkat produk makanan/minuman..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:bg-slate-800 rounded-lg text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg text-sm flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/10"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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
