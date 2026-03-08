'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // 1 saniye sonra göster (sayfa yüklendikten sonra)
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900/98 via-slate-900/98 to-indigo-900/98 backdrop-blur-xl shadow-2xl shadow-indigo-500/20">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-50 animate-pulse" />
            
            <div className="relative px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">🍪 Çerez Tercihleri</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                    Web sitemizde deneyiminizi geliştirmek ve size özel içerik sunabilmek için çerezler kullanıyoruz. 
                    <button
                      onClick={() => setShowModal(true)}
                      className="ml-1 font-semibold text-indigo-400 hover:text-indigo-300 underline transition"
                    >
                      Detaylı bilgi
                    </button>
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={acceptNecessary}
                    className="group relative overflow-hidden rounded-xl border border-slate-600 bg-slate-800/80 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/80 hover:border-slate-500"
                  >
                    <span className="relative z-10">Sadece Gerekli</span>
                  </button>
                  <button
                    onClick={acceptAll}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/50 transition hover:shadow-xl hover:shadow-indigo-500/60 hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Tümünü Kabul Et
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          
          <div className="relative max-w-3xl w-full max-h-[85vh] overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900/50 shadow-2xl shadow-indigo-500/20 animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Çerez Politikası</h2>
                    <p className="text-sm text-slate-400">Gizliliğiniz bizim için önemli</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-8 py-6 max-h-[calc(85vh-180px)]">
              <div className="space-y-6 text-slate-300">
                <section>
                  <p className="leading-relaxed">
                    AISHE olarak, web sitemizde çeşitli amaçlarla çerezler kullanıyoruz. 
                    Çerezler, cihazınızda saklanan küçük metin dosyalarıdır ve web deneyiminizi 
                    iyileştirmemize yardımcı olur.
                  </p>
                </section>

                <section className="space-y-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-white">
                          Zorunlu Çerezler
                          <span className="ml-2 text-xs font-normal text-green-400">(Her zaman aktif)</span>
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-400">
                          Bu çerezler, web sitesinin temel işlevlerini yerine getirmesi için gereklidir. 
                          Güvenli oturum yönetimi, kimlik doğrulama ve site güvenliği için kullanılır. 
                          Devre dışı bırakılamaz.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-white">Analitik Çerezler</h3>
                        <p className="text-sm leading-relaxed text-slate-400">
                          Web sitesi trafiğini ve kullanıcı davranışlarını analiz etmek için kullanılır. 
                          Hangi sayfaların daha popüler olduğunu ve ziyaretçilerin sitemizde nasıl 
                          gezindiğini anlamamıza yardımcı olur. (Google Analytics)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-white">Pazarlama Çerezleri</h3>
                        <p className="text-sm leading-relaxed text-slate-400">
                          Size özel içerik ve reklamlar sunmak için kullanılır. İlgi alanlarınıza göre 
                          kişiselleştirilmiş deneyim yaşamanızı sağlar. Üçüncü taraf reklam platformları 
                          ile entegre çalışabilir.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">📋 Saklama Süreleri</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Oturum Çerezleri:</span>
                      <span className="font-semibold text-indigo-400">Tarayıcı kapatılana kadar</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kalıcı Çerezler:</span>
                      <span className="font-semibold text-indigo-400">En fazla 2 yıl</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analitik Çerezler:</span>
                      <span className="font-semibold text-indigo-400">13 ay</span>
                    </div>
                  </div>
                </section>

                <section className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-amber-300 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Tercihlerinizi Yönetme
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Çerez tercihlerinizi istediğiniz zaman değiştirebilirsiniz. Tarayıcı ayarlarınızdan 
                    çerezleri silebilir veya engelleyebilirsiniz. Ancak bazı çerezleri devre dışı 
                    bırakmanız durumunda, web sitesinin bazı özellikleri düzgün çalışmayabilir.
                  </p>
                </section>

                <section className="text-sm text-slate-400">
                  <p>
                    Daha fazla bilgi için{' '}
                    <Link href="/kvkk" className="font-semibold text-indigo-400 hover:text-indigo-300 underline">
                      KVKK Aydınlatma Metni
                    </Link>
                    'ni inceleyebilirsiniz.
                  </p>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl px-8 py-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => {
                    acceptNecessary();
                    setShowModal(false);
                  }}
                  className="rounded-xl border border-slate-600 bg-slate-800/80 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/80 hover:border-slate-500"
                >
                  Sadece Gerekli Çerezler
                </button>
                <button
                  onClick={() => {
                    acceptAll();
                    setShowModal(false);
                  }}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/50 transition hover:shadow-xl hover:shadow-indigo-500/60 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Tümünü Kabul Et
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
