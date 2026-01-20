export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-orange-500">J'INFO</span>
              <span className="text-blue-400"> TOURS</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Portal B2B dedicat agenților de turism partenere. Oferim circuite organizate premium pe toate continentele.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Link-uri utile</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://www.jinfotours.ro" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                  🌐 Site principal J'Info Tours
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  📋 Termeni și condiții
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  🔒 Politica de confidențialitate
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span>📧</span>
                <span>info@jinfotours.ro</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📞</span>
                <span>+40 21 XXX XXXX</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>București, România</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} J'Info Tours - Portal B2B pentru Agenții de Turism
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Toate prețurile afișate includ comisionul agenției (10% implicit)
          </p>
        </div>
      </div>
    </footer>
  );
}