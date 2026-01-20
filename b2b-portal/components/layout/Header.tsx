import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-3xl font-bold">
              <span className="text-orange-500">J'INFO</span>
              <span className="text-blue-600"> B2B</span>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Portal Agenții
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              📞 Contact
            </button>
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
              Cont Agenție
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}