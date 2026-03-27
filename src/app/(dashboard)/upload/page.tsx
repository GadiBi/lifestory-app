'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ErrorBanner from '@/components/ErrorBanner';

interface LifeEvent {
  id: string;
  title: string;
}

interface MediaItem {
  id: string;
  url: string;
  publicId: string;
  type: string;
  title: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  lifeEvent: { id: string; title: string } | null;
}

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [session, status, router]);

  async function fetchData() {
    try {
      const [mediaRes, eventsRes] = await Promise.all([
        fetch('/api/media'),
        fetch('/api/events'),
      ]);
      if (!mediaRes.ok) throw new Error(`Failed to load photos: ${mediaRes.status}`);
      const mediaData = await mediaRes.json();
      const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };
      setMedia(mediaData.media || []);
      setLifeEvents(eventsData.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploaded = 0;

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      if (selectedEvent) {
        formData.append('lifeEventId', selectedEvent);
      }

      try {
        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setMedia(prev => [data.media, ...prev]);
        } else {
          const data = await response.json().catch(() => ({}));
          setError(data.error || `Upload failed for ${file.name}: ${response.status}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : `Upload failed for ${file.name}`);
      }

      uploaded++;
      setUploadProgress(Math.round((uploaded / totalFiles) * 100));
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this photo?')) return;

    // Optimistic update
    setMedia(prev => prev.filter(m => m.id !== id));
    setViewingMedia(null);

    try {
      const response = await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
      if (!response.ok) {
        setError(`Failed to delete photo: ${response.status}`);
        fetchData(); // revert
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
      fetchData(); // revert
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 ml-14">
            <h1 className="text-lg font-semibold text-slate-900">Photo Gallery</h1>
            <span className="text-sm text-slate-500">{media.length} photos</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mb-8 border-2 border-dashed rounded-2xl p-8 text-center transition ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-slate-300 hover:border-primary/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            id="file-upload"
          />

          {uploading ? (
            <div className="py-4">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg className="w-16 h-16 text-primary animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-600 mb-2">
                <span className="font-medium">Drag and drop photos here</span> or
              </p>
              <label
                htmlFor="file-upload"
                className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg cursor-pointer transition"
              >
                Browse Files
              </label>
              <p className="text-sm text-slate-400 mt-3">PNG, JPG, WEBP up to 10MB</p>

              {lifeEvents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="text-sm text-slate-600 mr-2">Attach to event:</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
                  >
                    <option value="">No event</option>
                    {lifeEvents.map(event => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Gallery Grid */}
        {media.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No photos yet</h3>
            <p className="text-slate-500">Upload your first photo to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                onClick={() => setViewingMedia(item)}
                className="aspect-square relative rounded-xl overflow-hidden bg-slate-100 cursor-pointer group"
              >
                <Image
                  src={item.url}
                  alt={item.title || 'Photo'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
                {item.lifeEvent && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{item.lifeEvent.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {viewingMedia && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingMedia(null)}
        >
          <button
            onClick={() => setViewingMedia(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="max-w-5xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={viewingMedia.url}
              alt={viewingMedia.title || 'Photo'}
              width={viewingMedia.width || 1200}
              height={viewingMedia.height || 800}
              className="max-h-[80vh] w-auto object-contain rounded-lg"
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  {viewingMedia.lifeEvent && (
                    <p className="text-white/80 text-sm mb-1">
                      Attached to: {viewingMedia.lifeEvent.title}
                    </p>
                  )}
                  <p className="text-white/60 text-xs">
                    {new Date(viewingMedia.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(viewingMedia.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
