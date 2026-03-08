import React from 'react';
import { Camera, Upload, ShieldCheck } from 'lucide-react';

const FeatureCards = ({ onUploadClick, onCameraClick }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Take Live Verified Photo (Red Card) */}
            <div className="bg-[#FF385C] rounded-2xl p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 mb-5">
                            <span className="bg-white/20 backdrop-blur-sm px-2.5 py-[3px] rounded-md text-[9px] font-bold text-white uppercase tracking-wider">Recommended</span>
                            <ShieldCheck className="w-[14px] h-[14px] text-white/90" />
                        </div>
                        <h3 className="text-[22px] font-bold text-white mb-2.5 tracking-tight">Take Live Verified Photo</h3>
                        <p className="text-white/90 text-[13px] leading-relaxed max-w-[260px]">
                            Capture images directly via the secure enclave. Guarantees human provenance and real-time metadata.
                        </p>
                    </div>

                    <button className="mt-8 w-full bg-white text-[#FF385C] font-semibold text-[14px] py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm active:scale-[0.98] transform" onClick={onCameraClick}>
                        <Camera className="w-[18px] h-[18px]" strokeWidth={2.5} />
                        Open Secure Camera
                    </button>
                </div>
            </div>

            {/* Upload & Verify Media (White Card) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
                <div>
                    <h3 className="text-[20px] font-bold text-gray-900 mb-2.5 tracking-tight">Upload & Verify Media</h3>
                    <p className="text-[#717171] text-[13px] leading-relaxed max-w-[340px] mb-8">
                        Existing media will be scanned for C2PA manifests and checked against our Audit API for authenticity.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={onUploadClick}
                        className="w-full border border-gray-200 border-dashed rounded-xl py-6 flex flex-col items-center justify-center gap-2.5 hover:border-gray-300 hover:bg-gray-50/50 transition-all group"
                    >
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-gray-100 transition-colors border border-gray-100">
                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        </div>
                        <span className="text-[14px] font-[600] text-gray-900">Select Existing Photos</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest pt-1">
                        <ShieldCheck className="w-3 h-3" />
                        Powered by Content Authenticity Initiative
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeatureCards;
