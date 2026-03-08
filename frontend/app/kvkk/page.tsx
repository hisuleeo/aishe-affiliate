'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function KVKKPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/aishelogo.png"
              alt="AISHE"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <Link href="/" className="transition hover:text-white">
              Ana sayfa
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 md:p-12 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Kişisel Verilerin Korunması ve İşlenmesi Politikası
          </h1>
          <p className="text-slate-400 text-sm mb-8">Son Güncelleme: 8 Mart 2026</p>

          <div className="space-y-8 text-slate-300">
            {/* Giriş */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Giriş</h2>
              <p className="leading-relaxed">
                AISHE olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, 
                kişisel verilerinizin korunması ve işlenmesi konusunda azami hassasiyet göstermekteyiz. 
                Bu politika, kişisel verilerinizin nasıl toplandığı, işlendiği, saklandığı ve korunduğu 
                hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.
              </p>
            </section>

            {/* Veri Sorumlusu */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Veri Sorumlusu</h2>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <p className="leading-relaxed mb-3">
                  <strong className="text-white">Şirket Adı:</strong> AISHE Teknoloji A.Ş.
                </p>
                <p className="leading-relaxed mb-3">
                  <strong className="text-white">Adres:</strong> Tuna Mah. 1690 Sk. Saader Cebeci İş Hanı No:48 İç Kapı No:102 Karşıyaka/İzmir
                </p>
                <p className="leading-relaxed mb-3">
                  <strong className="text-white">E-posta:</strong> kvkk@aishe.com
                </p>
                <p className="leading-relaxed">
                  <strong className="text-white">Telefon:</strong> +90 532 350 80 35
                </p>
              </div>
            </section>

            {/* Toplanan Kişisel Veriler */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Toplanan Kişisel Veriler</h2>
              <p className="leading-relaxed mb-4">
                Platformumuz aracılığıyla aşağıdaki kişisel verileriniz toplanabilir:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span><strong className="text-white">Kimlik Bilgileri:</strong> Ad, soyad, T.C. kimlik numarası (gerekli durumlarda)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span><strong className="text-white">İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, adres</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span><strong className="text-white">Finansal Bilgiler:</strong> Ödeme bilgileri, fatura bilgileri, banka hesap bilgileri</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span><strong className="text-white">İşlem Güvenliği Bilgileri:</strong> IP adresi, çerez kayıtları, cihaz bilgileri</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span><strong className="text-white">Müşteri İşlem Bilgileri:</strong> Sipariş geçmişi, paket tercihleri, kullanım logları</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span><strong className="text-white">Pazarlama Bilgileri:</strong> İlgi alanları, tercihler, referans kodları</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span><strong className="text-white">Teknik Veriler:</strong> AISHE ID, bilgisayar kimliği, sistem yapılandırması</span>
                </li>
              </ul>
            </section>

            {/* Kişisel Verilerin İşlenme Amaçları */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Kişisel Verilerin İşlenme Amaçları</h2>
              <p className="leading-relaxed mb-4">
                Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
              </p>
              <div className="space-y-3">
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">📝 Sözleşme İlişkisi</h3>
                  <p>Hizmet sözleşmelerinin kurulması, ifası ve yönetimi</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">💳 Finansal İşlemler</h3>
                  <p>Ödeme ve faturalandırma süreçlerinin yürütülmesi</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">🛡️ Güvenlik</h3>
                  <p>Bilgi güvenliği süreçlerinin yürütülmesi ve dolandırıcılığın önlenmesi</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">📞 Müşteri İlişkileri</h3>
                  <p>Müşteri memnuniyeti, destek ve iletişim faaliyetlerinin yürütülmesi</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">📊 Analiz ve Raporlama</h3>
                  <p>İş geliştirme, istatistik ve analiz çalışmalarının yapılması</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">⚖️ Yasal Yükümlülükler</h3>
                  <p>Yasal düzenlemelerin gerektirdiği bilgi saklama ve raporlama yükümlülüklerinin yerine getirilmesi</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">📢 Pazarlama</h3>
                  <p>Pazarlama ve tanıtım faaliyetlerinin gerçekleştirilmesi (açık rızanız dahilinde)</p>
                </div>
              </div>
            </section>

            {/* Kişisel Verilerin Aktarımı */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Kişisel Verilerin Aktarımı</h2>
              <p className="leading-relaxed mb-4">
                Kişisel verileriniz, KVKK'nın öngördüğü temel ilkelere uygun olarak ve 
                aşağıdaki durumlarla sınırlı olmak üzere üçüncü kişilere aktarılabilir:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>Ödeme hizmeti sağlayıcılarına (ödeme işlemleri için)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>Hukuki danışmanlık firmalarına (hukuki süreçler için)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>Denetim ve muhasebe firmalarına (finansal raporlama için)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>Yasal mercilere (yasal zorunluluklar çerçevesinde)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>İş ortaklarımıza (hizmet sunumu için gerekli olan durumlarda)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>Bulut hizmeti sağlayıcılarına (veri saklama ve işleme için)</span>
                </li>
              </ul>
            </section>

            {/* Kişisel Verilerin Korunması */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Kişisel Verilerin Korunması</h2>
              <p className="leading-relaxed mb-4">
                Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki önlemleri almaktayız:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                  <div className="text-2xl mb-2">🔐</div>
                  <h3 className="text-white font-semibold mb-1">Şifreleme</h3>
                  <p className="text-sm">SSL/TLS protokolleri ile veri şifreleme</p>
                </div>
                <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                  <div className="text-2xl mb-2">🔒</div>
                  <h3 className="text-white font-semibold mb-1">Erişim Kontrolü</h3>
                  <p className="text-sm">Yetkilendirme ve kimlik doğrulama sistemleri</p>
                </div>
                <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                  <div className="text-2xl mb-2">🛡️</div>
                  <h3 className="text-white font-semibold mb-1">Güvenlik Duvarı</h3>
                  <p className="text-sm">İleri düzey firewall ve saldırı tespit sistemleri</p>
                </div>
                <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="text-white font-semibold mb-1">Loglama</h3>
                  <p className="text-sm">Detaylı erişim ve işlem kayıtları</p>
                </div>
                <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                  <div className="text-2xl mb-2">💾</div>
                  <h3 className="text-white font-semibold mb-1">Yedekleme</h3>
                  <p className="text-sm">Düzenli veri yedekleme ve kurtarma prosedürleri</p>
                </div>
                <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                  <div className="text-2xl mb-2">👥</div>
                  <h3 className="text-white font-semibold mb-1">Eğitim</h3>
                  <p className="text-sm">Personel eğitimleri ve farkındalık programları</p>
                </div>
              </div>
            </section>

            {/* Kişisel Veri Sahibinin Hakları */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Kişisel Veri Sahibinin Hakları</h2>
              <p className="leading-relaxed mb-4">
                KVKK'nın 11. maddesi uyarınca, kişisel veri sahipleri olarak aşağıdaki haklara sahipsiniz:
              </p>
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border border-indigo-500/30">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>Kişisel verilerinizin işlenip işlenmediğini öğrenme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>Düzeltme, silme veya yok edilme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">✓</span>
                    <span>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Başvuru Yöntemi */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Başvuru Yöntemi</h2>
              <p className="leading-relaxed mb-4">
                Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerle başvuruda bulunabilirsiniz:
              </p>
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3">📧 E-posta ile Başvuru</h3>
                  <p className="mb-2">E-posta: <a href="mailto:kvkk@aishe.com" className="text-indigo-400 hover:text-indigo-300">kvkk@aishe.com</a></p>
                  <p className="text-sm text-slate-400">Başvurunuzda kimliğinizi tespit edici belgeler ile talebinizi açıkça belirtmeniz gerekmektedir.</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3">📬 Posta ile Başvuru</h3>
                  <p className="mb-2">Adres: Tuna Mah. 1690 Sk. Saader Cebeci İş Hanı No:48 İç Kapı No:102 Karşıyaka/İzmir</p>
                  <p className="text-sm text-slate-400">Islak imzalı başvurunuzu kimliğinizi tespit edici belgeler ile birlikte gönderebilirsiniz.</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3">🖥️ Sistem Üzerinden Başvuru</h3>
                  <p className="mb-2">Platform üzerinden "Hesabım" bölümünden KVKK başvuru formunu doldurabilirsiniz.</p>
                  <p className="text-sm text-slate-400">Sisteme kayıtlı e-posta adresiniz ile kimlik doğrulaması yapılacaktır.</p>
                </div>
              </div>
              <div className="mt-6 bg-amber-500/10 rounded-xl p-6 border border-amber-500/30">
                <p className="text-amber-200">
                  <strong>⏱️ Yanıt Süresi:</strong> Başvurularınız, talebin niteliğine göre en geç 30 (otuz) gün içinde 
                  ücretsiz olarak sonuçlandırılacaktır. İşlemin ayrıca bir maliyeti gerektirmesi halinde, 
                  Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.
                </p>
              </div>
            </section>

            {/* Çerezler */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Çerez (Cookie) Politikası</h2>
              <p className="leading-relaxed mb-4">
                Web sitemizde kullanıcı deneyimini iyileştirmek ve hizmetlerimizi optimize etmek amacıyla çerezler kullanılmaktadır.
              </p>
              <div className="space-y-3">
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">🍪 Zorunlu Çerezler</h3>
                  <p className="text-sm">Web sitesinin çalışması için gerekli olan çerezlerdir. Kapatılamaz.</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">📊 Analitik Çerezler</h3>
                  <p className="text-sm">Ziyaretçi davranışlarını analiz etmek ve site performansını ölçmek için kullanılır.</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-white font-semibold mb-2">🎯 Pazarlama Çerezleri</h3>
                  <p className="text-sm">Kişiselleştirilmiş reklamlar sunmak için kullanılır. Onayınız ile aktif olur.</p>
                </div>
              </div>
            </section>

            {/* Veri Saklama Süreleri */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Veri Saklama Süreleri</h2>
              <p className="leading-relaxed mb-4">
                Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen süreler dahilinde saklanmaktadır:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-white">Veri Kategorisi</th>
                      <th className="text-left py-3 px-4 text-white">Saklama Süresi</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4">Üyelik Bilgileri</td>
                      <td className="py-3 px-4">Hesap aktif olduğu sürece + 10 yıl</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4">Finansal Kayıtlar</td>
                      <td className="py-3 px-4">Vergi mevzuatı gereği 10 yıl</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4">İletişim Kayıtları</td>
                      <td className="py-3 px-4">3 yıl</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4">Log Kayıtları</td>
                      <td className="py-3 px-4">2 yıl</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 px-4">Pazarlama İzinleri</td>
                      <td className="py-3 px-4">İzin geri alınana kadar</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Çerez Verileri</td>
                      <td className="py-3 px-4">En fazla 2 yıl</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Politika Değişiklikleri */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Politika Değişiklikleri</h2>
              <p className="leading-relaxed">
                Bu KVKK Aydınlatma Metni, yasal düzenlemelerdeki değişiklikler veya şirket politikalarındaki 
                güncellemeler doğrultusunda revize edilebilir. Önemli değişiklikler yapıldığında, 
                kayıtlı kullanıcılarımıza e-posta yoluyla bildirim gönderilecektir. 
                Güncel versiyonu web sitemizden takip edebilirsiniz.
              </p>
            </section>

            {/* İletişim */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. İletişim</h2>
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border border-indigo-500/30">
                <p className="leading-relaxed mb-4">
                  KVKK kapsamındaki haklarınız veya bu politika hakkında sorularınız için bizimle iletişime geçebilirsiniz:
                </p>
                <div className="space-y-2">
                  <p><strong className="text-white">E-posta:</strong> <a href="mailto:kvkk@aishe.com" className="text-indigo-400 hover:text-indigo-300">kvkk@aishe.com</a></p>
                  <p><strong className="text-white">Telefon:</strong> +90 532 350 80 35</p>
                  <p><strong className="text-white">Adres:</strong> Tuna Mah. 1690 Sk. Saader Cebeci İş Hanı No:48 İç Kapı No:102 Karşıyaka/İzmir</p>
                  <p><strong className="text-white">Çalışma Saatleri:</strong> Hafta içi 09:00 - 18:00</p>
                </div>
              </div>
            </section>

            {/* Yürürlük */}
            <section className="border-t border-slate-700 pt-8">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <p className="text-center text-slate-300">
                  Bu Kişisel Verilerin Korunması ve İşlenmesi Politikası <strong className="text-white">8 Mart 2026</strong> tarihinde 
                  güncellenmiş olup, bu tarihten itibaren yürürlüktedir.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Alt Navigasyon */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition">
            Ana Sayfa
          </Link>
          <span>•</span>
          <Link href="/dashboard" className="hover:text-white transition">
            Panel
          </Link>
          <span>•</span>
          <Link href="/profile" className="hover:text-white transition">
            İletişim
          </Link>
        </div>
      </div>
    </main>
  );
}
