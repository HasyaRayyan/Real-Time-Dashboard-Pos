import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import { getSocket } from '../../utils/socket';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  PackageCheck,
  AlertTriangle,
  Clock,
  TrendingDown,
  Loader2,
  Package
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const pollingTimer = useRef(null);

  // Custom Emerald green gradient pallet for bar chart cells
  const BAR_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  const fetchDashboardStats = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch dashboard statistics:', err);
      setError('Gagal memuat statistik. Pastikan server API berjalan.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(true);

    const socket = getSocket();
    if (socket) {
      if (socket.connected) {
        setSocketConnected(true);
      }
      socket.on('connect', () => {
        setSocketConnected(true);
      });
      socket.on('disconnect', () => {
        setSocketConnected(false);
      });
      socket.on('new-transaction', (transaction) => {
        console.log('Live transaction received via Socket.io!', transaction);
        fetchDashboardStats(false);
      });
      socket.on('product-change', (data) => {
        console.log('Live product change received via Socket.io!', data);
        fetchDashboardStats(false);
      });
    }

    // Fallback Short Polling (every 5 seconds) for Serverless Vercel
    pollingTimer.current = setInterval(() => {
      fetchDashboardStats(false);
    }, 5000);

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('new-transaction');
        socket.off('product-change');
      }
      if (pollingTimer.current) {
        clearInterval(pollingTimer.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Memuat analisis penjualan...</p>
        </div>
      </div>
    );
  }

  const { metrics, salesTrend, popularProducts, lowStockProducts, recentTransactions } = stats || {};

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header & Connection Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Real-Time</h1>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">Visualisasikan penjualan, omset, dan arus transaksi toko Anda</p>
            </div>
            
            {/* Live indicator badge light mode */}
            <div className="self-start sm:self-auto flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${socketConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'} block`}></span>
              <span className={socketConnected ? 'text-emerald-700' : 'text-amber-700'}>
                {socketConnected ? 'Koneksi WS Aktif' : 'Koneksi Serverless'}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center space-x-3 mb-6">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Cards KPI Grid - Bento Grid Structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Today Revenue */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute right-4 top-4 bg-emerald-50 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-all">
                <DollarSign className="h-5.5 w-5.5" />
              </div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Pendapatan Hari Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-2.5">
                Rp {metrics?.todayRevenue.toLocaleString('id-ID')}
              </h3>
              <div className="flex items-center space-x-1.5 mt-3">
                {metrics?.revenueGrowthPercent >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-emerald-600">+{metrics?.revenueGrowthPercent}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-extrabold text-rose-500">{metrics?.revenueGrowthPercent}%</span>
                  </>
                )}
                <span className="text-slate-400 text-[10px] font-bold">vs Kemarin</span>
              </div>
            </div>

            {/* Today Transactions */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute right-4 top-4 bg-emerald-50 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-all">
                <ShoppingCart className="h-5.5 w-5.5" />
              </div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Transaksi Hari Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-2.5">{metrics?.todaySalesCount} Transaksi</h3>
              <p className="text-slate-500 text-[10px] font-bold mt-4">
                Rata-rata tiket: Rp {metrics?.todaySalesCount > 0 ? Math.round(metrics.todayRevenue / metrics.todaySalesCount).toLocaleString('id-ID') : 0}
              </p>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute right-4 top-4 bg-emerald-50 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-all">
                <DollarSign className="h-5.5 w-5.5" />
              </div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Pendapatan Bulan Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-2.5">
                Rp {metrics?.monthlyRevenue.toLocaleString('id-ID')}
              </h3>
              <p className="text-slate-400 text-[10px] font-bold mt-4">Akumulasi laba berjalan</p>
            </div>

            {/* Stock Alerts count */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute right-4 top-4 bg-rose-50 p-3 rounded-xl text-rose-500 group-hover:bg-rose-100 transition-all">
                <AlertTriangle className="h-5.5 w-5.5" />
              </div>
              <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Restock Segera</p>
              <h3 className="text-2xl font-black text-slate-900 mt-2.5">{lowStockProducts?.length || 0} Produk</h3>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 mt-3.5 inline-block rounded ${
                lowStockProducts?.length > 0 
                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {lowStockProducts?.length > 0 ? 'Stok Hampir Habis' : 'Stok Barang Aman'}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Sales Trend (7 Days) */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.01)] lg:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-6">Grafik Tren Omset (7 Hari Terakhir)</h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `Rp ${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEmerald)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular products horizontal chart */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-6">Menu Paling Laris</h4>
              {popularProducts?.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-400 text-xs italic">
                  Belum ada transaksi terekam.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularProducts} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#0f172a" fontSize={10} width={90} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        formatter={(value) => [`${value} porsi`, 'Terjual']}
                      />
                      <Bar dataKey="sold" radius={[0, 4, 4, 0]}>
                        {popularProducts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Log / Warnings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Live Sales Timeline */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl lg:col-span-2 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <div className="flex items-center space-x-2 text-slate-800 mb-6">
                <Clock className="h-4.5 w-4.5 text-emerald-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider">Linimasa Penjualan Terbaru</h4>
              </div>

              {recentTransactions?.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  Belum ada transaksi hari ini.
                </div>
              ) : (
                <div className="relative pl-6 border-l border-slate-100 space-y-6">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="relative">
                      {/* Timeline circle point */}
                      <span className="absolute -left-[30px] top-1 bg-white border-2 border-emerald-500 h-3.5 w-3.5 rounded-full z-10"></span>
                      
                      <div className="flex items-center justify-between hover:bg-slate-50 p-2.5 rounded-xl transition-all">
                        <div>
                          <p className="font-bold text-sm text-slate-800 leading-tight">{tx.invoiceNumber}</p>
                          <span className="text-[10px] text-slate-400 font-bold mt-1 inline-block">
                            {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Kasir: {tx.cashier?.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-emerald-600">Rp {tx.totalAmount.toLocaleString('id-ID')}</p>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-500 mt-1 inline-block">
                            {tx.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low stock indicators list */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
              <div className="flex items-center space-x-2 text-slate-800 mb-6">
                <Package className="h-4.5 w-4.5 text-rose-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider">Perlu Re-stock</h4>
              </div>

              {lowStockProducts?.length === 0 ? (
                <div className="py-8 text-center text-emerald-700 text-xs font-bold bg-emerald-50 rounded-xl border border-emerald-100">
                  Semua stok produk aman!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {lowStockProducts.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                      <div className="overflow-hidden pr-2">
                        <p className="font-bold text-xs text-slate-800 truncate leading-tight">{prod.name}</p>
                        <span className="text-[9px] font-mono text-slate-400 block mt-1">{prod.sku}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">
                          Sisa: {prod.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
