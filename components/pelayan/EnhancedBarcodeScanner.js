'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CameraOff, RotateCcw, Zap, ZapOff, Maximize, Minimize, Check, Image as ImageIcon, Camera as CameraIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EnhancedBarcodeScanner = ({ onScan, onClose, onError }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cameraOptions, setCameraOptions] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isCameraBlocked, setIsCameraBlocked] = useState(false);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  };

  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameraOptions(devices);
        const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        setSelectedCamera(backCam ? backCam.id : devices[0].id);
      } else {
        setIsCameraBlocked(true);
        setError('Kamera tidak ditemukan.');
      }
    } catch (err) {
      setIsCameraBlocked(true);
      setError('Kamera diblokir (Wajib HTTPS untuk Live Scan)');
    }
  }, []);

  const initializeScanner = useCallback(async () => {
    if (!scannerRef.current || !selectedCamera) return;
    try {
      setIsLoading(true);
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      html5QrCodeRef.current = html5QrCode;
      const config = {
        fps: 20,
        qrbox: (w, h) => ({ width: w * 0.8, height: 150 }),
        aspectRatio: 1.0,
      };
      await html5QrCode.start(selectedCamera, config, (decodedText) => {
        playBeep();
        setScanSuccess(true);
        onScan(decodedText);
        setTimeout(() => setScanSuccess(false), 800);
      }, () => {});
      
      const track = html5QrCode.getActiveTrack();
      const capabilities = track.getCapabilities();
      setHasTorch(!!capabilities.torch);
      if (capabilities.zoom) {
        setMaxZoom(capabilities.zoom.max);
        setZoomLevel(capabilities.zoom.min);
      }
      setIsLoading(false);
      setError('');
    } catch (err) {
      console.error(err);
      setIsCameraBlocked(true);
      setError('Live Scan Gagal (Masalah Keamanan/HTTPS)');
      setIsLoading(false);
    }
  }, [selectedCamera, onScan]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    try {
      const html5QrCode = new Html5Qrcode("scanner-container");
      const decodedText = await html5QrCode.scanFile(file, true);
      playBeep();
      setScanSuccess(true);
      onScan(decodedText);
      setTimeout(() => setScanSuccess(false), 1000);
    } catch (err) {
      alert('Tidak ada barcode terdeteksi di foto tersebut. Pastikan foto jelas dan terang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAvailableCameras();
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [getAvailableCameras]);

  useEffect(() => {
    if (selectedCamera) initializeScanner();
  }, [selectedCamera, initializeScanner]);

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col overflow-hidden">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
            <CameraIcon size={20} />
          </div>
          <div>
            <h3 className="text-white font-black text-lg tracking-tight leading-none">SCANNER PRO</h3>
            <span className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Version 2.0 Fallback</span>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-xl transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div id="scanner-container" ref={scannerRef} className="w-full h-full object-cover"></div>
        
        {/* Bingkai Scan - Hanya muncul jika kamera aktif */}
        {!isCameraBlocked && !isLoading && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-72 h-44 border-2 border-white/20 rounded-[2rem] relative">
              <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-purple-500 rounded-tl-2xl"></div>
              <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-purple-500 rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-purple-500 rounded-bl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-purple-500 rounded-br-2xl"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/50 shadow-[0_0_15px_red] animate-scan-line"></div>
            </div>
          </div>
        )}

        {/* FALLBACK UI - Jika kamera diblokir browser */}
        {isCameraBlocked && (
          <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-8 text-center z-40">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <CameraOff size={48} className="text-red-500" />
            </div>
            <h4 className="text-white text-2xl font-black mb-2 uppercase">Kamera Live Diblokir</h4>
            <p className="text-gray-400 text-sm mb-10 max-w-xs">Browser melarang scan langsung tanpa HTTPS. Gunakan fitur <strong>Ambil Foto</strong> di bawah ini, tetap cepat dan akurat.</p>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <CameraIcon size={24} /> AMBIL FOTO BARCODE
            </button>
            <p className="text-gray-500 text-[10px] mt-4 font-bold uppercase tracking-widest italic">Solusi Cerdas Tanpa HTTPS</p>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Success Feedback */}
        <AnimatePresence>
          {scanSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-green-500/40 flex items-center justify-center z-[70] backdrop-blur-sm">
              <div className="bg-white p-8 rounded-full shadow-2xl"><Check size={80} className="text-green-600" /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="p-8 bg-gradient-to-t from-black via-black/80 to-transparent z-50">
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        
        <div className="max-w-md mx-auto flex flex-col gap-6">
          {!isCameraBlocked && maxZoom > 1 && (
            <div className="flex items-center gap-4 px-4 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <Minimize size={18} className="text-white/40" />
              <input type="range" min="1" max={maxZoom} step="0.1" value={zoomLevel} onChange={(e) => {
                const val = parseFloat(e.target.value);
                setZoomLevel(val);
                html5QrCodeRef.current?.applyVideoConstraints({ advanced: [{ zoom: val }] });
              }} className="flex-1 h-1 bg-white/20 rounded-lg appearance-none accent-purple-500" />
              <Maximize size={18} className="text-white/40" />
            </div>
          )}

          <div className="flex justify-center items-center gap-8">
            {!isCameraBlocked && hasTorch && (
              <button onClick={() => {
                const newState = !isTorchOn;
                html5QrCodeRef.current?.applyVideoConstraints({ advanced: [{ torch: newState }] });
                setIsTorchOn(newState);
              }} className={`p-6 rounded-[2rem] transition-all ${isTorchOn ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}>
                {isTorchOn ? <Zap size={32} fill="currentColor" /> : <ZapOff size={32} />}
              </button>
            )}

            {/* Tombol Ambil Foto selalu ada sebagai opsi tambahan (Powerful!) */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 bg-white/10 hover:bg-white/20 text-white rounded-[2rem] border border-white/10 transition-all active:scale-90"
              title="Gunakan Foto"
            >
              <ImageIcon size={32} />
            </button>

            {!isCameraBlocked && cameraOptions.length > 1 && (
              <button onClick={() => {
                const currentIdx = cameraOptions.findIndex(c => c.id === selectedCamera);
                setSelectedCamera(cameraOptions[(currentIdx + 1) % cameraOptions.length].id);
              }} className="p-6 bg-white/10 text-white rounded-[2rem] border border-white/10 active:scale-90 transition-all">
                <RotateCcw size={32} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan-line { 0% { top: 0; } 100% { top: 100%; } }
        .animate-scan-line { animation: scan-line 2.5s linear infinite; }
      `}</style>
    </div>
  );
};

export default EnhancedBarcodeScanner;
