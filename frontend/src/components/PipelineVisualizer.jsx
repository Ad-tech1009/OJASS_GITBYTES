import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Loader2, 
  Clock, 
  FileText, 
  Languages, 
  Database, 
  Search, 
  FileCheck 
} from 'lucide-react';

const PipelineVisualizer = ({ status }) => {
  const phases = [
    { 
      id: 'upload', 
      label: 'Upload', 
      icon: FileText,
      description: 'PDF received'
    },
    { 
      id: 'translate', 
      label: 'Translation', 
      icon: Languages,
      description: 'Hindi → English'
    },
    { 
      id: 'embeddings', 
      label: 'Vector DB', 
      icon: Database,
      description: 'Creating embeddings'
    },
    { 
      id: 'classify', 
      label: 'Classification', 
      icon: Search,
      description: 'Detecting crime type'
    },
    { 
      id: 'rag', 
      label: 'RAG Analysis', 
      icon: Search,
      description: 'Similarity search'
    },
    { 
      id: 'report', 
      label: 'Report', 
      icon: FileCheck,
      description: 'Generating output'
    }
  ];

  const getPhaseStatus = (phaseId) => {
    if (!status) return 'pending';
    const phaseStatus = status.phases?.find(p => p.id === phaseId);
    return phaseStatus?.status || 'pending';
  };

  const getStatusIcon = (phaseStatus) => {
    switch (phaseStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-300" />;
    }
  };

  const getProgressPercentage = () => {
    if (!status || !status.phases) return 0;
    const completed = status.phases.filter(p => p.status === 'completed').length;
    return Math.round((completed / phases.length) * 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Processing Pipeline</h2>
        <span className="text-sm font-medium text-blue-600">
          {getProgressPercentage()}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Phase Timeline */}
      <div className="space-y-4">
        {phases.map((phase, idx) => {
          const phaseStatus = getPhaseStatus(phase.id);
          const Icon = phase.icon;
          
          return (
            <div 
              key={phase.id}
              className={`flex items-center p-3 rounded-lg transition ${
                phaseStatus === 'in_progress' ? 'bg-blue-50 border border-blue-200' : 
                phaseStatus === 'completed' ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                phaseStatus === 'completed' ? 'bg-green-100' :
                phaseStatus === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {getStatusIcon(phaseStatus)}
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium ${
                    phaseStatus === 'in_progress' ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {phase.label}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    phaseStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    phaseStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {phaseStatus === 'completed' ? 'Done' :
                     phaseStatus === 'in_progress' ? 'Running' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{phase.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Log */}
      {status?.currentMessage && (
        <div className="mt-6 p-3 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Live Status:</p>
          <p className="text-sm text-green-400 font-mono">
            {status.currentMessage}
          </p>
        </div>
      )}
    </div>
  );
};

export default PipelineVisualizer;