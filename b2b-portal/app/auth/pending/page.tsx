// app/auth/pending/page.tsx
import Link from 'next/link';

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Cont în așteptare
        </h1>
        <p className="text-gray-600 mb-2">
          Cererea ta de înregistrare a fost primită și este în curs de procesare.
        </p>
        <p className="text-gray-600 mb-6">
          Echipa <span className="font-semibold text-orange-600">J'Info Tours</span> va verifica datele și va activa contul tău în cel mai scurt timp.
        </p>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div className="text-left">
              <div className="text-sm font-semibold text-orange-900">Vei fi notificat</div>
              <div className="text-xs text-orange-700">
                Vei primi un email de confirmare când contul este activat.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href="mailto:office@jinfotours.ro"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-md"
          >
            <span>📧</span>
            <span>Contactează-ne</span>
          </a>
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
          >
            ← Înapoi la Login
          </Link>
        </div>
      </div>
    </div>
  );
}