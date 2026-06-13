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
  ChevronRight,
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

  // Colors for bar chart cells
  const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#d8b4fe'];

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
    // Initial fetch
    fetchDashboardStats(true);

    // Setup Socket.io connection
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

      // Socket live event handler
      socket.on('new-transaction', (transaction) => {
        console.log('Live transaction received via Socket.io!', transaction);
        // Silently refresh statistics to animate update
        fetchDashboardStats(false);
      });

      socket.on('product-change', (data) => {
        console.log('Live product change received via Socket.io!', data);
        fetchDashboardStats(false);
      });
    }

    // Serverless Fallback: Setup Short-Polling every 5 seconds
    // This maintains pseudo-realtime functionality on Vercel where WebSockets aren't supported.
    pollingTimer.current = setInterval(() => {
      console.log('Short-polling dashboard data (fallback/sync)...');
      fetchDashboardStats(false);
    }, 5000);

    // Cleanup
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
      <div className="flex h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm text-slate-500">Memuat visualisasi dashboard...</p>
        </div>
      </div>
    );
  }

  const { metrics, salesTrend, popularProducts, lowStockProducts, recentTransactions } = stats || {};

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header & Socket Connection Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Real-Time</h1>
              <p className="text-slate-400 text-sm mt-1">Lacak kinerja penjualan dan arus kas toko Anda secara langsung</p>
            </div>
            
            {/* Live Indicator */}
            <div className="self-start sm:self-auto flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold">
              <span className={`h-2.5 w-2.5 rounded-full ${socketConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'} block`}></span>
              <span className={socketConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {socketConnected ? 'Koneksi Live Aktif (WS)' : 'Koneksi Serverless (Polling)'}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center space-x-3 mb-6">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Cards KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Today Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute right-4 top-4 bg-indigo-600/10 p-3 rounded-lg text-indigo-400 group-hover:bg-indigo-600/20 transition-all">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pendapatan Hari Ini</p>
              <h3 className="text-2xl font-bold text-white mt-2.5">
                Rp {metrics?.todayRevenue.toLocaleString('id-ID')}
              </h3>
              <div className="flex items-center space-x-1 mt-3">
                {metrics?.revenueGrowthPercent >= 0 ? (
                  <>
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500">+{metrics?.revenueGrowthPercent}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4.5 w-4.5 text-rose-500" />
                    <span className="text-xs font-bold text-rose-500">{metrics?.revenueGrowthPercent}%</span>
                  </>
                )}
                <span className="text-slate-500 text-[10px] font-medium">dibanding kemarin</span>
              </div>
            </div>

            {/* Today Transactions */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute right-4 top-4 bg-violet-600/10 p-3 rounded-lg text-violet-400 group-hover:bg-violet-600/20 transition-all">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Transaksi Hari Ini</p>
              <h3 className="text-2xl font-bold text-white mt-2.5">{metrics?.todaySalesCount} Transaksi</h3>
              <p className="text-slate-500 text-xs mt-3.5 font-medium">
                Pemasukan rata-rata: Rp {metrics?.todaySalesCount > 0 ? Math.round(metrics.todayRevenue / metrics.todaySalesCount).toLocaleString('id-ID') : 0} / tx
              </p>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute right-4 top-4 bg-emerald-600/10 p-3 rounded-lg text-emerald-400 group-hover:bg-emerald-600/20 transition-all">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pendapatan Bulan Ini</p>
              <h3 className="text-2xl font-bold text-white mt-2.5">
                Rp {metrics?.monthlyRevenue.toLocaleString('id-ID')}
              </h3>
              <p className="text-slate-500 text-xs mt-3.5 font-medium">Akumulasi laba kotor berjalan</p>
            </div>

            {/* Low Stock Alert Count */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute right-4 top-4 bg-rose-600/10 p-3 rounded-lg text-rose-400 group-hover:bg-rose-600/20 transition-all">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Stok Menipis (⚠️)</p>
              <h3 className="text-2xl font-bold text-white mt-2.5">{lowStockProducts?.length || 0} Produk</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-3.5 inline-block ${
                lowStockProducts?.length > 0 
                  ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' 
                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
              }`}>
                {lowStockProducts?.length > 0 ? 'Tindakan diperlukan segera' : 'Katalog aman & melimpah'}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Sales Trend Chart (7 days) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl lg:col-span-2 shadow-lg">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Tren Pendapatan (7 Hari Terakhir)</h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `Rp ${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Products Chart */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Produk Terlaris</h4>
              {popularProducts?.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-slate-600 text-xs italic">
                  Belum ada data transaksi tercatat.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularProducts} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        formatter={(value) => [`${value} porsi/pcs`, 'Terjual']}
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

          {/* Low Stock & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Live Sales Log (2 columns) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl lg:col-span-2 shadow-lg">
              <div className="flex items-center space-x-2 text-slate-400 mb-6">
                <Clock className="h-4.5 w-4.5" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Aktivitas Transaksi Terbaru (Live Feed)</h4>
              </div>

              {recentTransactions?.length === 0 ? (
                <div className="py-12 text-center text-slate-600 text-xs italic">
                  Belum ada aktivitas penjualan hari ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/10 px-2 rounded-lg transition-all">
                      <div>
                        <p className="font-semibold text-sm text-slate-200">{tx.invoiceNumber}</p>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Kasir: {tx.cashier?.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-indigo-400">Rp {tx.totalAmount.toLocaleString('id-ID')}</p>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50 mt-1 inline-block">
                          {tx.paymentMethod}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low stock warning widget */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center space-x-2 text-slate-400 mb-6">
                <Package className="h-4.5 w-4.5 text-rose-500" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Daftar Re-stock Produk</h4>
              </div>

              {lowStockProducts?.length === 0 ? (
                <div className="py-12 text-center text-emerald-500/80 text-xs font-semibold bg-emerald-950/10 rounded-xl border border-emerald-900/20">
                  Semua stok produk mencukupi!
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {lowStockProducts.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/80 hover:border-slate-800 transition-colors">
                      <div className="overflow-hidden pr-2">
                        <p className="font-semibold text-xs text-white truncate">{prod.name}</p>
                        <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{prod.sku}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-900/30">
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
