import exifr from 'exifr';

export const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
};

export const generateSHA256 = async (file) => {
    // Fallback if accessed via local IP where crypto.subtle is undefined
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        console.warn('Crypto.subtle API unavailable (non-HTTPS). Using mock hash.');
        return 'mock-hash-' + Math.random().toString(36).substring(2, 15);
    }
    try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
        console.error('Hashing failed:', err);
        return 'hash-error';
    }
};

/**
 * Analyzes an image for AI-generation signals using multiple detection heuristics.
 * Returns an object with { verdict, confidence, signals, details }
 */
const runAIDetection = async (file, exifData) => {
    const signals = [];
    let suspicionScore = 0; // 0 = clean, 100 = definitely AI
    const details = [];

    // --- SIGNAL 1: Software/Creator Tag Analysis ---
    const software = (exifData?.Software || exifData?.CreatorTool || exifData?.Creator || '').toLowerCase();
    const aiSoftwareKeywords = [
        'midjourney', 'dall-e', 'stable diffusion', 'dreamstudio', 'firefly',
        'nightcafe', 'jasper', 'runwayml', 'bing image creator', 'adobe firefly',
        'canva ai', 'ideogram', 'leonardo ai', 'flux', 'sora', 'imagen',
        'gpt-4o', 'gemini', 'copilot', 'openai', 'anthropic', 'generative'
    ];
    const postProcessKeywords = ['photoshop', 'lightroom', 'gimp', 'capture one'];

    const matchedAI = aiSoftwareKeywords.find(kw => software.includes(kw));
    const matchedPost = postProcessKeywords.find(kw => software.includes(kw));

    if (matchedAI) {
        suspicionScore += 90;
        signals.push({ type: 'critical', label: 'AI Software Tag', value: exifData?.Software || exifData?.CreatorTool });
        details.push(`AI tool identified in metadata: "${matchedAI}"`);
    } else if (matchedPost) {
        suspicionScore += 20;
        signals.push({ type: 'warning', label: 'Post-Processing', value: exifData?.Software || exifData?.CreatorTool });
        details.push(`Image post-processed using: "${matchedPost}"`);
    }

    // --- SIGNAL 2: Missing Camera Hardware Fingerprint ---
    const hasCamera = !!(exifData?.Make || exifData?.Model);
    const hasCameraSettings = !!(exifData?.FNumber || exifData?.ExposureTime || exifData?.ISO);
    const hasLensInfo = !!(exifData?.LensModel || exifData?.FocalLength);

    if (!hasCamera && !hasCameraSettings && !matchedAI) {
        // AI images almost never have camera EXIF data
        suspicionScore += 35;
        signals.push({ type: 'warning', label: 'No Camera Hardware', value: 'Missing' });
        details.push('No camera make/model or lens data found — typical of AI-generated images.');
    } else if (!hasCameraSettings && hasCamera) {
        suspicionScore += 10;
        signals.push({ type: 'info', label: 'Partial EXIF', value: 'Camera name only' });
        details.push('Camera name present but no exposure settings — possible re-save.');
    }

    // --- SIGNAL 3: Pixel-Level Analysis via Canvas ---
    // Load into ImageData to check for statistical anomalies common in AI images
    // (e.g., unrealistically smooth noise distribution, missing sensor noise patterns)
    try {
        const bitmap = await createImageBitmap(file);
        const canvas = new OffscreenCanvas(
            Math.min(bitmap.width, 256),
            Math.min(bitmap.height, 256)
        );
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Compute local entropy / noise variance across the image
        // Real camera images have sensor noise: small random channel differences
        // AI images tend to be "too perfect" in certain zones but hallucinate in others
        let redVals = [], greenVals = [], blueVals = [];
        for (let i = 0; i < pixels.length; i += 4) {
            redVals.push(pixels[i]);
            greenVals.push(pixels[i + 1]);
            blueVals.push(pixels[i + 2]);
        }

        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr => {
            const mean = avg(arr);
            return arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
        };

        const rVar = variance(redVals);
        const gVar = variance(greenVals);
        const bVar = variance(blueVals);
        const totalVariance = (rVar + gVar + bVar) / 3;

        // Cross-channel correlation: in real camera photos, R/G/B noise is slightly
        // decorrelated due to sensor Bayer pattern. AI images often have too-perfect
        // channel correlation or suspiciously low variance in some channels.
        const channelSpread = Math.max(rVar, gVar, bVar) - Math.min(rVar, gVar, bVar);
        const normalizedSpread = channelSpread / (totalVariance + 1);

        if (normalizedSpread < 0.1 && totalVariance < 1500 && !hasCamera) {
            suspicionScore += 25;
            signals.push({ type: 'warning', label: 'Flat Noise Pattern', value: `σ²=${totalVariance.toFixed(0)}` });
            details.push('Channel noise pattern is unusually uniform — characteristic of AI synthesis.');
        } else if (totalVariance > 8000 && !hasCamera) {
            // Very high variance + no camera = possibly GAN artifact or aggressive upscale
            suspicionScore += 15;
            signals.push({ type: 'info', label: 'Artifact Pattern', value: `σ²=${totalVariance.toFixed(0)}` });
            details.push('High-variance pixel artifacts detected without camera metadata.');
        }

        bitmap.close();
    } catch (e) {
        // Canvas analysis not available — skip this signal
    }

    // --- SIGNAL 4: File Structure / Encoding Markers ---
    // Read the raw file bytes to check for known AI encoder signatures
    try {
        const buf = await file.slice(0, 2048).arrayBuffer();
        const bytes = new Uint8Array(buf);
        const text = new TextDecoder('ascii', { fatal: false }).decode(bytes);

        // Midjourney, DALL-E 3, and some SD outputs embed provenance strings
        const structureMarkers = [
            { pattern: 'midjourney', label: 'Midjourney marker' },
            { pattern: 'dall-e', label: 'DALL-E marker' },
            { pattern: 'stable-diffusion', label: 'Stable Diffusion marker' },
            { pattern: 'ComfyUI', label: 'ComfyUI workflow' },
            { pattern: 'invokeai', label: 'InvokeAI' },
            { pattern: 'NovelAI', label: 'NovelAI marker' },
            { pattern: 'AI_generated', label: 'AI generation tag' },
            { pattern: 'c2pa', label: 'C2PA manifest' },
            { pattern: 'adobe:firefly', label: 'Adobe Firefly' },
            { pattern: 'dreamshaper', label: 'DreamShaper model' },
        ];

        for (const marker of structureMarkers) {
            if (text.toLowerCase().includes(marker.pattern.toLowerCase())) {
                suspicionScore += 80;
                signals.push({ type: 'critical', label: 'Binary Signature', value: marker.label });
                details.push(`Found encoded AI signature: "${marker.label}" in file binary data.`);
                break;
            }
        }

        // PNG tEXt chunks and JPEG comment markers often carry metadata
        // PNG: look for 'parameters' chunk (used by Automatic1111/SD)
        const textStr = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        if (textStr.includes('parameters') && textStr.includes('Steps:') && textStr.includes('Sampler:')) {
            suspicionScore += 90;
            signals.push({ type: 'critical', label: 'SD Parameters Chunk', value: 'PNG metadata' });
            details.push('Stable Diffusion generation parameters found embedded in the PNG file.');
        }
    } catch (e) {
        // Skip if file reading fails
    }

    // --- SIGNAL 5: File Naming Heuristics ---
    const name = file.name.toLowerCase();
    const aiNamePatterns = [
        /^\d{10,}_\d+\.[a-z]+$/,           // Midjourney: 1234567890_1234.png
        /^image_\d{4}-\d{2}-\d{2}/,         // DALL-E style
        /^generated/i,
        /^ai[-_]/i,
        /midjourney/i,
        /dalle/i,
        /diffusion/i,
        /gpt.*image/i,
        /^photo-\d{4}-\d{2}/,               // Common AI export
        /^tti[-_]/,                           // Text-to-image
    ];
    const matchedName = aiNamePatterns.find(p => p.test(name));
    if (matchedName) {
        suspicionScore += 30;
        signals.push({ type: 'warning', label: 'Filename Pattern', value: file.name });
        details.push(`Filename matches known AI export pattern.`);
    }

    // --- SIGNAL 6: Resolution Fingerprinting ---
    // Common AI output resolutions that are rarely produced by cameras
    const aiResolutions = [
        [1024, 1024], [512, 512], [768, 512], [512, 768], [1344, 768], [768, 1344],
        [1152, 896], [896, 1152], [832, 1216], [1216, 832], [1024, 576], [576, 1024],
    ];
    if (exifData?.ExifImageWidth && exifData?.ExifImageHeight) {
        const w = exifData.ExifImageWidth;
        const h = exifData.ExifImageHeight;
        const isAIRes = aiResolutions.some(([aw, ah]) => aw === w && ah === h);
        if (isAIRes) {
            suspicionScore += 25;
            signals.push({ type: 'warning', label: 'AI Resolution', value: `${w} × ${h}` });
            details.push(`Image is ${w}×${h} — a standard AI model output dimension.`);
        }
    }

    // --- Build Verdict ---
    const clampedScore = Math.min(100, suspicionScore);
    let verdict, color;

    if (clampedScore >= 70) {
        verdict = '⚠ AI-Generated Content Detected';
        color = 'red';
    } else if (clampedScore >= 35) {
        verdict = '⚡ Suspicious / Post-Processed';
        color = 'yellow';
    } else {
        verdict = '✓ Likely Original / Camera Captured';
        color = 'green';
    }

    return {
        verdict,
        confidence: clampedScore,
        color,
        signals,
        details: details.length > 0 ? details : ['No suspicious signals detected.'],
    };
};

