import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, MapPin, Clock, Cpu, FileBox, Maximize, Info, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Camera, Zap } from 'lucide-react';

const MetadataRow = ({ icon: Icon, label, value, colorClass = "text-gray-400", valueClass = "text-gray-700", borderClass = "border-gray-50" }) => (
    <div className={`flex items-start gap-4 py-3.5 border-b ${borderClass} last:border-0 group`}>
        <div className="mt-0.5 p-2 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-gray-100 transition-colors flex-shrink-0">
            <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-sm ${valueClass} break-words`}>{value || '--'}</div>
        </div>
    </div>
);

const ConfidenceBar = ({ score, color }) => {
    const bgColor = color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500';
    const trackColor = color === 'red' ? 'bg-red-500/10' : color === 'yellow' ? 'bg-yellow-500/10' : 'bg-green-500/10';
    return (
        <div className={`w-full rounded-full h-2 ${trackColor} mt-2`}>
            <div
                className={`${bgColor} h-2 rounded-full transition-all duration-700`}
                style={{ width: `${score}%` }}
            />
        </div>
    );
};

const SignalBadge = ({ type, label, value }) => {
    const styles = {
        critical: 'bg-red-50 border-red-100 text-red-600',
        warning: 'bg-yellow-50 border-yellow-100 text-yellow-600',
        info: 'bg-blue-50 border-blue-100 text-blue-600',
    };
    return (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${styles[type] || styles.info} text-xs`}>
            <span className="font-bold whitespace-nowrap">{label}</span>
            {value && <span className="opacity-70 break-all">{value}</span>}
        </div>
    );
};

const AIAnalysisPanel = ({ metadata }) => {
    const [expanded, setExpanded] = useState(true);
    const { aiDetection, aiConfidence, aiColor, aiSignals = [], aiDetails = [] } = metadata;

    const verdictColor = aiColor === 'red' ? 'text-red-600' : aiColor === 'yellow' ? 'text-yellow-600' : 'text-green-600';
    const verdictBg = aiColor === 'red' ? 'bg-red-50 border-red-100' : aiColor === 'yellow' ? 'bg-yellow-50 border-yellow-100' : 'bg-green-50 border-green-100';

    return (
        <div className={`rounded-2xl border p-5 ${verdictBg}`}>
            <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {aiColor === 'red' ? (
                            <ShieldAlert className={`w-5 h-5 ${verdictColor}`} />
                        ) : aiColor === 'yellow' ? (
                            <AlertTriangle className={`w-5 h-5 ${verdictColor}`} />
                        ) : (
                            <CheckCircle className={`w-5 h-5 ${verdictColor}`} />
                        )}
                        <span className={`text-sm font-bold ${verdictColor}`}>{aiDetection}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs ${verdictColor} opacity-70 font-semiboldSmall`}>Confidence: {aiConfidence}%</span>
                    </div>
                    <ConfidenceBar score={aiConfidence} color={aiColor} />
                </div>
                <div className={`${verdictColor} opacity-40 flex-shrink-0 mt-1`}>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {expanded && (
                <div className="mt-4 space-y-4">
                    {aiSignals.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Detection Signals</div>
                            <div className="space-y-2">
                                {aiSignals.map((s, i) => (
                                    <SignalBadge key={i} type={s.type} label={s.label} value={s.value} />
                                ))}
                            </div>
                        </div>
                    )}
                    {aiDetails.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Analysis Log</div>
                            <ul className="space-y-1.5 ml-1">
                                {aiDetails.map((d, i) => (
                                    <li key={i} className="text-[11px] text-gray-500 flex gap-2 leading-relaxed">
                                        <span className="text-gray-300 flex-shrink-0">•</span>
                                        <span>{d}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ForensicSidebar = ({ image, metadata, hash, isMobile = false }) => {
    if (!image || !metadata) return null;

    const containerClasses = isMobile
        ? "w-full bg-white flex flex-col"
        : "w-[420px] h-screen border-l border-gray-100 bg-white flex flex-col overflow-y-auto custom-scrollbar shadow-2xl z-20 sticky top-0";

    return (
        <div className={containerClasses}>

            {/* Header */}
            <div className={`pb-5 border-b border-gray-100 bg-gray-50/30 ${isMobile ? 'px-0 pt-0 pb-6' : 'px-7 pt-7'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-0.5">Digital Nutrition Label</h2>
                        <p className="text-xs text-gray-500">Asset Provenance Report</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${metadata.isRealExif ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                        {metadata.isRealExif ? 'EXIF' : 'No EXIF'}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className={`flex-1 space-y-0`}>

                {/* AI Analysis Section */}
                <div className={`${isMobile ? 'px-0 py-6' : 'px-7 py-6'} border-b border-gray-100`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        AI Attribution Analysis
                    </div>
                    <AIAnalysisPanel metadata={metadata} />
                </div>

                {/* Camera & Identity */}
                <div className={`${isMobile ? 'px-0 py-6' : 'px-7 py-6'} border-b border-gray-100`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                        <Camera className="w-3 h-3" />
                        Capture Identity
                    </div>
                    <MetadataRow icon={Cpu} label="Source Device" value={metadata.sourceDevice} valueClass="text-gray-900 font-bold" />
                    {metadata.software && (
                        <MetadataRow icon={Info} label="Software" value={metadata.software} />
                    )}
                    {metadata.cameraSettings && (
                        <MetadataRow icon={Maximize} label="Camera Settings" value={metadata.cameraSettings} />
                    )}
                    <MetadataRow icon={Clock} label="Timestamp" value={metadata.timestamp} />
                    <MetadataRow icon={MapPin} label="GPS Coordinates" value={metadata.gps} />
                    <MetadataRow icon={Maximize} label="Resolution" value={metadata.resolution} />
                    <MetadataRow icon={FileBox} label="File Size" value={metadata.fileSize} />
                </div>

                {/* Integrity */}
                <div className={`${isMobile ? 'px-0 py-6' : 'px-7 py-6'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        Integrity
                    </div>
                    <MetadataRow
                        icon={ShieldCheck}
                        label="SHA2-256 Hash"
                        value={hash}
                        colorClass="text-green-600"
                        valueClass="font-mono text-[11px] break-all text-green-600/80"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className={`bg-gray-50/50 border-t border-gray-100 ${isMobile ? 'px-6 py-6 rounded-2xl' : 'px-7 py-5'}`}>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                    <span className="text-gray-500 font-semibold">Privacy Guarantee · </span>
                    All analysis runs locally in your browser. Zero data transmitted to external servers.
                </p>
            </div>
        </div>
    );
};

export default ForensicSidebar;
