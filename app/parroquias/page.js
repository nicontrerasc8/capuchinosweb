'use client';

import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../firebase/firebase';

const defaultHorariosJson = '{"misa": ["08:00", "19:00"]}';
const defaultComunidadJson = '{"responsable": ""}';

export default function ParroquiasPage() {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [distrito, setDistrito] = useState('');
    const [ciudad, setCiudad] = useState('Lima');
    const [horariosJson, setHorariosJson] = useState(defaultHorariosJson);
    const [comunidadJson, setComunidadJson] = useState(defaultComunidadJson);
    const [telefono, setTelefono] = useState('');
    const [observacion, setObservacion] = useState('');
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
        setNombre('');
        setDireccion('');
        setDistrito('');
        setCiudad('Lima');
        setHorariosJson(defaultHorariosJson);
        setComunidadJson(defaultComunidadJson);
        setTelefono('');
        setObservacion('');
        setActivo(true);
        setEditingId(null);
    };

    const fetchItems = useCallback(async () => {
        if (!isSupabaseConfigured || !supabase) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('parroquia_franciscana')
            .select('id, nombre, direccion, distrito, ciudad, horarios, comunidad, telefono, observacion, activo, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            showMessage('Error al cargar parroquias', 'error');
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
        setNombre(item.nombre || '');
        setDireccion(item.direccion || '');
        setDistrito(item.distrito || '');
        setCiudad(item.ciudad || 'Lima');
        setHorariosJson(JSON.stringify(item.horarios || {}, null, 2));
        setComunidadJson(JSON.stringify(item.comunidad || {}, null, 2));
        setTelefono(item.telefono || '');
        setObservacion(item.observacion || '');
        setActivo(Boolean(item.activo));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id) => {
        if (!isSupabaseConfigured || !supabase) {
            showMessage('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY', 'error');
            return;
        }

        if (!window.confirm('Esta accion eliminara la parroquia. Continuar?')) return;

        const { error } = await supabase.from('parroquia_franciscana').delete().eq('id', id);

        if (error) {
            console.error(error);
            showMessage('No se pudo eliminar la parroquia', 'error');
            return;
        }

        showMessage('Parroquia eliminada con exito');
        if (editingId === id) clearForm();
        fetchItems();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isSupabaseConfigured || !supabase) {
            showMessage('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY', 'error');
            return;
        }
        if (!nombre.trim()) {
            showMessage('El nombre es obligatorio', 'error');
            return;
        }

        let horarios;
        let comunidad;

        try {
            horarios = JSON.parse(horariosJson);
            comunidad = JSON.parse(comunidadJson);
        } catch (_error) {
            showMessage('Horarios o comunidad no tienen JSON valido', 'error');
            return;
        }

        const payload = {
            nombre: nombre.trim(),
            direccion: direccion.trim() || null,
            distrito: distrito.trim() || null,
            ciudad: ciudad.trim() || 'Lima',
            horarios,
            comunidad,
            telefono: telefono.trim() || null,
            observacion: observacion.trim() || null,
            activo,
        };

        const query = editingId
            ? supabase.from('parroquia_franciscana').update(payload).eq('id', editingId)
            : supabase.from('parroquia_franciscana').insert(payload);

        const { error } = await query;

        if (error) {
            console.error(error);
            showMessage('Error al guardar la parroquia', 'error');
            return;
        }

        showMessage(editingId ? 'Parroquia actualizada con exito' : 'Parroquia publicada con exito');
        clearForm();
        fetchItems();
    };

    return (
        <div className="bg-amber-50 min-h-screen p-6">
            <div className="max-w-5xl mx-auto grid gap-6">
                <div className="bg-white shadow-xl rounded-2xl p-8 border-t-8 border-b-8 border-yellow-700">
                    <h1 className="text-3xl font-serif font-bold text-gray-800 text-center mb-6">CRUD de parroquias</h1>

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
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-600 mb-2">Nombre</label>
                            <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                        </div>

                        <div>
                            <label htmlFor="direccion" className="block text-sm font-medium text-gray-600 mb-2">Direccion</label>
                            <input id="direccion" type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="distrito" className="block text-sm font-medium text-gray-600 mb-2">Distrito</label>
                                <input id="distrito" type="text" value={distrito} onChange={(e) => setDistrito(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                            </div>
                            <div>
                                <label htmlFor="ciudad" className="block text-sm font-medium text-gray-600 mb-2">Ciudad</label>
                                <input id="ciudad" type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="horarios" className="block text-sm font-medium text-gray-600 mb-2">Horarios (JSON)</label>
                            <textarea id="horarios" value={horariosJson} onChange={(e) => setHorariosJson(e.target.value)} rows="4" className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm text-black" />
                        </div>

                        <div>
                            <label htmlFor="comunidad" className="block text-sm font-medium text-gray-600 mb-2">Comunidad (JSON)</label>
                            <textarea id="comunidad" value={comunidadJson} onChange={(e) => setComunidadJson(e.target.value)} rows="4" className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm text-black" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="telefono" className="block text-sm font-medium text-gray-600 mb-2">Telefono</label>
                                <input id="telefono" type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                            </div>
                            <div className="flex items-end gap-3 pb-2">
                                <input id="activo" type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-5 w-5 text-black" />
                                <label htmlFor="activo" className="text-sm font-medium text-gray-600">Activo</label>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="observacion" className="block text-sm font-medium text-gray-600 mb-2">Observacion</label>
                            <textarea id="observacion" value={observacion} onChange={(e) => setObservacion(e.target.value)} rows="3" className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-green-700 text-white font-bold py-4 rounded-lg hover:bg-green-800">
                                {editingId ? 'Actualizar parroquia' : 'Crear parroquia'}
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
                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">Lista de parroquias</h2>

                    {loading ? (
                        <p className="text-gray-600">Cargando...</p>
                    ) : items.length === 0 ? (
                        <p className="text-gray-600">No hay registros.</p>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <article key={item.id} className="border border-gray-200 rounded-lg p-4 bg-stone-50">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-lg text-gray-800">{item.nombre}</h3>
                                        <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm text-gray-700">{item.direccion || 'Sin direccion'}</p>
                                    <p className="text-sm text-gray-600">{item.distrito || '-'} / {item.ciudad || '-'}</p>
                                    <p className="text-sm text-gray-600 mb-2">Telefono: {item.telefono || '-'}</p>
                                    <p className="text-sm text-gray-700 mb-2">Activo: {item.activo ? 'Si' : 'No'}</p>
                                    <p className="text-sm text-gray-700 mb-2">Observacion: {item.observacion || '-'}</p>
                                    <details className="mb-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-gray-700">Ver JSON</summary>
                                        <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto">{JSON.stringify({ horarios: item.horarios, comunidad: item.comunidad }, null, 2)}</pre>
                                    </details>
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

