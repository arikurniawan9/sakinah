// components/pelayan/CameraPermissionModal.js
import { X, Camera, RotateCcw } from 'lucide-react';

const CameraPermissionModal = ({ isOpen, onClose, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1001] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Izin Kamera Ditolak</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex flex-col items-center py-4">
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
              <Camera className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 text-center mb-4">
              Aplikasi membutuhkan izin kamera untuk fitur scan barcode. 
              Silakan aktifkan izin kamera di pengaturan browser Anda.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 w-full mb-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Langkah-langkah mengaktifkan kamera:</h4>
              <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>Klik ikon gembok atau info di sebelah kiri URL</li>
                <li>Cari izin kamera</li>
                <li>Pilih &quot;Izinkan&quot; atau &quot;Always Allow&quot;</li>
                <li>Muat ulang halaman</li>
              </ol>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPermissionModal;