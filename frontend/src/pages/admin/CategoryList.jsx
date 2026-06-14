import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import { Plus, Edit2, Trash2, Search, X, Loader2, AlertCircle, FolderOpen } from 'lucide-react';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat kategori. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setCategoryName('');
    setModalError('');
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleOpenEdit = (category) => {
    setModalMode('edit');
    setCategoryName(category.name);
    setModalError('');
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setModalError('Nama kategori tidak boleh kosong.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (modalMode === 'add') {
        const response = await api.post('/categories', { name: categoryName });
        setCategories((prev) => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const response = await api.put(`/categories/${selectedCategory.id}`, { name: categoryName });
        setCategories((prev) =>
          prev
            .map((cat) => (cat.id === selectedCategory.id ? response.data : cat))
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
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;

    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menghapus kategori. Kategori mungkin masih digunakan oleh produk.');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kategori Produk</h1>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">Kelompokkan katalog produk Anda untuk pencarian yang lebih cepat</p>
            </div>
            
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-555 active:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md shadow-emerald-600/10 transition-all self-start md:self-auto"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          {/* Search bar & statistics */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium"
              />
            </div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Total: {categories.length} Kategori
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center space-x-3 mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Categories Grid/Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-450">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-semibold text-slate-500">Memuat kategori...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-500 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-800 text-sm">Tidak ada kategori ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Silakan tambahkan kategori baru ke sistem POS Anda.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-250/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Nama Kategori</th>
                    <th className="py-4 px-6">Slug URL</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-4 px-6 font-extrabold text-slate-900">{category.name}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs">{category.slug}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEdit(category)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-emerald-600 hover:text-emerald-700 rounded-xl transition-all"
                            title="Ubah"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
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
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-extrabold text-slate-900">
                {modalMode === 'add' ? 'Tambah Kategori Baru' : 'Ubah Nama Kategori'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
              {modalError && (
                <div className="bg-rose-55 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-bold flex items-center space-x-2 animate-headShake">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kopi Dingin"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-semibold"
                  autoFocus
                />
              </div>

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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-555 active:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/10"
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

export default CategoryList;
