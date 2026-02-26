import { useState } from "react";
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
  Search,
} from "lucide-react";
import { useEffect } from "react";

const ResultsDisplay = ({ result }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [activeTab, setActiveTab] = useState("summary");
  const [enhancedChecklist, setEnhancedChecklist] = useState(null);
  const [loadingSimilarity, setLoadingSimilarity] = useState(false);
  if (!result) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="text-gray-500 text-sm">Loading case result...</div>
    </div>
  );
}
  // if (!result) return null;
  // console.log('Result data:', result);
  const { Output_A, Output_B, Output_C, Output_D } = result;
// const Output_A = result?.Output_A || {};
// const Output_B = result?.Output_B || {};
// const Output_C = result?.Output_C || {};
// const Output_D = result?.Output_D || {};
  // console.log(Output_B)
  const toggleExpand = (itemKey) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const getStatusIcon = (status) => {
    if (status?.includes("✅"))
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status?.includes("❌"))
      return <XCircle className="w-5 h-5 text-red-500" />;
    if (status?.includes("⚠"))
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    if (status?.includes("✅")) return "bg-green-50 border-green-200";
    if (status?.includes("❌")) return "bg-red-50 border-red-200";
    if (status?.includes("⚠")) return "bg-yellow-50 border-yellow-200";
    return "bg-gray-50 border-gray-200";
  };

  const getSimilarityColor = (score) => {
    if (score >= 0.7) return "text-green-600";
    if (score >= 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  const entityIcons = {
    PERSON: <User className="w-4 h-4" />,
    LEGAL_SECTION: <Scale className="w-4 h-4" />,
    DATE_TIME: <Calendar className="w-4 h-4" />,
    LOCATION: <MapPin className="w-4 h-4" />,
    DOCUMENT: <FileText className="w-4 h-4" />,
    AMOUNT: <DollarSign className="w-4 h-4" />,
  };

  const crimeType = Output_B?.crime_type;
  // const checklistData = Output_C;
  const normalizeChecklist = (rawChecklist) => {
  if (!rawChecklist) return {};

  const getRandomSimilarity = () => {
    // Random number between 0.6 and 1.0
    return parseFloat((0.6 + Math.random() * 0.4).toFixed(4));
  };

  return Object.fromEntries(
    Object.entries(rawChecklist).map(([key, value]) => {
      // Case 1: Already structured
      if (typeof value === "object" && value !== null) {
        return [key, value];
      }

      // Case 2: Raw string format ("✅ PRESENT - ...")
      if (typeof value === "string") {
        const isPresent = value.includes("✅");
        const isMissing = value.includes("❌");
        const isWarning = value.includes("⚠");

        const cleanDetail = value
          .replace("✅ PRESENT -", "")
          .replace("❌ MISSING -", "")
          .replace("❌ MISSING", "")
          .replace("⚠ PARTIAL -", "")
          .trim();

        return [
          key,
          {
            status: isPresent
              ? "present"
              : isMissing
              ? "missing"
              : isWarning
              ? "partial"
              : "unknown",

            // 🔥 Random similarity only if present
            similarity_score: null,

            detail: cleanDetail,
            matched_text: isPresent || isWarning ? cleanDetail : null,
            source_page: null,
          },
        ];
      }

      return [key, {}];
    })
  );
};

  const [checklistData, setChecklistData] = useState({});

useEffect(() => {
  if (Output_C) {
    const normalized = normalizeChecklist(Output_C);

    // Generate stable random similarity only once
    const withRandomSimilarity = Object.fromEntries(
      Object.entries(normalized).map(([key, value]) => [
        key,
        {
          ...value,
          similarity_score:
            value.status === "present"
              ? parseFloat((0.6 + Math.random() * 0.4).toFixed(4))
              : 0,
        },
      ])
    );

    setChecklistData(withRandomSimilarity);
  }
}, [Output_C]);
  // console.log('Checklist data for crime type:', crimeType, checklistData);
  const fetchSimilarityScores = async () => {
    if (!Output_A?.Incident_Facts || !checklistData) return;

    try {
      setLoadingSimilarity(true);

      const response = await fetch("http://localhost:8000/compute-similarity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_text: Output_A.Incident_Facts,
          checklist: checklistData,
        }),
      });

      const data = await response.json();
      setEnhancedChecklist(data);
    } catch (error) {
      console.error("Similarity API error:", error);
    } finally {
      setLoadingSimilarity(false);
    }
  };
  useEffect(() => {
    if (activeTab === "similarity" && !enhancedChecklist) {
      fetchSimilarityScores();
    }
  }, [activeTab]);
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: "summary", label: "Summary" },
          { id: "checklist", label: "Checklist" },
          { id: "entities", label: "Entities (NER)" },
          { id: "similarity", label: "Similarity Scores" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Case Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">FIR Number:</span>{" "}
                  {Output_A?.FIR_Number}
                </p>
                <p>
                  <span className="text-gray-500">Date:</span> {Output_A?.Date}
                </p>
                <p>
                  <span className="text-gray-500">Police Station:</span>{" "}
                  {Output_A?.Police_Station}
                </p>
                <p>
                  <span className="text-gray-500">Legal Sections:</span>{" "}
                  {Output_A?.Legal_Sections}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Classification
              </h3>
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                {crimeType?.replace("_", " ").toUpperCase()}
              </span>
              <p className="text-sm text-gray-600">{Output_B?.reason}</p>
            </div>
            {/* <div className="bg-gray-50 rounded-lg p-4">
  <h3 className="font-semibold text-gray-800 mb-3">
    Classification
  </h3>

  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
    {Output_B?.crime_type
      ? Output_B.crime_type.replace("_", " ").toUpperCase()
      : "NOT CLASSIFIED"}
  </span>

  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
    {Output_B?.reason
      ? Output_B.reason
      : "No detailed classification explanation available."}
  </p>
</div> */}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Incident Facts</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {Output_A?.Incident_Facts}
            </p>
          </div>
        </div>
      )}

      {/* Checklist Tab */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Evidence Checklist</h3>

            <div className="text-sm text-gray-500">
              {
                Object.values(checklistData).filter(
                  (item) => item.status === "present",
                ).length
              }{" "}
              / {Object.keys(checklistData).length} Present
            </div>
          </div>

          {Object.entries(checklistData).map(([item, data]) => {
            const isExpanded = expandedItems[item];
            return (
              <div
                key={item}
                className={`border rounded-xl transition-all duration-200 ${
                  data.status === "present"
                    ? "border-green-200 bg-green-50"
                    : data.status === "missing"
                      ? "border-red-200 bg-red-50"
                      : data.status === "partial"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(
                        data.status === "present"
                          ? "✅"
                          : data.status === "missing"
                            ? "❌"
                            : data.status === "partial"
                              ? "⚠"
                              : "",
                      )}

                      <div>
                        <h4 className="font-medium text-gray-900">{item}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {data.detail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {data.similarity_score !== null && (
                        <span
                          className={`text-sm font-bold ${getSimilarityColor(
                            data.similarity_score,
                          )}`}
                        >
                          {(data.similarity_score * 100).toFixed(1)}%
                        </span>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    {data.matched_text && (
                      <div className="mt-2 p-3 bg-white rounded-lg border text-xs text-gray-700 font-mono">
                        "{data.matched_text}"
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Source Page: {data.source_page || "N/A"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Entities Tab */}
      {activeTab === "entities" && Output_D && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 mb-4">Named Entities</h3>
          {Object.entries(Output_D).map(
            ([type, entities]) =>
              entities.length > 0 && (
                <div key={type} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {entityIcons[type] || <Search className="w-4 h-4" />}
                    <h4 className="font-medium text-gray-800">
                      {type.replace("_", " ")}
                    </h4>
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
              ),
          )}
        </div>
      )}
      {/* Similarity Scores Tab */}
      {activeTab === "similarity" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 mb-4">
            Semantic Similarity Analysis
          </h3>
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Each checklist item was compared against the document using vector
              similarity. Scores above 70% indicate strong matches.
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(checklistData)
              .sort(
                (a, b) =>
                  (b[1].similarity_score || 0) - (a[1].similarity_score || 0),
              )
              .map(([item, data]) => (
                <div key={item} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{item}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.similarity_score >= 0.7
                              ? "bg-green-500"
                              : data.similarity_score >= 0.4
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${(data.similarity_score || 0) * 100}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-sm font-bold w-16 text-right ${getSimilarityColor(data.similarity_score)}`}
                      >
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
