# 📊 Real-Time Dashboard & POS System

Sebuah sistem Point of Sale (POS) modern yang dilengkapi dengan dashboard analitik real-time. Proyek ini dibangun menggunakan arsitektur *decoupled* yang memisahkan antara *frontend* dan *backend*, serta memanfaatkan WebSockets untuk pembaruan data secara instan tanpa perlu memuat ulang halaman (*refresh*).

---

## 🚀 Fitur Utama

*   **Input Transaksi POS:** Antarmuka kasir yang cepat, modern, dan responsif.
*   **Dashboard Real-time:** Pembaruan total pendapatan dan riwayat transaksi secara langsung detik itu juga menggunakan teknologi Socket.io.
*   **Desain Modern:** Menggunakan Tailwind CSS untuk tampilan UI yang rapi dan mudah disesuaikan.
*   **Kinerja Tinggi:** *Frontend* dibangun dengan Vite untuk proses *development* yang sangat ringan dan cepat.

---

## 🛠️ Teknologi yang Digunakan

### Frontend
*   **React.js** (diinisialisasi dengan Vite)
*   **Tailwind CSS** (v3)
*   **Socket.io-client**

### Backend
*   **Node.js**
*   **Express.js**
*   **Socket.io**
*   **CORS** & **Nodemon**

---

## 📂 Struktur Proyek

Repositori ini menggunakan struktur *monorepo* sederhana yang memisahkan lingkungan *client* dan *server*:

```text
Real-Time-Dashboard-Pos/
│
├── backend/               # Server Express.js & Socket.io
│   ├── .gitignore         # Pengecualian node_modules backend
│   ├── package.json
│   └── (file server.js akan ditambahkan di sini)
│
└── frontend/              # Aplikasi React UI (Vite)
    ├── src/
    ├── public/
    ├── index.html
    ├── tailwind.config.js
    └── package.json
