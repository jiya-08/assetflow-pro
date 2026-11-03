import React from 'react';
import Modal from '../common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, QrCode } from 'lucide-react';

export const QRCodeModal = ({ isOpen, onClose, asset }) => {
  if (!asset) return null;

  const qrData = JSON.stringify({
    assetId: asset.assetId,
    name: asset.name,
    category: asset.category,
    serialNumber: asset.serialNumber,
    brand: asset.brand,
    model: asset.model,
    status: asset.status
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const svg = document.getElementById('asset-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${asset.assetId}-QR-Tag.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Digital Tag"
      subtitle={`Hardware identification QR tag for ${asset.assetId}`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl shadow-sm mb-4">
          <QRCodeSVG
            id="asset-qr-svg"
            value={qrData}
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-left mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Asset ID</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{asset.assetId}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">{asset.name}</h4>
          <p className="text-xs text-slate-500 mb-2">{asset.brand} {asset.model} • {asset.category}</p>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200/60">
            S/N: {asset.serialNumber}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm shadow-blue-200"
          >
            <Printer className="w-4 h-4" />
            Print Label
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal;
