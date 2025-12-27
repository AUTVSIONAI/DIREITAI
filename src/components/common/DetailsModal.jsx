import React from 'react';
import { X, ExternalLink, Calendar, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const DetailsModal = ({ isOpen, onClose, item, type = 'notification' }) => {
  if (!isOpen || !item) return null;

  const isAnnouncement = type === 'announcement';
  const title = item.title;
  const message = item.message || item.content;
  const actionUrl = item.action_url || item.action?.url;
  const actionLabel = item.action_label || item.action?.label || 'Ver mais';
  const severity = item.type || 'info';

  const getIcon = () => {
    const props = { className: "h-6 w-6" };
    switch (severity) {
      case 'success': return <CheckCircle {...props} className="text-green-600" />;
      case 'warning': return <AlertTriangle {...props} className="text-yellow-600" />;
      case 'error': return <AlertCircle {...props} className="text-red-600" />;
      default: return <Info {...props} className="text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (severity) {
      case 'success': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      case 'error': return 'bg-red-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${getBgColor()} rounded-t-lg`}>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <div className="prose prose-sm max-w-none text-gray-600">
            <p className="whitespace-pre-wrap">{message}</p>
          </div>

          <div className="flex items-center text-xs text-gray-500 mt-4">
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              {new Date(item.created_at).toLocaleDateString()} às {new Date(item.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Fechar
          </button>
          
          {actionUrl && (
            <a
              href={actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                // Se for necessário alguma lógica adicional ao clicar no link
              }}
            >
              <span>{actionLabel}</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
