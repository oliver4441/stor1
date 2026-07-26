import { Download } from 'lucide-react';
import { downloadReceipt } from '../utils/api';

export default function InvoiceButton({ order, items }) {
  if (!order || !items || items.length === 0) return null;

  const handleDownload = (e) => {
    e.stopPropagation();
    try {
      downloadReceipt(order, items);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full bg-[#1E2A3D] border border-[#353F54] text-[#8E9BB5] hover:bg-[#353F54] hover:text-white transition-all shadow-sm"
    >
      <Download className="w-4 h-4" />
      Receipt
    </button>
  );
}
