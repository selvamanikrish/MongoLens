<div align="center">

# 🔍 MongoLens

### **Blazing-Fast, 100% In-Browser MongoDB Log Analyzer & Slow Query Profiler**

*Diagnose unindexed COLLSCANs, slow queries, operation latency spikes, and pipeline bottlenecks locally in your browser with zero server uploads.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)
[![Deployed on Cloudflare Pages](https://img.shields.io/badge/Deployed_on-Cloudflare_Pages-F38020.svg?style=for-the-badge&logo=cloudflare&logoColor=white)](https://mongolens.pages.dev/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25_Local_Air--Gapped-10B981.svg?style=for-the-badge&logo=shield&logoColor=white)](#-100-privacy--security-guarantee)

<br />

### 🚀 **[Use MongoLens Online — mongolens.pages.dev](https://mongolens.pages.dev/)**
*No installation or sign-up needed. Drop your `mongod.log` or `mongod.log.gz` file and analyze in seconds.*

<br />

[**🌐 Live App**](https://mongolens.pages.dev/) • [**✨ Key Features**](#-key-features) • [**🚀 Quick Start**](#-getting-started) • [**🧠 Architecture**](#-architecture--performance) • [**⌨️ Shortcuts**](#-keyboard-shortcuts)

<br />

</div>

---

## 📖 Overview

Debugging production MongoDB performance issues often requires parsing gigabytes of `mongod.log` or `mongod.log.gz` files. Traditional CLI utilities (`grep`, `awk`, `mtools`) lack intuitive visualizations, while SaaS APM platforms require uploading sensitive query payloads and customer data to third-party servers.

**MongoLens** bridges this gap: a modern, privacy-first diagnostic workbench that runs **entirely in your client browser**. It decompresses, streams, parses, and profiles millions of MongoDB log lines locally, providing real-time performance analytics, latency percentile breakdowns, and actionable index recommendations—all with **zero server uploads**.

---

## ✨ Key Features

### ⚡ 100% In-Browser & Air-Gapped Privacy
- **Zero Server Uploads**: Log data never leaves your machine. All parsing, decompressing, and indexing logic executes client-side via dedicated Web Workers.
- **Enterprise-Ready Security**: Compliant with stringent HIPAA, GDPR, SOC2, and PCI requirements for analyzing production database logs containing PII.

### 📦 Native GZIP & ZIP Stream Decompression
- Direct drag-and-drop support for compressed `mongod.log.gz`, `mongodb.log.gz`, and `.zip` archives.
- High-throughput streaming decompression using `fflate` inside a Web Worker without blocking the main UI thread.

### 🔍 Automated Slow Query Profiler & ESR Index Advisor
- **COLLSCAN Detection**: Automatically identifies collection scans and calculates the `docsExamined` to `nReturned` inefficiency ratio.
- **Index Recommendations**: Generates copy-paste ready `db.collection.createIndex(...)` statements following MongoDB's **Equality-Sort-Range (ESR)** rule.
- **In-Memory Sort Detection**: Flags unindexed sorting stages that risk hitting MongoDB's 100MB RAM buffer limit.
- **Aggregation Inspector**: Analyzes multi-stage aggregation pipelines for missing early `$match` stages and unindexed `$lookup` joins.

### 📊 Latency Percentiles & Query Clustering
- Granular latency metrics: **p50, p90, p95, p99, and Max Latency**.
- Normalizes raw queries into parameterized query shapes to aggregate recurring slow query patterns across your cluster.

### 🖥️ 60 FPS Virtualized Log Console
- Powered by `@tanstack/react-virtual` to smoothly render hundreds of thousands of log lines without DOM lag.
- Full-text search, regex filtering, severity filters (Fatal, Error, Warning, Info, Debug), and JSON payload formatting.

### 📈 Interactive Timeline & Spike Detection
- Dynamic time-series charts visualizing query frequency and execution duration spikes over time.
- Drag-and-zoom brush selection to isolate specific performance degradation windows.

### 📑 Comprehensive Multi-Format Export
- Export filtered insights as **JSON**, **JSONL**, **CSV**, or generate an **Executive Markdown Diagnostic Report** ready to share with your engineering team.

---

## 🧭 Dashboard Tour

| View | Capabilities |
| :--- | :--- |
| **📊 Overview** | High-level cluster health score, throughput graphs, operations breakdown, latency distributions, and top active collections. |
| **🐢 Slow Queries** | Dedicated slow query inspector, query shape aggregation, scan-to-return ratios, and 1-click ESR index suggestions. |
| **⚡ Operations** | Detailed breakdown across operations (`find`, `aggregate`, `update`, `delete`, `insert`, `count`, `getMore`, `command`). |
| **📁 Collections** | Per-namespace read/write ratios, slowest queries per collection, and collection-level scan efficiency. |
| **🚨 Errors & Warnings** | MongoDB error code categorization (e.g., Code 50, 11000, socket timeouts), uncaught exceptions, and connection drops. |
| **⏱️ Timeline** | Interactive temporal query distribution chart with zoomable brush for investigating latency surges. |
| **📜 Raw Logs** | High-performance virtualized raw log viewer with syntax highlighting and instant regex search. |

---

## 🛠️ Supported MongoDB Log Formats

MongoLens seamlessly auto-detects and parses both modern and legacy MongoDB log formats:

1. **MongoDB 4.4+ Structured JSON Format**
   ```json
   {"t":{"$date":"2026-08-27T10:15:30.123+00:00"},"s":"I","c":"COMMAND","id":51803,"ctx":"conn42","msg":"Slow query","attr":{"type":"command","ns":"store.orders","command":{"find":"orders","filter":{"status":"pending"}},"planSummary":"COLLSCAN","keysExamined":0,"docsExamined":450000,"nreturned":12,"millis":420}}
   ```
2. **Legacy MongoDB 3.x / 4.0 / 4.2 Text Format**
   ```text
   2026-08-27T10:15:30.123+0000 I COMMAND  [conn42] query store.orders query: { status: "pending" } planSummary: COLLSCAN keysExamined:0 docsExamined:450000 nreturned:12 420ms
   ```
3. **Compressed Archives**
   - `.log.gz` / `.gz` (Gzip compressed logs)
   - `.zip` (Zipped log bundles)

---

## 🧠 Architecture & Performance

MongoLens is built from the ground up for massive throughput and zero UI stutter:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│                                                             │
│   ┌──────────────────┐               ┌──────────────────┐   │
│   │   React 19 UI    │  ◄──────────  │   Zustand Store  │   │
│   │ (TanStack/Charts)│               │ (Reactive State) │   │
│   └────────┬─────────┘               └────────▲─────────┘   │
│            │                                  │             │
│            │ Drag & Drop                      │ PostMessage │
│            ▼                                  │ (Batched)   │
│   ┌───────────────────────────────────────────┴─────────┐   │
│   │               Dedicated Web Worker                  │   │
│   │  ┌─────────────────┐       ┌──────────────────────┐ │   │
│   │  │ fflate Stream   │ ────► │ JSON / Legacy Parser │ │   │
│   │  │ Decompression   │       │ & Regex Tokenizer    │ │   │
│   │  └─────────────────┘       └──────────┬───────────┘ │   │
│   │                                       │             │   │
│   │                            ┌──────────▼───────────┐ │   │
│   │                            │ Query Shape Analyzer │ │   │
│   │                            │ & ESR Index Advisor  │ │   │
│   │                            └──────────────────────┘ │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Offloaded Web Worker**: Parsing, regex tokenization, and metric aggregation run entirely in a background worker thread to guarantee responsive 60 FPS scrolling.
- **Chunked Memory Processing**: Memory-efficient streaming processes large files without causing browser tab crashes.
- **Instant Query Fingerprinting**: Hashes and clusters query filters (e.g., `{ user_id: 123 }` $\rightarrow$ `{ user_id: ? }`) to group slow query patterns.

---

## 🚀 Getting Started

### Option 1: Use Online (Recommended)
Visit [**mongolens.dev**](https://mongolens.dev) and simply drag-and-drop your `mongod.log` or `mongod.log.gz` file. You can also click **"Load Realistic Demo Data"** to explore all features instantly.

### Option 2: Run Locally

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

#### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/mongolens.git

# Navigate to project directory
cd mongolens

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

#### Production Build
```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## ⌨️ Keyboard Shortcuts

Speed up your workflow with intuitive single-key navigation:

| Key | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> | Open Command Palette & Global Search |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>O</kbd> | Open a new MongoDB log file |
| <kbd>G</kbd> then <kbd>O</kbd> | Navigate to **Overview** Dashboard |
| <kbd>G</kbd> then <kbd>S</kbd> | Navigate to **Slow Queries** Profiler |
| <kbd>G</kbd> then <kbd>P</kbd> | Navigate to **Operations** Breakdown |
| <kbd>G</kbd> then <kbd>C</kbd> | Navigate to **Collections** Analytics |
| <kbd>G</kbd> then <kbd>E</kbd> | Navigate to **Errors & Exceptions** |
| <kbd>G</kbd> then <kbd>T</kbd> | Navigate to **Timeline** View |
| <kbd>G</kbd> then <kbd>R</kbd> | Navigate to **Raw Logs** Console |
| <kbd>Esc</kbd> | Close Drawer / Modal / Active Palette |

---

## 🔒 100% Privacy & Security Guarantee

We take database privacy seriously:

- ✅ **No Backend Servers**: MongoLens does not possess a backend data ingestion server.
- ✅ **No Data Telemetry**: Log lines, query filters, collections, and database names are **never sent over the network**.
- ✅ **Offline / Air-Gapped Operation**: Once loaded, MongoLens runs completely offline without requiring an active internet connection.

---

## 💻 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/)
- **Charts & Visualizations**: [Recharts](https://recharts.org/)
- **Virtualized Rendering**: [@tanstack/react-virtual](https://tanstack.com/virtual/latest)
- **Streaming Decompression**: [fflate](https://github.com/101arrowz/fflate)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/selvamanikrish/MongoLens/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for MongoDB developers, DBAs, and SREs worldwide.</sub>
</div>
