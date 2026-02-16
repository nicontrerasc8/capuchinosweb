'use client';

import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../firebase/firebase';

function splitBodyIntoParagraphs(body) {
    if (!body) return [];
    return body
        .split(/\n\s*\n/g)
        .map((part) => part.trim())
        .filter(Boolean);
}

export default function ArticulosPage() {
    const [titulo, setTitulo] = useState('');
    const [fuente, setFuente] = useState('');
    const [parrafoActual, setParrafoActual] = useState('');
    const [parrafos, setParrafos] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState(null);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const clearForm = () => {
        setTitulo('');
        setFuente('');
        setParrafoActual('');
        setParrafos([]);
        setEditingId(null);
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

    const fetchItems = useCallback(async () => {
        if (!isSupabaseConfigured || !supabase) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('franciscan_prayers')
            .select('id, title, body, source, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            showMessage('Error al cargar oraciones', 'error');
            setLoading(false);
            return;
        }

        setItems(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const onEdit = (item) => {
        setEditingId(item.id);
        setTitulo(item.title || '');
        setFuente(item.source || '');
        setParrafos(splitBodyIntoParagraphs(item.body));
        setParrafoActual('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id) => {
        if (!isSupabaseConfigured || !supabase) {
            showMessage('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY', 'error');
            return;
        }

        if (!window.confirm('Esta accion eliminara la oracion. Continuar?')) return;

        const { error } = await supabase.from('franciscan_prayers').delete().eq('id', id);

        if (error) {
            console.error(error);
            showMessage('No se pudo eliminar la oracion', 'error');
            return;
        }

        showMessage('Oracion eliminada con exito');
        if (editingId === id) clearForm();
        fetchItems();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isSupabaseConfigured || !supabase) {
            showMessage('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY', 'error');
            return;
        }
        if (!titulo.trim() || parrafos.length === 0) {
            showMessage('Falta el titulo o el contenido', 'error');
            return;
        }

        const payload = {
            title: titulo.trim(),
            body: parrafos.join('\n\n'),
            source: fuente.trim() || null,
        };

        const query = editingId
            ? supabase.from('franciscan_prayers').update(payload).eq('id', editingId)
            : supabase.from('franciscan_prayers').insert(payload);

        const { error } = await query;

        if (error) {
            console.error(error);
            showMessage('Error al guardar la oracion', 'error');
            return;
        }

        showMessage(editingId ? 'Oracion actualizada con exito' : 'Oracion publicada con exito');
        clearForm();
        fetchItems();
    };

    return (
        <div className="bg-amber-50 min-h-screen p-6">
            <div className="max-w-5xl mx-auto grid gap-6">
                <div className="bg-white shadow-xl rounded-2xl p-8 border-t-8 border-b-8 border-yellow-700">
                    <h1 className="text-3xl font-serif font-bold text-gray-800 text-center mb-6">CRUD de oraciones</h1>

                    {!isSupabaseConfigured && (
                        <div className="p-4 rounded-lg text-white font-semibold text-center bg-red-500 mb-4">
                            Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
                        </div>
                    )}

                    {message && (
                        <div className={`p-4 rounded-lg text-white font-semibold text-center mb-4 ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="titulo" className="block text-sm font-medium text-gray-600 mb-2">Titulo</label>
                            <input id="titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                        </div>

                        <div>
                            <label htmlFor="fuente" className="block text-sm font-medium text-gray-600 mb-2">Fuente (opcional)</label>
                            <input id="fuente" type="text" value={fuente} onChange={(e) => setFuente(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                        </div>

                        <div>
                            <label htmlFor="parrafo" className="block text-sm font-medium text-gray-600 mb-2">Agregar parrafo</label>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <textarea id="parrafo" value={parrafoActual} onChange={(e) => setParrafoActual(e.target.value)} rows="3" className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                                <button type="button" onClick={agregarParrafo} className="bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-800">Agregar</button>
                            </div>
                        </div>

                        {parrafos.length > 0 && (
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                                {parrafos.map((texto, index) => (
                                    <div key={index} className="flex gap-3 items-start bg-gray-100 p-3 rounded-lg border border-gray-300">
                                        <textarea value={texto} onChange={(e) => editarParrafo(index, e.target.value)} rows={Math.max(3, Math.ceil(texto.length / 80))} className="w-full bg-gray-100 rounded-lg resize-none text-black" />
                                        <button type="button" onClick={() => eliminarParrafo(index)} className="text-red-600 hover:text-red-700 font-bold text-xl">&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-green-700 text-white font-bold py-4 rounded-lg hover:bg-green-800">
                                {editingId ? 'Actualizar oracion' : 'Crear oracion'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={clearForm} className="bg-gray-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-gray-700">
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">Lista de oraciones</h2>

                    {loading ? (
                        <p className="text-gray-600">Cargando...</p>
                    ) : items.length === 0 ? (
                        <p className="text-gray-600">No hay registros.</p>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <article key={item.id} className="border border-gray-200 rounded-lg p-4 bg-stone-50">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                                        <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                                    </div>
                                    {item.source && <p className="text-sm text-gray-600 mb-2">Fuente: {item.source}</p>}
                                    <p className="text-gray-700 whitespace-pre-wrap mb-3">{item.body}</p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => onEdit(item)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Editar</button>
                                        <button type="button" onClick={() => onDelete(item.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Eliminar</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

