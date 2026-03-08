import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, LayoutGrid, List, CheckCircle, Trash2 } from 'lucide-react';

const MediaCard = ({ asset, onClick, onDelete }) => {
    const { preview, metadata, trustLevel } = asset;
    const isSecureEnclave = trustLevel === 'SECURE_ENCLAVE';
    const isAI = !isSecureEnclave && metadata.aiColor === 'red';
    const isSuspicious = !isSecureEnclave && metadata.aiColor === 'yellow';

    return (
        <div
            className="group relative flex flex-col gap-3 transition-transform duration-300 active:scale-[0.98]"
        >
            <div
                onClick={() => onClick(asset)}
                className={`relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer ${isSecureEnclave ? 'ring-2 ring-emerald-500/40 ring-offset-2' : ''}`}
            >
                <img
                    src={preview}
                    alt={metadata.sourceDevice}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Delete Button (Appears on Hover) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(asset.id); }}
                    className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                    <Trash2 className="w-4 h-4 text-red-500" />
                </button>

                {/* Status Badge */}
                <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 ${isSecureEnclave ? 'bg-emerald-500 shadow-lg' : 'bg-black/60'
                    }`}>
                    {isSecureEnclave ? (
                        <>
                            <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Verified Human-Shot</span>
                        </>
                    ) : isAI ? (
                        <>
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Detected</span>
                        </>
                    ) : isSuspicious ? (
                        <>
                            <Clock className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Processing Audit</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Verified Human-Shot</span>
                        </>
                    )}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                {/* Quick Text */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-white font-bold text-[14px] truncate">{metadata.sourceDevice}</h4>
                    <p className="text-white/80 text-[11px] truncate mt-0.5">
                        {isSecureEnclave ? 'GPS-Stamped · Zero AI' : 'Captured via Secure Enclave'}
                    </p>
                </div>
            </div>
        </div>
    );
};

const AddMoreCard = ({ onAdd }) => (
    <div
        onClick={onAdd}
        className="aspect-[4/3] rounded-2xl border-2 border-gray-100 border-dashed flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-[#FF385C] hover:bg-gray-50 transition-all active:scale-[0.98]"
    >
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-[#FF385C]/10 transition-colors">
            <span className="text-3xl text-gray-300 group-hover:text-[#FF385C] transition-colors font-light">+</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add More Media</span>
    </div>
);

const MediaLibraryGrid = ({ assets, onAdd, onSelect, onDelete }) => {
    return (
        <section className="pb-20">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
                    Media Library
                    <span className="text-[#717171] font-medium text-[16px] ml-1">({assets.length} Photos)</span>
                </h3>

                <div className="flex items-center gap-1 p-1 flex-row">
                    <button className="p-2 bg-gray-100 rounded-lg text-gray-900 shadow-sm border border-gray-200">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {assets.map((asset) => (
                    <MediaCard key={asset.id} asset={asset} onClick={onSelect} onDelete={onDelete} />
                ))}
                <AddMoreCard onAdd={onAdd} />
            </div>
        </section>
    );
};

export default MediaLibraryGrid;
