import React, { useEffect, useState } from 'react'
import { Split, Users, Receipt, Sparkles, Server, CheckCircle2 } from 'lucide-react'

export const App: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'offline'>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Server returned non-200')
      })
      .then(() => setServerStatus('connected'))
      .catch(() => setServerStatus('offline'))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">SplitMe</h1>
              <p className="text-xs text-slate-500">視覺化分帳工具</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Server className="w-3.5 h-3.5" />
              <span>
                後端連線:{' '}
                {serverStatus === 'checking' && <span className="text-amber-500">連線中...</span>}
                {serverStatus === 'connected' && <span className="text-emerald-600 font-semibold">正常</span>}
                {serverStatus === 'offline' && <span className="text-rose-500">離線 (開發模式)</span>}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 rounded-2xl p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Monorepo 架構初始化完成</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              告別繁瑣計算，最直覺的分帳體驗
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              整合 Kotlin Ktor 後端與 React 19 前端，支援即時多人協作、拖拉分配、最少轉帳路徑與 LINE 結算分享。
            </p>
          </div>
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">直覺拖拉分帳</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              彩色頭像徽章管理、按比例/倍率攤提及服務費與折扣精確試算。
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
              <Split className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">貪婪債務精簡</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              核心演算法將多角借貸壓至最多 N-1 筆，台幣整數零頭精準調差。
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">收據長圖與分享</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              一鍵產出高解析度結算 PNG 長圖、嵌入收款碼與 LINE 友善純文字。
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        SplitMe © 2026 — Kotlin Ktor + React 19 Monorepo
      </footer>
    </div>
  )
}

export default App
