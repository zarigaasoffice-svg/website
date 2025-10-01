import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Phone, Mail } from 'lucide-react';
import type { Pitch } from '../types/models';

interface PitchesTabProps {
  pitches: Pitch[];
  onStatusUpdate: (pitchId: string, status: 'approved' | 'rejected') => Promise<void>;
}

export const PitchesTab: React.FC<PitchesTabProps> = ({ pitches, onStatusUpdate }) => {
  // Filter pitches by status
  const pendingPitches = pitches.filter(p => p.status === 'pending');
  const approvedPitches = pitches.filter(p => p.status === 'approved');
  const rejectedPitches = pitches.filter(p => p.status === 'rejected');

  // Common contact info rendering
  const renderContactInfo = (pitch: Pitch) => (
    <div className="space-y-1">
      <div className="flex items-center text-sm text-gray-600">
        <Mail className="w-4 h-4 mr-1.5" />
        <span>{pitch.email}</span>
      </div>
      {pitch.phone && (
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-1.5" />
          <span>{pitch.phone}</span>
        </div>
      )}
    </div>
  );

  // Render a single pitch card
  const renderPitchCard = (pitch: Pitch) => (
    <motion.div
      key={pitch.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${
        pitch.status === 'pending'
          ? 'border-yellow-400'
          : pitch.status === 'approved'
          ? 'border-green-400'
          : 'border-red-400'
      }`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {pitch.name || pitch.email}
            </h3>
            {renderContactInfo(pitch)}
            <p className="text-sm text-gray-500 mt-2">
              {pitch.createdAt instanceof Date
                ? pitch.createdAt.toLocaleString()
                : new Date((pitch.createdAt as any).seconds * 1000).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {pitch.status === 'pending' && (
              <>
                <button
                  onClick={() => onStatusUpdate(pitch.id, 'approved')}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Approve pitch"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onStatusUpdate(pitch.id, 'rejected')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Reject pitch"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              pitch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              pitch.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {pitch.status.charAt(0).toUpperCase() + pitch.status.slice(1)}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div>
            <span className="font-medium text-gray-700">Product:</span>
            <span className="ml-2">{pitch.sareeName || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Message:</span>
            <p className="mt-1 text-gray-600">{pitch.message}</p>
          </div>
          {pitch.pitch && pitch.pitch !== pitch.message && (
            <div>
              <span className="font-medium text-gray-700">Pitch:</span>
              <p className="mt-1 text-gray-600">{pitch.pitch}</p>
            </div>
          )}
          {pitch.proposedPrice && (
            <div>
              <span className="font-medium text-gray-700">Proposed Price:</span>
              <span className="ml-2">?{pitch.proposedPrice.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Pitches Overview</h2>
        <div className="text-sm text-gray-500">
          {pitches.length} total  {pendingPitches.length} pending
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-yellow-50 rounded-lg transition-colors hover:bg-yellow-100">
          <h4 className="font-medium text-yellow-800">Pending</h4>
          <p className="text-2xl font-bold text-yellow-600">{pendingPitches.length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg transition-colors hover:bg-green-100">
          <h4 className="font-medium text-green-800">Approved</h4>
          <p className="text-2xl font-bold text-green-600">{approvedPitches.length}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg transition-colors hover:bg-red-100">
          <h4 className="font-medium text-red-800">Rejected</h4>
          <p className="text-2xl font-bold text-red-600">{rejectedPitches.length}</p>
        </div>
      </div>

      {pitches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No pitches yet</h3>
          <p className="mt-2 text-sm text-gray-500">When users make pitches for products, they'll appear here.</p>
        </div>
      ) : (
        <>
          {pendingPitches.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pending Pitches</h3>
              <div className="space-y-4">
                {pendingPitches.map(renderPitchCard)}
              </div>
            </div>
          )}

          {(approvedPitches.length > 0 || rejectedPitches.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Previous Pitches</h3>
              <div className="space-y-4">
                {[...approvedPitches, ...rejectedPitches]
                  .sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date((a.createdAt as any).seconds * 1000);
                    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date((b.createdAt as any).seconds * 1000);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map(renderPitchCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
