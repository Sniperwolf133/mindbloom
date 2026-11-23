import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  Database,
  FileText,
  KeyRound,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const DOC_CATEGORIES = [
  "Stress Management",
  "Study-Life Balance",
  "Mindfulness",
  "University Wellness Resources",
  "Emotional Well-Being",
];

export default function AdminDocsPage() {
  const { user, demoLogin } = useAuth();
  const [docs, setDocs] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(DOC_CATEGORIES[0]);
  const [adminCode, setAdminCode] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin" || Boolean(adminCode.trim());

  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocs(data.documents || []);
      setTotalChunks(data.total_chunks || 0);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF document to upload.");
      return;
    }
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title.trim()) formData.append("title", title.trim());
      formData.append("category", category);

      const created = await api.uploadDocument(formData, adminCode.trim());
      setNotice(
        `Indexed "${created.original_name}" (${created.page_count} page(s), ${created.chunk_count} semantic chunks) into ChromaDB!`
      );
      setFile(null);
      setTitle("");
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSeedStarters = async () => {
    setSeeding(true);
    setError("");
    setNotice("");
    try {
      const created = await api.seedStarterDocs(adminCode.trim());
      if (created.length === 0) {
        setNotice("All 3 starter wellness PDF guides are already indexed in ChromaDB.");
      } else {
        setNotice(`Indexed ${created.length} starter wellness PDF guide(s) into ChromaDB!`);
      }
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (docId, name) => {
    if (!window.confirm(`Remove "${name}" from the wellness knowledge base?`)) return;
    setError("");
    try {
      await api.deleteDocument(docId, adminCode.trim());
      setNotice(`Removed "${name}" from SQLite and ChromaDB.`);
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const results = await api.searchDocuments(searchQuery.trim(), 4);
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-plum-900">
            Wellness Knowledge Base (RAG)
          </h1>
          <p className="text-sm text-plum-700 mt-1">
            Upload student wellness PDFs to index them with Sentence Transformers & ChromaDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white border border-lavender-100 px-4 py-2 text-xs font-bold text-plum-800 shadow-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-mint-500" />
            <span>{docs.length} PDFs • {totalChunks} Chunks</span>
          </div>
        </div>
      </div>

      {/* Admin Access Helper if logged in as student */}
      {user?.role !== "admin" && (
        <div className="rounded-3xl bg-lavender-50 border border-lavender-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-plum-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-lavender-600" />
              Administrator Permission Needed for Uploads & Deletions
            </p>
            <p className="text-xs text-plum-700">
              You are signed in as a student. Enter the prototype admin code (
              <code className="bg-white px-1.5 py-0.5 rounded text-lavender-600 font-bold">
                mindmate-admin
              </code>
              ) or switch to the Demo Admin account.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Admin access code"
              className="rounded-xl border border-lavender-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
            <button
              type="button"
              onClick={() => demoLogin("admin")}
              className="rounded-xl bg-lavender-500 hover:bg-lavender-600 text-white px-4 py-2 text-xs font-bold transition"
            >
              Switch to Demo Admin
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div className="rounded-2xl bg-mint-100 border border-mint-200 px-4 py-3 text-sm font-semibold text-mint-600">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Upload Form */}
        <form
          onSubmit={handleUpload}
          className="lg:col-span-6 rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-plum-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-lavender-500" />
              Upload Wellness PDF
            </h2>
            <button
              type="button"
              disabled={seeding || !isAdmin}
              onClick={handleSeedStarters}
              className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 hover:bg-mint-200/70 text-mint-600 px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {seeding ? "Loading Guides..." : "Load 3 Starter Guides"}
            </button>
          </div>

          <label className="block rounded-2xl border-2 border-dashed border-lavender-200 bg-lavender-50/40 hover:bg-lavender-50/80 p-6 text-center cursor-pointer transition">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <FileText className="w-8 h-8 text-lavender-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-plum-900">
              {file ? file.name : "Click to select a student wellness PDF"}
            </p>
            <p className="text-xs text-plum-700 mt-1">
              Text-based PDFs up to 15 MB (extracted with pypdf & split for ChromaDB)
            </p>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-plum-800 mb-1">
                Document Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Campus Exam Calm Guide"
                className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-plum-800 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
              >
                {DOC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !isAdmin}
            className="w-full rounded-2xl bg-lavender-500 hover:bg-lavender-600 text-white font-bold py-3 text-sm shadow-sm transition disabled:opacity-50"
          >
            {uploading ? "Extracting & Embedding PDF..." : "Upload & Index into ChromaDB"}
          </button>
        </form>

        {/* Semantic Retrieval Tester */}
        <div className="lg:col-span-6 rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-plum-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-mint-500" />
            Test RAG Semantic Retrieval
          </h2>
          <p className="text-xs text-plum-700">
            Search the indexed wellness guides to inspect which chunks MindMate retrieves for the chatbot.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., how to handle exam panic or study breaks"
              className="flex-1 rounded-2xl border border-lavender-200 bg-cream-50/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-2xl bg-mint-500 hover:bg-mint-600 text-white px-5 py-2.5 text-sm font-bold transition disabled:opacity-60"
            >
              {searching ? "..." : "Search"}
            </button>
          </form>

          {searchResults && (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {searchResults.length === 0 ? (
                <p className="text-xs text-plum-700 bg-cream-50 rounded-2xl p-3">
                  No relevant passages found yet. Try loading the starter guides or uploading a PDF!
                </p>
              ) : (
                searchResults.map((res, idx) => (
                  <div
                    key={`${res.source}-${idx}`}
                    className="rounded-2xl border border-mint-100 bg-mint-50/50 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-plum-900">
                      <span>
                        {res.source} {res.page ? `(p. ${res.page})` : ""}
                      </span>
                      <span className="text-mint-600">
                        {Math.round((res.score || 0) * 100)}% match
                      </span>
                    </div>
                    <p className="text-plum-700 leading-relaxed">{res.excerpt}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Indexed Documents List */}
      <div className="rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpenCheck className="w-5 h-5 text-lavender-500" />
          <h2 className="font-display text-xl font-bold text-plum-900">
            Indexed Wellness Documents
          </h2>
        </div>

        {docs.length === 0 ? (
          <div className="rounded-2xl bg-cream-50 border border-dashed border-lavender-200 p-6 text-center text-sm text-plum-700">
            No wellness PDFs indexed yet. Click <strong>Load 3 Starter Guides</strong> or upload a PDF above!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3.5">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-lavender-100 bg-cream-50/70 p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-lavender-100 text-lavender-600 text-[11px] font-bold">
                    {doc.category}
                  </span>
                  <h3 className="font-bold text-sm text-plum-900 mt-1.5 truncate">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-plum-700 truncate">{doc.original_name}</p>
                  <p className="text-[11px] text-plum-700/80 mt-1.5">
                    {doc.page_count} page(s) • {doc.chunk_count} chunks •{" "}
                    {Math.max(1, Math.round(doc.file_size / 1024))} KB
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(doc.id, doc.original_name)}
                    title="Delete document from knowledge base"
                    className="p-2 rounded-xl text-plum-700/70 hover:bg-rose-50 hover:text-rose-600 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

