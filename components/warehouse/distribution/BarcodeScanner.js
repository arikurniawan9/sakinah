// components/warehouse/distribution/BarcodeScanner.js
import { useState, useEffect, useRef } from 'react';
import { Camera, Scan, X, Package } from 'lucide-react';

const BarcodeScanner = ({ onScan, darkMode, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Dapatkan daftar kamera yang tersedia
  useEffect(() => {
    const getVideoDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError('Gagal mengakses kamera: ' + err.message);
        console.error('Error accessing camera:', err);
      }
    };

    getVideoDevices();

    // Bersihkan stream saat komponen dilepas
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Mulai scanning
  const startScanning = async () => {
    setError('');
    
    try {
      const constraints = {
        video: selectedDevice ? { deviceId: { exact: selectedDevice } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setScanning(true);
      
      // Simulasikan pemindaian barcode (dalam implementasi nyata, kita akan menggunakan pustaka pihak ketiga)
      // Untuk saat ini, kita akan membuat fungsi untuk menangani input barcode secara manual
      simulateBarcodeDetection();
    } catch (err) {
      setError('Gagal mengakses kamera: ' + err.message);
      console.error('Error starting camera:', err);
    }
  };

  // Simulasikan deteksi barcode (dalam implementasi nyata, kita akan menggunakan pustaka seperti QuaggaJS atau ZXing)
  const simulateBarcodeDetection = () => {
    // Dalam implementasi nyata, kita akan menggunakan pustaka deteksi barcode
    // Untuk simulasi, kita akan membuat event listener untuk mendeteksi input cepat (seperti scan barcode)
    let barcodeInput = '';
    let barcodeTimeout;

    const handleKeyDown = (event) => {
      // Jika karakter diketik dengan cepat, kemungkinan itu adalah hasil scan barcode
      if (event.key.length === 1) {
        barcodeInput += event.key;
        
        // Reset timeout jika ada aktivitas baru
        clearTimeout(barcodeTimeout);
        
        // Set timeout untuk memproses input barcode
        barcodeTimeout = setTimeout(() => {
          if (barcodeInput.length >= 8) { // Barcode biasanya panjangnya minimal 8 karakter
            onScan(barcodeInput);
            barcodeInput = ''; // Reset input
          }
        }, 100); // Jika tidak ada input dalam 100ms, proses sebagai barcode
      }
      // Jika menekan Enter, proses sebagai barcode
      else if (event.key === 'Enter' && barcodeInput.length >= 8) {
        onScan(barcodeInput);
        barcodeInput = '';
        clearTimeout(barcodeTimeout);
      }
    };

    // Tambahkan event listener ke document
    document.addEventListener('keydown', handleKeyDown);

    // Kembalikan fungsi cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(barcodeTimeout);
    };
  };

  // Berhenti scanning
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // Pilih perangkat kamera
  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
    if (scanning) {
      stopScanning();
      startScanning();
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className={`rounded-xl shadow-2xl w-full max-w-2xl flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-lg font-semibold flex items-center">
            <Scan className="h-5 w-5 mr-2" />
            Pemindai Barcode
          </h2>
          <button 
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {error && (
            <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}>
              {error}
              {error.includes('Permission denied') && (
                <p className="mt-2 text-xs">
                  Catatan: Browser memerlukan HTTPS untuk mengakses kamera. Jika Anda mengakses situs ini melalui HTTP,
                  fitur ini mungkin tidak berfungsi. Coba akses melalui HTTPS atau gunakan localhost. Jika Anda menggunakan
                  pemindai barcode eksternal, Anda bisa langsung mengarahkannya ke input pencarian produk.
                </p>
              )}
            </div>
          )}

          {/* Pemilihan kamera */}
          {devices.length > 1 && (
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Pilih Kamera
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className={`w-full p-2 border rounded-md ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                {devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Kamera ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Area preview kamera */}
          <div className="relative mb-4 flex-1">
            {scanning ? (
              <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Overlay pemindai */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-green-500 w-4/5 h-1/3 rounded-lg relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`w-full h-64 rounded-lg flex flex-col items-center justify-center border-2 border-dashed ${
                darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-100'
              }`}>
                <Package className={`h-12 w-12 mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {devices.length > 0 
                    ? 'Kamera siap digunakan. Klik tombol di bawah untuk mulai memindai.' 
                    : 'Tidak ada kamera yang ditemukan.'}
                </p>
              </div>
            )}
          </div>

          {/* Instruksi */}
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <p className="font-medium mb-1">Cara menggunakan:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Arahkan barcode ke kamera (memerlukan HTTPS)</li>
              <li>Atau gunakan pemindai barcode eksternal (disarankan)</li>
              <li>Pastikan barcode terlihat jelas dalam frame</li>
              <li>Untuk pemindai eksternal, arahkan ke input pencarian produk</li>
            </ul>
          </div>

          {/* Tombol kontrol */}
          <div className="flex justify-center space-x-3">
            {!scanning ? (
              <button
                onClick={startScanning}
                disabled={devices.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  devices.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : darkMode
                      ? 'bg-green-700 hover:bg-green-600 text-white'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                <Camera className="h-4 w-4 mr-2" />
                Mulai Memindai
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                <X className="h-4 w-4 mr-2" />
                Berhenti Memindai
              </button>
            )}
            
            <button
              onClick={() => {
                stopScanning();
                onClose();
              }}
              className={`flex items-center px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              <X className="h-4 w-4 mr-2" />
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;