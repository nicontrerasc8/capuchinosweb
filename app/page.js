import Link from "next/link";
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-amber-50 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-xl w-full text-center space-y-8 border-t-8 border-b-8 border-yellow-700">
        <h1 className="text-4xl font-serif font-bold text-gray-800">
          🕊️ Panel de Publicación Franciscano
        </h1>
        <p className="text-lg text-gray-600 font-light">
          Usa este panel para subir artículos y reflexiones que serán compartidos con la comunidad.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/articulos" className="flex items-center justify-center gap-2 bg-yellow-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 hover:bg-yellow-800">
            <span className="text-2xl">📝</span> Subir Artículo
          </Link>
          <Link href="/reflexiones" className="flex items-center justify-center gap-2 bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 hover:bg-green-800">
            <span className="text-2xl">📖</span> Subir Reflexión
          </Link>
        </div>
      </div>
    </div>
  );
}