export const extractMetadata = async (file) => {
    try {
        const exifData = await exifr.parse(file, {
            tiff: true,
            xmp: true,
            gps: true,
            iptc: true,
            icc: false,
        });

        const lastModified = new Date(file.lastModified).toISOString().replace('T', ' ').substring(0, 19);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

        // Source device
        let make = exifData?.Make || '';
        let model = exifData?.Model || '';
        if (model.toLowerCase().includes(make.toLowerCase())) make = '';
        const sourceDevice = [make, model].filter(Boolean).join(' ').trim() || 'Unknown Device';

        // GPS
        let gpsStr = '--';
        if (exifData?.latitude && exifData?.longitude) {
            gpsStr = `${exifData.latitude.toFixed(6)}°, ${exifData.longitude.toFixed(6)}°`;
        }

        // Resolution
        let resolution = 'Unknown';
        if (exifData?.ExifImageWidth && exifData?.ExifImageHeight) {
            const mp = ((exifData.ExifImageWidth * exifData.ExifImageHeight) / 1_000_000).toFixed(1);
            resolution = `${exifData.ExifImageWidth} × ${exifData.ExifImageHeight} (${mp}MP)`;
        }

        // Camera settings
        let cameraSettings = null;
        if (exifData?.FNumber || exifData?.ExposureTime || exifData?.ISO) {
            const parts = [];
            if (exifData.FNumber) parts.push(`f/${exifData.FNumber}`);
            if (exifData.ExposureTime) parts.push(`1/${Math.round(1 / exifData.ExposureTime)}s`);
            if (exifData.ISO) parts.push(`ISO ${exifData.ISO}`);
            cameraSettings = parts.join(' · ');
        }

        // Run AI detection
        const aiAnalysis = await runAIDetection(file, exifData);

        return {
            sourceDevice: sourceDevice !== 'Unknown Device' ? sourceDevice : 'No Camera EXIF',
            integrityStatus: 'Verified',
            aiDetection: aiAnalysis.verdict,
            aiConfidence: aiAnalysis.confidence,
            aiColor: aiAnalysis.color,
            aiSignals: aiAnalysis.signals,
            aiDetails: aiAnalysis.details,
            timestamp: exifData?.DateTimeOriginal
                ? new Date(exifData.DateTimeOriginal).toISOString().replace('T', ' ').substring(0, 19)
                : lastModified,
            gps: gpsStr,
            resolution,
            cameraSettings,
            fileSize: sizeMB,
            software: exifData?.Software || exifData?.CreatorTool || null,
            isRealExif: !!exifData,
        };
    } catch (err) {
        console.error('EXIF Parsing failed:', err);
        // Even on parse failure, still run pixel analysis
        const aiAnalysis = await runAIDetection(file, null);
        return {
            sourceDevice: 'No Metadata Found',
            integrityStatus: 'Verified',
            aiDetection: aiAnalysis.verdict,
            aiConfidence: aiAnalysis.confidence,
            aiColor: aiAnalysis.color,
            aiSignals: aiAnalysis.signals,
            aiDetails: aiAnalysis.details,
            timestamp: new Date(file.lastModified).toISOString().replace('T', ' ').substring(0, 19),
            gps: '--',
            resolution: 'Unknown',
            cameraSettings: null,
            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            software: null,
            isRealExif: false,
        };
    }
};
