import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Doc } from "../../convex/_generated/dataModel";
import { extractTextFromImageUrl } from "../utils/ocr";

interface SummaryModalProps {
  record: Doc<"medicalRecords"> & { fileUrl?: string | null };
  onClose: () => void;
}

export function SummaryModal({ record, onClose }: SummaryModalProps) {
  const [activeTab, setActiveTab] = useState<"patient" | "doctor">("patient");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);

  const analyzeReport = useAction(api.medicalRecords.analyzeReport);
  const saveOcrText = useMutation(api.medicalRecords.saveOcrText);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      let ocrText: string | undefined;

      // If record has a file but no OCR text, extract it first
      if (record.fileUrl && !record.ocrText) {
        toast.info("Extracting text from document using advanced OCR...");
        setOcrProgress(0);
        try {
          const ocrResult = await extractTextFromImageUrl(record.fileUrl, (progress) => {
            setOcrProgress(progress);
          });
          ocrText = ocrResult.text;
          
          if (ocrResult.confidence < 60) {
            toast.warning(`Text extracted with ${Math.round(ocrResult.confidence)}% confidence. You may want to review and edit manually.`);
          }
          
          // Save OCR text to the record
          await saveOcrText({ recordId: record._id, ocrText: ocrText || "" });
          toast.success(`Text extracted successfully! (${Math.round(ocrResult.confidence)}% confidence)`);
          setOcrProgress(0);
        } catch (ocrError) {
          console.error("OCR extraction failed:", ocrError);
          toast.error("OCR extraction failed. You can manually enter the text instead.");
          setShowManualInput(true);
          setOcrProgress(0);
          return;
        }
      }

      // Check if we have text to analyze
      const textToAnalyze = ocrText || record.ocrText;
      if (!textToAnalyze || textToAnalyze.trim().length < 10) {
        toast.error("No readable text found in the document. Please enter text manually.");
        setShowManualInput(true);
        return;
      }

      toast.info("Generating AI summary...");
      await analyzeReport({ 
        recordId: record._id, 
        ocrText: textToAnalyze 
      });
      
      toast.success("Summary generated successfully!");
    } catch (error) {
      console.error("Failed to generate summary:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("AI_API_KEY")) {
        toast.error("AI service not configured. Please contact your administrator to set up the AI API key.");
      } else if (errorMessage.includes("OCR_API_KEY")) {
        toast.error("OCR service not configured. Please contact your administrator to set up the OCR API key.");
      } else if (errorMessage.includes("Cohere API error")) {
        toast.error("AI service temporarily unavailable. Please try again later.");
      } else {
        toast.error(`Failed to generate summary: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualTextSubmit = async () => {
    if (!manualText.trim() || manualText.trim().length < 10) {
      toast.error("Please enter at least 10 characters of text to analyze.");
      return;
    }

    setIsGenerating(true);
    try {
      // Save the manual text to the record
      await saveOcrText({ recordId: record._id, ocrText: manualText.trim() });
      
      toast.info("Generating AI summary...");
      await analyzeReport({ 
        recordId: record._id, 
        ocrText: manualText.trim() 
      });
      
      toast.success("Summary generated successfully!");
      setShowManualInput(false);
      setManualText("");
    } catch (error) {
      console.error("Failed to generate summary:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("AI_API_KEY")) {
        toast.error("AI service not configured. Please contact your administrator to set up the AI API key.");
      } else if (errorMessage.includes("Cohere API error")) {
        toast.error("AI service temporarily unavailable. Please try again later.");
      } else {
        toast.error(`Failed to generate summary: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSummary = async () => {
    if (!confirm("Are you sure you want to regenerate the summary? This will overwrite the existing summary.")) {
      return;
    }

    setIsRegenerating(true);
    try {
      toast.info("Regenerating AI summary...");
      await analyzeReport({ 
        recordId: record._id, 
        ocrText: record.ocrText 
      });
      
      toast.success("Summary regenerated successfully!");
    } catch (error) {
      console.error("Failed to regenerate summary:", error);
      toast.error(`Failed to regenerate summary: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const getFlagColor = (flag: any) => {
    const note = flag.note?.toLowerCase() || "";
    if (note.includes("critical") || note.includes("urgent") || note.includes("high")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (note.includes("mild") || note.includes("slightly") || note.includes("borderline")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    if (note.includes("normal") || note.includes("good") || note.includes("within range")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">AI Report Summary</h2>
            <p className="text-gray-600">{record.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!record.summary ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generate AI Summary
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Use AI to analyze this medical record and generate both patient-friendly and doctor-focused summaries.
              </p>
              
              {showManualInput ? (
                <div className="max-w-2xl mx-auto mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                      OCR extraction failed. Please manually enter the text from your medical document below:
                    </p>
                  </div>
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Enter the text from your medical report here..."
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-center space-x-3 mt-4">
                    <button
                      onClick={() => {setShowManualInput(false); setManualText("");}}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleManualTextSubmit}
                      disabled={isGenerating || manualText.trim().length < 10}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        "Generate Summary"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>
                          {ocrProgress > 0 && ocrProgress < 100 
                            ? `Extracting Text... ${ocrProgress}%` 
                            : ocrProgress === 100 
                            ? "Generating AI Summary..." 
                            : "Processing..."}
                        </span>
                      </div>
                    ) : (
                      "Generate Summary"
                    )}
                  </button>
                  <div className="text-sm text-gray-500">
                    or{" "}
                    <button
                      onClick={() => setShowManualInput(true)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      enter text manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
                <div className="flex space-x-1 border-b">
                  <button
                    onClick={() => setActiveTab("patient")}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "patient"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Patient Summary
                  </button>
                  <button
                    onClick={() => setActiveTab("doctor")}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "doctor"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Clinical Summary
                  </button>
                </div>

                <div className="min-h-[200px]">
                  {activeTab === "patient" ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Patient-Friendly Summary</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {record.summary.patientSummary || "No patient summary available"}
                        </p>
                      </div>
                      {record.summary.flags && record.summary.flags.length > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
                          <div className="space-y-2">
                            {record.summary.flags.map((flag: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{flag.name}:</span> {flag.value} 
                                {flag.range && <span className="text-gray-600"> (Normal: {flag.range})</span>}
                                {flag.note && <div className="text-gray-700 mt-1">{flag.note}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Clinical Summary</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {record.summary.doctorSummary || "No clinical summary available"}
                        </p>
                      </div>
                      {record.summary.flags && record.summary.flags.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-medium text-red-900 mb-2">Clinical Flags</h4>
                          <div className="space-y-2">
                            {record.summary.flags.map((flag: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{flag.name}:</span> {flag.value}
                                {flag.range && <span className="text-gray-600"> (Ref: {flag.range})</span>}
                                {flag.note && <div className="text-gray-700 mt-1">{flag.note}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Meta Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Model:</span>
                    <span className="ml-2 text-gray-600">{record.summary.model}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Generated:</span>
                    <span className="ml-2 text-gray-600">
                      {formatDate(record.summary.generatedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Generated by:</span>
                    <span className="ml-2 text-gray-600">
                      {record.summary.generatedBy === record.uploadedById ? "Record Owner" : "Authorized User"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleRegenerateSummary}
                  disabled={isRegenerating}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegenerating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Regenerating...</span>
                    </div>
                  ) : (
                    "Regenerate Summary"
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
