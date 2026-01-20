import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="text-center px-4">
          <div className="text-8xl mb-6">🔍</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Circuit negăsit
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Ne pare rău, circuitul pe care îl cauți nu există sau nu mai este disponibil.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
          >
            <span>←</span>
            <span>Înapoi la toate circuitele</span>
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}