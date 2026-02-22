'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-amber-50 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-4xl w-full text-center space-y-8 border-t-8 border-b-8 border-yellow-700">
        <h1 className="text-4xl font-serif font-bold text-gray-800">
          Panel de publicacion franciscano
        </h1>
        <p className="text-lg text-gray-600 font-light">
          Usa este panel para administrar los cinco modulos del sitio en Supabase.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/articulos" className="flex items-center justify-center gap-2 bg-yellow-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 hover:bg-yellow-800">
            Subir oracion
          </Link>
          <Link href="/reflexiones" className="flex items-center justify-center gap-2 bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 hover:bg-green-800">
            Subir reflexion
          </Link>
          <Link href="/parroquias" className="flex items-center justify-center gap-2 bg-stone-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 hover:bg-stone-800">
            Subir parroquia
          </Link>
          <Link href="/lecciones" className="flex items-center justify-center gap-2 bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 hover:bg-blue-800">
            Subir leccion
          </Link>
          <Link href="/noticias" className="flex items-center justify-center gap-2 bg-red-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 hover:bg-red-800">
            Subir noticia
          </Link>
        </div>
      </div>
    </div>
  );
}
