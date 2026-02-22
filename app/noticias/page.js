'use client';

import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../firebase/firebase';

const newsBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'noticias';

function toDatetimeLocalValue(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hour}:${minute}`;
}

export default function NoticiasPage() {
    const [titulo, setTitulo] = useState('');
    const [subtitulo, setSubtitulo] = useState('');
    const [autor, setAutor] = useState('');
    const [parrafoActual, setParrafoActual] = useState('');
    const [parrafos, setParrafos] = useState([]);
    const [resumen, setResumen] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [destacada, setDestacada] = useState(false);
    const [activo, setActivo] = useState(true);
    const [fechaPublicacion, setFechaPublicacion] = useState(toDatetimeLocalValue(new Date().toISOString()));
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
        setAutor('');
        setParrafoActual('');
        setParrafos([]);
        setResumen('');
        setImagenUrl('');
        setImageFile(null);
        setDestacada(false);
        setActivo(true);
        setFechaPublicacion(toDatetimeLocalValue(new Date().toISOString()));
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
            .from('noticias_parroquia')
            .select('id, titulo, subtitulo, autor, contenido, resumen, imagen_url, destacada, activo, fecha_publicacion, created_at')
            .order('fecha_publicacion', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            showMessage('Error al cargar noticias', 'error');
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
        setAutor(item.autor || '');
        setParrafos(Array.isArray(item.contenido) ? item.contenido : []);
        setParrafoActual('');
        setResumen(item.resumen || '');
        setImagenUrl(item.imagen_url || '');
        setImageFile(null);
        setDestacada(Boolean(item.destacada));
        setActivo(Boolean(item.activo));
        setFechaPublicacion(toDatetimeLocalValue(item.fecha_publicacion));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id) => {
        if (!isSupabaseConfigured || !supabase) {
            showMessage('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY', 'error');
            return;
        }

        if (!window.confirm('Esta accion eliminara la noticia. Continuar?')) return;

        const { error } = await supabase.from('noticias_parroquia').delete().eq('id', id);

        if (error) {
            console.error(error);
            showMessage('No se pudo eliminar la noticia', 'error');
            return;
        }

        showMessage('Noticia eliminada con exito');
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

        let finalImageUrl = imagenUrl.trim() || null;
        if (imageFile) {
            if (!imageFile.type.startsWith('image/')) {
                showMessage('El archivo seleccionado no es una imagen valida', 'error');
                return;
            }

            const extension = imageFile.name.includes('.')
                ? imageFile.name.split('.').pop().toLowerCase()
                : 'jpg';
            const filePath = `noticias/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

            setUploadingImage(true);
            const { error: uploadError } = await supabase.storage
                .from(newsBucket)
                .upload(filePath, imageFile, { contentType: imageFile.type });
            setUploadingImage(false);

            if (uploadError) {
                console.error(uploadError);
                showMessage(`No se pudo subir la imagen al bucket "${newsBucket}"`, 'error');
                return;
            }

            const { data: publicUrlData } = supabase.storage.from(newsBucket).getPublicUrl(filePath);
            finalImageUrl = publicUrlData.publicUrl;
        }

        const payload = {
            titulo: titulo.trim(),
            subtitulo: subtitulo.trim() || null,
            autor: autor.trim() || null,
            contenido: parrafos,
            resumen: resumen.trim() || null,
            imagen_url: finalImageUrl,
            destacada,
            activo,
            fecha_publicacion: fechaPublicacion ? new Date(fechaPublicacion).toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const query = editingId
            ? supabase.from('noticias_parroquia').update(payload).eq('id', editingId)
            : supabase.from('noticias_parroquia').insert(payload);

        const { error } = await query;

        if (error) {
            console.error(error);
            showMessage('Error al guardar la noticia', 'error');
            return;
        }

        showMessage(editingId ? 'Noticia actualizada con exito' : 'Noticia creada con exito');
        clearForm();
        fetchItems();
    };

    return (
        <div className="bg-amber-50 min-h-screen p-6">
            <div className="max-w-5xl mx-auto grid gap-6">
                <div className="bg-white shadow-xl rounded-2xl p-8 border-t-8 border-b-8 border-yellow-700">
                    <h1 className="text-3xl font-serif font-bold text-gray-800 text-center mb-6">CRUD de noticias parroquiales</h1>

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

                        <div>
                            <label htmlFor="autor" className="block text-sm font-medium text-gray-600 mb-2">Autor</label>
                            <input id="autor" type="text" value={autor} onChange={(e) => setAutor(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
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

                        <div>
                            <label htmlFor="imagenFile" className="block text-sm font-medium text-gray-600 mb-2">Imagen</label>
                            <input id="imagenFile" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                            <p className="text-xs text-gray-500 mt-2">La imagen se sube a Supabase Storage (bucket: {newsBucket}) y se guarda el link automaticamente.</p>
                            {imagenUrl && (
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <a href={imagenUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">Ver imagen actual</a>
                                    <button type="button" onClick={() => setImagenUrl('')} className="text-sm text-red-600 hover:text-red-700">Quitar imagen</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="fechaPublicacion" className="block text-sm font-medium text-gray-600 mb-2">Fecha de publicacion</label>
                            <input id="fechaPublicacion" type="datetime-local" value={fechaPublicacion} onChange={(e) => setFechaPublicacion(e.target.value)} className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg text-black" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <input id="destacada" type="checkbox" checked={destacada} onChange={(e) => setDestacada(e.target.checked)} className="h-5 w-5 text-black" />
                                <label htmlFor="destacada" className="text-sm font-medium text-gray-600">Destacada</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input id="activo" type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-5 w-5 text-black" />
                                <label htmlFor="activo" className="text-sm font-medium text-gray-600">Activo</label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" disabled={uploadingImage} className="flex-1 bg-green-700 text-white font-bold py-4 rounded-lg hover:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed">
                                {uploadingImage ? 'Subiendo imagen...' : editingId ? 'Actualizar noticia' : 'Crear noticia'}
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
                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">Lista de noticias</h2>

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
                                        <p className="text-xs text-gray-500">{new Date(item.fecha_publicacion).toLocaleString()}</p>
                                    </div>
                                    {item.subtitulo && <p className="text-sm text-gray-700 mb-1">{item.subtitulo}</p>}
                                    <p className="text-sm text-gray-600 mb-1">Autor: {item.autor || '-'}</p>
                                    <p className="text-sm text-gray-600 mb-1">Destacada: {item.destacada ? 'Si' : 'No'} | Activo: {item.activo ? 'Si' : 'No'}</p>
                                    {item.resumen && <p className="text-sm text-gray-700 mb-2">Resumen: {item.resumen}</p>}
                                    {item.imagen_url && (
                                        <div className="mb-2">
                                            <a href={item.imagen_url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">Ver imagen</a>
                                        </div>
                                    )}
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
