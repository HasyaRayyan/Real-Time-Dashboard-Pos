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
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 14px; max-width: 300px; margin: auto; }
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

  // Filter transactions by Invoice
  const filteredTransactions = transactions.filter((tx) =>
    tx.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Riwayat Transaksi</h1>
              <p className="text-slate-400 text-sm mt-1">
                Pantau daftar penjualan POS yang sudah selesai dicatat dalam sistem
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nomor invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total: {filteredTransactions.length} Invoice Penjualan
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center space-x-3 mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Table list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm">Memuat riwayat transaksi...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-16 text-center text-slate-500">
              <HistoryIcon className="h-12 w-12 mx-auto mb-3 text-slate-700" />
              <p className="font-semibold text-slate-400">Belum ada transaksi ditemukan</p>
              <p className="text-xs mt-1">Silakan lakukan penjualan di menu POS Kasir terlebih dahulu</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Nomor Invoice</th>
                    <th className="py-4 px-6">Tanggal / Waktu</th>
                    <th className="py-4 px-6">Kasir</th>
                    <th className="py-4 px-6">Metode</th>
                    <th className="py-4 px-6">Total (Rp)</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/20 transition-all">
                      <td className="py-4 px-6 font-semibold text-white">{tx.invoiceNumber}</td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID')} - {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-6 text-slate-300">{tx.cashier?.name}</td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-indigo-400">
                        {tx.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenReceipt(tx)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg transition-all flex items-center space-x-1.5 inline-flex text-xs font-semibold"
                        >
                          <Eye className="h-4 w-4" />
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h2 className="font-bold text-white text-sm">
                Detail Nota: {selectedTransaction.invoiceNumber}
              </h2>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Content Area (For Printing) */}
            <div className="p-6 bg-white text-black text-xs font-mono overflow-y-auto max-h-[50vh]" ref={receiptRef}>
              <div className="text-center mb-4">
                <h3 className="font-bold text-sm uppercase">Rayyan POS Toko</h3>
                <p className="text-[10px] text-gray-500">Jakarta, Indonesia</p>
                <p className="text-[9px] text-gray-500">Tlp: 0812-3456-7890</p>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 mb-3">
                <div className="flex">
                  <span>Nota:</span>
                  <span>{selectedTransaction.invoiceNumber}</span>
                </div>
                <div className="flex">
                  <span>Tanggal:</span>
                  <span>{new Date(selectedTransaction.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex">
                  <span>Kasir:</span>
                  <span>{selectedTransaction.cashier?.name || 'Kasir'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-dashed border-gray-400 py-2 space-y-1.5">
                {selectedTransaction.items.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between font-bold">
                      <span className="truncate max-w-[150px]">{item.product.name}</span>
                      <span>{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {item.quantity} x {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>GRAND TOTAL</span>
                  <span>Rp {selectedTransaction.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({selectedTransaction.paymentMethod})</span>
                  <span>Rp {selectedTransaction.amountPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian</span>
                  <span>Rp {selectedTransaction.changeAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 mt-4 pt-3 text-center">
                <p className="font-bold text-[10px] uppercase">Terima Kasih</p>
                <p className="text-[8px] text-gray-400 mt-0.5">Silakan Berkunjung Kembali</p>
              </div>
            </div>

            {/* Modal actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end space-x-2.5">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 border border-slate-800 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5"
              >
                <X className="h-4 w-4" />
                <span>Tutup</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/10"
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
