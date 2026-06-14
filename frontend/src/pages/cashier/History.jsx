import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import { Search, Loader2, AlertCircle, History as HistoryIcon, Printer, Eye, X } from 'lucide-react';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Receipt modal states
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const receiptRef = useRef();

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat riwayat transaksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleOpenReceipt = (tx) => {
    setSelectedTransaction(tx);
    setShowReceiptModal(true);
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

  const filteredTransactions = transactions.filter((tx) =>
    tx.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Riwayat Transaksi</h1>
              <p className="text-slate-500 text-sm mt-1.5 font-medium font-medium">
                Pantau seluruh catatan invoice penjualan toko Anda
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium"
              />
            </div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Total: {filteredTransactions.length} Transaksi
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center space-x-3 mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Table list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-450">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-semibold text-slate-500">Memuat riwayat transaksi...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-500 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <HistoryIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-800 text-sm">Belum ada transaksi ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Silakan lakukan penjualan di menu POS Kasir terlebih dahulu</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-250/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Nomor Invoice</th>
                    <th className="py-4 px-6">Tanggal & Waktu</th>
                    <th className="py-4 px-6">Nama Kasir</th>
                    <th className="py-4 px-6">Metode</th>
                    <th className="py-4 px-6">Total Pembayaran</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-4 px-6 font-extrabold text-slate-900">{tx.invoiceNumber}</td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID')} - {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-6 text-slate-700">{tx.cashier?.name}</td>
                      <td className="py-4 px-6">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-50 border border-slate-150/60 text-slate-500">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-black text-emerald-600">
                        Rp {tx.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenReceipt(tx)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-250/60 text-emerald-600 hover:text-emerald-700 rounded-xl transition-all text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs"
                        >
                          <Eye className="h-3.8 w-3.8" />
                          <span>Detail Nota</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* View/Print Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-extrabold text-slate-900 text-sm">
                Nota: {selectedTransaction.invoiceNumber}
              </h2>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 bg-amber-50/10 text-slate-900 text-xs font-mono overflow-y-auto max-h-[50vh] border-b border-slate-100" ref={receiptRef}>
              <div className="text-center mb-4">
                <h3 className="font-bold text-sm uppercase">Rayyan Cafe & Resto</h3>
                <p className="text-[10px] text-slate-500">Jakarta, Indonesia</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Tlp: 0812-3456-7890</p>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 mb-3 space-y-0.5">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span>{selectedTransaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(selectedTransaction.createdAt).toLocaleDateString('id-ID')} {new Date(selectedTransaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{selectedTransaction.cashier?.name || 'Kasir'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-dashed border-slate-300 py-2 space-y-1.5">
                {selectedTransaction.items.map((item) => (
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
                  <span>Rp {selectedTransaction.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-650">
                  <span>Metode Bayar ({selectedTransaction.paymentMethod})</span>
                  <span>Rp {selectedTransaction.amountPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-650">
                  <span>Kembalian</span>
                  <span>Rp {selectedTransaction.changeAmount.toLocaleString('id-ID')}</span>
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
                onClick={() => setShowReceiptModal(false)}
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
                <span>Cetak Ulang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
