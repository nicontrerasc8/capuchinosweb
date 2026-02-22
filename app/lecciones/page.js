'use client';

import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../firebase/firebase';

const nivelesPermitidos = ['Confirmacion', 'Bautismo', 'Adultos'];

export default function LeccionesPage() {
    const [titulo, setTitulo] = useState('');
    const [subtitulo, setSubtitulo] = useState('');
    const [nivel, setNivel] = useState('');
    const [tema, setTema] = useState('');
    const [parrafoActual, setParrafoActual] = useState('');
    const [parrafos, setParrafos] = useState([]);
    const [resumen, setResumen] = useState('');
    const [citaBiblica, setCitaBiblica] = useState('');
    const [orden, setOrden] = useState('1');
    const [activo, setActivo] = useState(true);
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
        setSubtitulo('');
        setNivel('');
        setTema('');
        setParrafoActual('');
        setParrafos([]);
        setResumen('');
        setCitaBiblica('');
        setOrden('1');
        setActivo(true);
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
            .from('lecciones_catecismo')
            .select('id, titulo, subtitulo, nivel, tema, contenido, resumen, cita_biblica, orden, activo, created_at')
            .order('orden', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            showMessage('Error al cargar lecciones', 'error');
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
        setTitulo(item.titulo || '');
        setSubtitulo(item.subtitulo || '');
        setNivel(item.nivel || '');
        setTema(item.tema || '');
        setParrafos(Array.isArray(item.contenido) ? item.contenido : []);
        setParrafoActual('');
        setResumen(item.resumen || '');
        setCitaBiblica(item.cita_biblica || '');
        setOrden(String(item.orden ?? 1));
        setActivo(Boolean(item.activo));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id) => {
        if (!isSupabaseConfigured || !supabase) {
            showMessage('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY', 'error');
            return;
        }

        if (!window.confirm('Esta accion eliminara la leccion. Continuar?')) return;

        const { error } = await supabase.from('lecciones_catecismo').delete().eq('id', id);

        if (error) {
            console.error(error);
            showMessage('No se pudo eliminar la leccion', 'error');
            return;
        }

        showMessage('Leccion eliminada con exito');
        if (editingId === id) clearForm();
        fetchItems();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isSupabaseConfigured || !supabase) {
            showMessage('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY', 'error');
            return;
        }
        if (!titulo.trim() || parrafos.length === 0 || !nivel) {
            showMessage('Falta el titulo, nivel o contenido', 'error');
            return;
        }
        if (!nivelesPermitidos.includes(nivel)) {
            showMessage('Nivel invalido', 'error');
            return;
        }

        const ordenNumber = Number.parseInt(orden, 10);
        if (Number.isNaN(ordenNumber)) {
            showMessage('El campo orden debe ser un numero entero', 'error');
            return;
        }

        const payload = {
            titulo: titulo.trim(),
            subtitulo: subtitulo.trim() || null,
            nivel,
            tema: tema.trim() || null,
            contenido: parrafos,
            resumen: resumen.trim() || null,
            cita_biblica: citaBiblica.trim() || null,
            orden: ordenNumber,
            activo,
            updated_at: new Date().toISOString(),
        };

        const query = editingId
            ? supabase.from('lecciones_catecismo').update(payload).eq('id', editingId)
            : supabase.from('lecciones_catecismo').insert(payload);

        const { error } = await query;

        if (error) {
            console.error(error);
            showMessage('Error al guardar la leccion', 'error');
            return;
        }

        showMessage(editingId ? 'Leccion actualizada con exito' : 'Leccion creada con exito');
        clearForm();
        fetchItems();
    };

    return (
        <div className="bg-amber-50 min-h-screen p-6">
            <div className="max-w-5xl mx-auto grid gap-6">
                <div className="bg-white shadow-xl rounded-2xl p-8 border-t-8 border-b-8 border-yellow-700">
                    <h1 className="text-3xl font-serif font-bold text-gray-800 text-center mb-6">CRUD de lecciones de catecismo</h1>

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
                            <label htmlFor="subtitulo" className="block text-sm font-medium text-gray-600 mb-2">Subtitulo</label>
                            <input id="subtitulo" type="text" value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="nivel" className="block text-sm font-medium text-gray-600 mb-2">Nivel</label>
                                <select id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black">
                                    <option value="">Selecciona un nivel</option>
                                    <option value="Confirmacion">Confirmacion</option>
                                    <option value="Bautismo">Bautismo</option>
                                    <option value="Adultos">Adultos</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="tema" className="block text-sm font-medium text-gray-600 mb-2">Tema</label>
                                <input id="tema" type="text" value={tema} onChange={(e) => setTema(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                            </div>
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

                        <div>
                            <label htmlFor="resumen" className="block text-sm font-medium text-gray-600 mb-2">Resumen</label>
                            <textarea id="resumen" value={resumen} onChange={(e) => setResumen(e.target.value)} rows="3" className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="citaBiblica" className="block text-sm font-medium text-gray-600 mb-2">Cita biblica</label>
                                <input id="citaBiblica" type="text" value={citaBiblica} onChange={(e) => setCitaBiblica(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                            </div>
                            <div>
                                <label htmlFor="orden" className="block text-sm font-medium text-gray-600 mb-2">Orden</label>
                                <input id="orden" type="number" value={orden} onChange={(e) => setOrden(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input id="activo" type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-5 w-5 text-black" />
                            <label htmlFor="activo" className="text-sm font-medium text-gray-600">Activo</label>
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-green-700 text-white font-bold py-4 rounded-lg hover:bg-green-800">
                                {editingId ? 'Actualizar leccion' : 'Crear leccion'}
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
                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">Lista de lecciones</h2>

                    {loading ? (
                        <p className="text-gray-600">Cargando...</p>
                    ) : items.length === 0 ? (
                        <p className="text-gray-600">No hay registros.</p>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <article key={item.id} className="border border-gray-200 rounded-lg p-4 bg-stone-50">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-lg text-gray-800">{item.titulo}</h3>
                                        <p className="text-xs text-gray-500">Orden: {item.orden ?? '-'}</p>
                                    </div>
                                    {item.subtitulo && <p className="text-sm text-gray-700 mb-1">{item.subtitulo}</p>}
                                    <p className="text-sm text-gray-600 mb-1">Nivel: {item.nivel || '-'} | Tema: {item.tema || '-'}</p>
                                    <p className="text-sm text-gray-600 mb-1">Activo: {item.activo ? 'Si' : 'No'}</p>
                                    {item.cita_biblica && <p className="text-sm text-gray-600 mb-1">Cita: {item.cita_biblica}</p>}
                                    {item.resumen && <p className="text-sm text-gray-700 mb-2">Resumen: {item.resumen}</p>}
                                    <div className="text-gray-700 whitespace-pre-wrap mb-3">
                                        {(item.contenido || []).map((p, idx) => (
                                            <p key={`${item.id}-${idx}`} className="mb-2">{p}</p>
                                        ))}
                                    </div>
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
