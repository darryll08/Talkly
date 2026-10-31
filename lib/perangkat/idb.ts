// IndexedDB `talkly`: antrean unggah, audio rekaman lokal (Momen anak), dan kartu foto benda.
// Data di sini tidak pernah dikirim ke server kecuali antrean rekaman.

const NAMA_DB = "talkly";
const VERSI = 1;
export type NamaStore = "antrean" | "klip" | "kartu_benda";

let janji: Promise<IDBDatabase> | null = null;

export function bukaDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB tidak tersedia"));
  if (!janji) {
    janji = new Promise((ok, gagal) => {
      const req = indexedDB.open(NAMA_DB, VERSI);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("antrean")) db.createObjectStore("antrean", { keyPath: "id_lokal" });
        if (!db.objectStoreNames.contains("klip")) db.createObjectStore("klip", { keyPath: "rekaman_id" });
        if (!db.objectStoreNames.contains("kartu_benda")) db.createObjectStore("kartu_benda", { keyPath: "id" });
      };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => {
        janji = null;
        gagal(req.error);
      };
    });
  }
  return janji;
}

function jalankan<T>(store: NamaStore, mode: IDBTransactionMode, aksi: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return bukaDb().then(
    (db) =>
      new Promise<T>((ok, gagal) => {
        const tx = db.transaction(store, mode);
        const req = aksi(tx.objectStore(store));
        tx.oncomplete = () => ok(req.result);
        tx.onerror = () => gagal(tx.error);
        tx.onabort = () => gagal(tx.error);
      }),
  );
}

export const simpan = <T>(store: NamaStore, nilai: T) => jalankan(store, "readwrite", (s) => s.put(nilai)).then(() => undefined);
export const ambil = <T>(store: NamaStore, kunci: IDBValidKey) => jalankan<T | undefined>(store, "readonly", (s) => s.get(kunci));
export const semua = <T>(store: NamaStore) => jalankan<T[]>(store, "readonly", (s) => s.getAll());
export const hapus = (store: NamaStore, kunci: IDBValidKey) => jalankan(store, "readwrite", (s) => s.delete(kunci)).then(() => undefined);
export const hitung = (store: NamaStore) => jalankan<number>(store, "readonly", (s) => s.count());
