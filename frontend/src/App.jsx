import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { uploadPDF, getCases, getCase } from './api';
import PipelineVisualizer from './components/PipelineVisualizer';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);

  // Mock pipeline status for visualization demo
  const demoPipelineStatus = {
    phases: [
      { id: 'upload', status: 'completed' },
      { id: 'translate', status: 'completed' },
      { id: 'embeddings', status: 'in_progress' },
      { id: 'classify', status: 'pending' },
      { id: 'rag', status: 'pending' },
      { id: 'report', status: 'pending' }
    ],
    currentMessage: 'Creating vector embeddings for page 12/28...'
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set demo status for visualization
    if (selectedCase?.status === 'processing') {
      setPipelineStatus(demoPipelineStatus);
    } else {
      setPipelineStatus(null);
    }
  }, [selectedCase]);

  const fetchCases = async () => {
    try {
      const res = await getCases();
      setCases(res.data);
    } catch (err) {
      console.error('Failed to fetch cases');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadPDF(file);
      setFile(null);
      fetchCases();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chargesheet Processor</h1>
              <p className="text-sm text-gray-500">Hindi → English AI Pipeline with RAG</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Cases */}
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Chargesheet</h2>
              
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                
                {file ? (
                  <div className="space-y-3">
                    <p className="text-gray-700 font-medium">{file.name}</p>
                    <button
                      onClick={handleUpload}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : 'Start Processing'}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">Drag & drop your Hindi PDF here</p>
                    <p className="text-gray-400 text-sm mb-4">or</p>
                    <label className="cursor-pointer">
                      <span className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium">
                        Browse Files
                      </span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Previous Cases */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Cases</h2>
              
              {cases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No cases processed yet</p>
              ) : (
                <div className="space-y-3">
                  {cases.slice().reverse().map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        selectedCase?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{c.filename}</p>
                          <p className="text-sm text-gray-500">Case ID: {c.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          c.status === 'completed' ? 'bg-green-100 text-green-700' :
                          c.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Pipeline Visualization */}
          <div className="space-y-6">
            {selectedCase?.status === 'processing' && (
              <PipelineVisualizer status={pipelineStatus} />
            )}

            {selectedCase?.status === 'completed' && selectedCase?.result && (
              <ResultsDisplay result={selectedCase.result} />
            )}

            {!selectedCase && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
                <Clock className="w-16 h-16 mx-auto mb-4" />
                <p>Select a case to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;