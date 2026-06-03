'use client';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Confirmer', danger = false }: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70]" onClick={onCancel} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl max-w-sm mx-auto p-6">
        <p className="text-sm font-semibold text-gray-500 mb-1">Hostn</p>
        <p className="text-gray-800 text-base mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0F4C8A] hover:bg-[#0A3566]'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
