'use client';
import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function ReflexionesPage() {
    const [titulo, setTitulo] = useState('');
    const [subtitulo, setSubtitulo] = useState(''); // Nuevo estado para el subtítulo
    const [autor, setAutor] = useState(''); // Nuevo estado para el autor
    const [parrafoActual, setParrafoActual] = useState('');
    const [parrafos, setParrafos] = useState([]);
    const [message, setMessage] = useState(null); // Estado para mostrar mensajes al usuario



    // Función para mostrar un mensaje temporalmente
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => {
            setMessage(null);
        }, 5000); // El mensaje desaparece después de 5 segundos
    };

    const agregarParrafo = () => {
        if (parrafoActual.trim() === '') return;
        setParrafos([...parrafos, parrafoActual.trim()]);
        setParrafoActual('');
    };

    const eliminarParrafo = (index) => {
        const nuevos = parrafos.filter((_, i) => i !== index);
        setParrafos(nuevos);
    };

    const editarParrafo = (index, nuevoTexto) => {
        const nuevos = [...parrafos];
        nuevos[index] = nuevoTexto;
        setParrafos(nuevos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validación de los nuevos campos
        if (!titulo || !subtitulo || !autor || parrafos.length === 0) {
            showMessage('Falta el título, subtítulo, autor o párrafos', 'error');
            return;
        }

        try {
            // Actualización del documento en Firestore con los nuevos campos
            await addDoc(collection(db, 'articulos'), {
                titulo,
                subtitulo, // Campo nuevo
                autor, // Campo nuevo
                contenido: parrafos,
             
                fecha: Timestamp.now(),
            });
            setTitulo('');
            setSubtitulo('');
            setAutor('');
            setParrafoActual('');
            setParrafos([]);
            showMessage('Reflexión publicada con éxito', 'success');
        } catch (error) {
            console.error('Error al subir la reflexión:', error);
            showMessage('Error al publicar la reflexión. Inténtalo de nuevo.', 'error');
        }
    };

    return (
        <div className="bg-amber-50 min-h-screen flex items-center justify-center p-6">
            <div className="bg-white shadow-xl rounded-2xl p-10 max-w-3xl w-full space-y-8 border-t-8 border-b-8 border-yellow-700">
                <h1 className="text-4xl font-serif font-bold text-gray-800 text-center">
                    📖 Publica la noticia
                </h1>
                
                {/* Mensaje de notificación */}
                {message && (
                    <div className={`p-4 rounded-lg text-white font-semibold text-center ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Campo de Título */}
                    <div>
                        <label htmlFor="titulo" className="block text-sm font-medium text-gray-600 mb-2">
                            Título del artículo de noticia
                        </label>
                        <input
                            id="titulo"
                            type="text"
                            placeholder="Ej. La humildad en el camino de San Francisco"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-700 transition-colors"
                        />
                    </div>

                    {/* Nuevo campo de Subtítulo */}
                    <div>
                        <label htmlFor="subtitulo" className="block text-sm font-medium text-gray-600 mb-2">
                            Subtítulo
                        </label>
                        <input
                            id="subtitulo"
                            type="text"
                            placeholder="Ej. Una reflexión sobre la vida del santo"
                            value={subtitulo}
                            onChange={(e) => setSubtitulo(e.target.value)}
                            className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-700 transition-colors"
                        />
                    </div>
                    
                    {/* Nuevo campo de Autor */}
                    <div>
                        <label htmlFor="autor" className="block text-sm font-medium text-gray-600 mb-2">
                            Autor
                        </label>
                        <input
                            id="autor"
                            type="text"
                            placeholder="Ej. Fr. Juan Pérez"
                            value={autor}
                            onChange={(e) => setAutor(e.target.value)}
                            className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-700 transition-colors"
                        />
                    </div>

                    <div>
                        <label htmlFor="parrafo" className="block text-sm font-medium text-gray-600 mb-2">
                            Añade un nuevo párrafo
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <textarea
                                id="parrafo"
                                placeholder="Escribe tu párrafo aquí..."
                                value={parrafoActual}
                                onChange={(e) => setParrafoActual(e.target.value)}
                                className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-700 transition-colors"
                                rows="3"
                            />
                            <button
                                type="button"
                                onClick={agregarParrafo}
                                className="bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-800 transition-colors self-end sm:self-start flex-shrink-0 shadow-md"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>

                    {parrafos.length > 0 && (
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                            <h2 className="text-xl font-semibold text-gray-700">Párrafos de la Artículo de noticia:</h2>
                            {parrafos.map((texto, index) => (
                                <div key={index} className="flex gap-4 items-start bg-gray-100 p-4 rounded-lg border border-gray-300">
                                    <textarea
                                        className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none rounded-lg transition-colors resize-none"
                                        value={texto}
                                        onChange={(e) => editarParrafo(index, e.target.value)}
                                        rows={Math.max(3, Math.ceil(texto.length / 80))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => eliminarParrafo(index)}
                                        className="text-red-600 hover:text-red-700 font-bold text-xl transition-colors flex-shrink-0"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-green-700 text-white font-bold py-4 rounded-lg text-lg hover:bg-green-800 transition-colors shadow-lg"
                    >
                        🕊️ Publicar Artículo
                    </button>
                </form>
            </div>
        </div>
    );
}
