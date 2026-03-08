import React, { useState, useRef } from 'react';
import Header from './components/Header';
import FeatureCards from './components/FeatureCards';
import MediaLibraryGrid from './components/MediaLibraryGrid';
import ForensicSidebar from './components/ForensicSidebar';
import SecureCamera from './components/SecureCamera';
import { generateSHA256, extractMetadata } from './utils/forensics';
import { loadAssets, saveAsset, deleteAsset } from './utils/storage';
import { History, ShieldCheck } from 'lucide-react';

function App() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [status, setStatus] = useState('Standby');
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);

  // Hydrate assets from IndexedDB on initial load
  React.useEffect(() => {
    loadAssets().then(loadedAssets => {
      setAssets(loadedAssets);
    });
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const processFile = async (file, overrideMeta = null) => {
    setStatus('Analyzing...');
    try {
      const fileHash = await generateSHA256(file);
      const metadata = overrideMeta ?? await extractMetadata(file);
      const previewUrl = URL.createObjectURL(file);

      const newAsset = {
        id: Date.now().toString(),
        file,
        preview: previewUrl,
        hash: fileHash,
        metadata,
        timestamp: new Date().toLocaleString(),
        trustLevel: overrideMeta?.trustLevel ?? 'UPLOADED',
      };

      // Save to IndexedDB (updates state automatically inside the handler if needed, 
      // but we do it manually here to avoid full reload delay)
      await saveAsset(newAsset);

      setAssets(prev => [newAsset, ...prev]);
      setStatus(overrideMeta ? '★★★★★ Secure Enclave' : 'Analyzed');
    } catch (err) {
      console.error(err);
      setStatus('Error');
    }
  };

  // Called from SecureCamera after user approves the captured photo
  const handleVerifiedCapture = async (file, verifiedMeta) => {
    setShowCamera(false);
    await processFile(file, verifiedMeta);
  };

  const openUpload = () => fileInputRef.current?.click();

  const handleDeleteAsset = async (id) => {
    const updated = await deleteAsset(id);
    setAssets(updated);
    if (selectedAsset?.id === id) {
      setSelectedAsset(null);
    }
  };

  return (
    <div className="min-h-screen bg-white font-inter text-gray-900 overflow-x-hidden">
      <Header />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">

        {/* Hero Section */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[32px] font-[800] text-[#222222] tracking-tight mb-1.5">Listing Media Manager</h1>
            <p className="text-[#717171] text-[15px]">Secure your listing with Provenance-Stamped media.</p>
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 border border-[#dddddd] rounded-xl font-[600] text-[14px] text-[#222222] hover:bg-gray-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <History className="w-[18px] h-[18px]" strokeWidth={2} />
            View Audit Log
          </button>
        </div>

        {/* Feature Cards (Take Live Photo / Upload) */}
        <FeatureCards onUploadClick={openUpload} onCameraClick={() => setShowCamera(true)} />


        {/* Media Library Grid */}
        <MediaLibraryGrid
          assets={assets}
          onAdd={openUpload}
          onSelect={setSelectedAsset}
          onDelete={handleDeleteAsset}
        />
      </main>

      {/* Forensic Detail Modal/Sidebar */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedAsset(null)}
          />
          <div className="relative w-full max-w-[480px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Provenance Verified</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6">
                  <img src={selectedAsset.preview} className="w-full aspect-video object-cover rounded-2xl mb-8 shadow-lg" alt="Preview" />
                  <ForensicSidebar
                    image={selectedAsset.preview}
                    metadata={selectedAsset.metadata}
                    hash={selectedAsset.hash}
                    isMobile={true} // Reusing the mobile style which has no fixed width
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secure Enclave Camera */}
      {showCamera && (
        <SecureCamera
          onCapture={handleVerifiedCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

export default App;
