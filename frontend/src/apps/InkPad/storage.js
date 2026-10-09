import { loadBook, validateBook } from './ink.js';
let database;
function openDatabase() {
    if (!database) database = new Promise((resolve, reject) => {
        const request = indexedDB.open('gfos-inkpad', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('notebooks');
        request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); database = null; }; resolve(db); };
        request.onerror = () => { database = null; reject(request.error); };
        request.onblocked = () => { database = null; reject(new Error('Database blocked')); };
    });
    return database;
}
export async function readNotebook() {
    const db = await openDatabase();
    const saved = await new Promise((resolve, reject) => {
        const request = db.transaction('notebooks').objectStore('notebooks').get('main');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    if (saved) return { book: validateBook(saved), error: '' };
    // Keep the original localStorage notebook as a migration backup.
    return loadBook({ getItem: key => localStorage.getItem(key) });
}
export async function saveNotebook(book) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('notebooks', 'readwrite');
        tx.objectStore('notebooks').put(book, 'main');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}
export async function imageObject(file, position) {
    if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) throw new Error('请使用 PNG、JPEG、WebP、GIF 或 AVIF 图片');
    if (file.size > 20 * 1024 * 1024) throw new Error('单张图片请小于 20 MB');
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const width = Math.min(420, canvas.width), height = canvas.height / canvas.width * width;
        return { id: crypto.randomUUID(), type: 'image', x: position[0], y: position[1], width, height, src: canvas.toDataURL('image/webp', 0.9), name: file.name || '粘贴的图片' };
    } finally { bitmap.close(); }
}
