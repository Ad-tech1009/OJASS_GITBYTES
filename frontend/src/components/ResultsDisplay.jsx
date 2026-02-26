import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Scale, 
  Calendar, 
  MapPin, 
  FileText, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

const ResultsDisplay = ({ result }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [activeTab, setActiveTab] = useState('summary');

  if (!result) return null;

  const { Output_A, Output_B, Output_C, Output_D } = result;

  const toggleExpand = (itemKey) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const getStatusIcon = (status) => {
    if (status?.includes('✅')) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status?.includes('❌')) return <XCircle className="w-5 h-5 text-red-500" />;
    if (status?.includes('⚠')) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    if (status?.includes('✅')) return 'bg-green-50 border-green-200';
    if (status?.includes('❌')) return 'bg-red-50 border-red-200';
    if (status?.includes('⚠')) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getSimilarityColor = (score) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const entityIcons = {
    PERSON: <User className="w-4 h-4" />,
    LEGAL_SECTION: <Scale className="w-4 h-4" />,
    DATE_TIME: <Calendar className="w-4 h-4" />,
    LOCATION: <MapPin className="w-4 h-4" />,
    DOCUMENT: <FileText className="w-4 h-4" />,
    AMOUNT: <DollarSign className="w-4 h-4" />
  };

  const crimeType = Output_B?.crime_type;
  const checklistData = Output_C?.[crimeType] || {};

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: 'summary', label: 'Summary' },
          { id: 'checklist', label: 'Checklist' },
          { id: 'entities', label: 'Entities (NER)' },
          { id: 'similarity', label: 'Similarity Scores' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Case Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">FIR Number:</span> {Output_A?.FIR_Number}</p>
                <p><span className="text-gray-500">Date:</span> {Output_A?.Date}</p>
                <p><span className="text-gray-500">Police Station:</span> {Output_A?.Police_Station}</p>
                <p><span className="text-gray-500">Legal Sections:</span> {Output_A?.Legal_Sections}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Classification</h3>
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                {crimeType?.replace('_', ' ').toUpperCase()}
              </span>
              <p className="text-sm text-gray-600">{Output_B?.reason}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Incident Facts</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{Output_A?.Incident_Facts}</p>
          </div>
        </div>
      )}

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 mb-4">Evidence Checklist</h3>
          {Object.entries(checklistData).map(([item, data]) => (
            <div 
              key={item}
              className={`border rounded-lg p-4 transition ${getStatusColor(data.status)}`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(data.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{item}</h4>
                    <span className={`text-sm font-bold ${getSimilarityColor(data.similarity_score)}`}>
                      {data.similarity_score ? `${(data.similarity_score * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{data.detail}</p>
                  
                  {data.matched_text && (
                    <div className="mt-2 p-2 bg-white/50 rounded text-xs text-gray-700 font-mono">
                      "{data.matched_text}"
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Source: Page {data.source_page || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entities Tab */}
      {activeTab === 'entities' && Output_D && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 mb-4">Named Entities</h3>
          {Object.entries(Output_D).map(([type, entities]) => (
            entities.length > 0 && (
              <div key={type} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {entityIcons[type] || <Search className="w-4 h-4" />}
                  <h4 className="font-medium text-gray-800">{type.replace('_', ' ')}</h4>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {entities.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.map((entity, idx) => (
                    <div 
                      key={idx}
                      className="bg-white border rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{entity.text}</span>
                      {entity.role && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({entity.role})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Similarity Scores Tab */}
      {activeTab === 'similarity' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 mb-4">Semantic Similarity Analysis</h3>
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Each checklist item was compared against the document using vector similarity.
              Scores above 70% indicate strong matches.
            </p>
          </div>
          
          <div className="space-y-3">
            {Object.entries(checklistData)
              .sort((a, b) => (b[1].similarity_score || 0) - (a[1].similarity_score || 0))
              .map(([item, data]) => (
                <div key={item} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{item}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            data.similarity_score >= 0.7 ? 'bg-green-500' :
                            data.similarity_score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(data.similarity_score || 0) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-16 text-right ${getSimilarityColor(data.similarity_score)}`}>
                        {(data.similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {data.matched_text && (
                    <p className="text-xs text-gray-600 mt-2">
                      Matched: "{data.matched_text.substring(0, 150)}..."
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;