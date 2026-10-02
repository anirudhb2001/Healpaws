import React from "react";
import { Brain, AlertTriangle, Info, Activity } from "lucide-react";

export default function AIPrediction({ aiSeverity, prediction, showAlways = false }) {
  if (!prediction) return null;

  // Helper function to extract diagnosis text from prediction
  const getDiagnosisText = () => {
    // If prediction is a string, return it directly
    if (typeof prediction === 'string') {
      return prediction;
    }

    // If prediction is an object, extract the diagnosis field
    if (typeof prediction === 'object' && prediction.diagnosis) {
      return prediction.diagnosis;
    }

    return "Analysis complete";
  };

  const diagnosisText = getDiagnosisText();

  // Don't show if diagnosis is "Unknown" or "Awaiting analysis" (unless showAlways is true)
  if (!showAlways && (!diagnosisText || diagnosisText === "Pending veterinary review" || diagnosisText === "Awaiting analysis")) {
    return null;
  }

  const getIconComponent = () => {
    if (!aiSeverity) return <Activity size={20} className="text-info" />;

    switch (aiSeverity.level) {
      case "high":
        return <AlertTriangle size={20} className="text-danger" />;
      case "medium":
        return <AlertTriangle size={20} className="text-warning" />;
      default:
        return <Info size={20} className="text-info" />;
    }
  };

  // Determine color scheme based on severity or use default
  const colorScheme = aiSeverity ? {
    color: aiSeverity.color,
    bgColor: aiSeverity.color === "danger"
      ? "#fff5f5"
      : aiSeverity.color === "warning"
        ? "#fff9f0"
        : "#f0f9ff",
    icon: aiSeverity.icon,
    message: aiSeverity.message
  } : {
    color: "info",
    bgColor: "#f0f9ff",
    icon: "🤖",
    message: "AI Analysis Available"
  };

  // Helper function to render prediction details
  const renderPredictionDetails = () => {
    // For "Unknown" diagnosis, show a different message
    if (diagnosisText === "Pending veterinary review") {
      return (
        <div>
          <p className="mb-2 small" style={{ lineHeight: "1.5" }}>
            AI analysis could not determine a specific diagnosis from the provided images.
            A veterinarian will review your case for professional assessment.
          </p>
        </div>
      );
    }

    // If it's just a string or a simple object with only diagnosis
    if (typeof prediction === 'string') {
      return (
        <p className="mb-2 small" style={{ lineHeight: "1.5" }}>
          {diagnosisText}
        </p>
      );
    }

    // If it's an object with structured data
    const hasConfidence = prediction.confidence !== null &&
      prediction.confidence !== undefined &&
      prediction.confidence > 0;

    const hasRecommendations = prediction.recommendations &&
      prediction.recommendations.length > 0;

    return (
      <div>
        <p className="mb-2 small" style={{ lineHeight: "1.5" }}>
          <strong>Diagnosis:</strong> {diagnosisText}
        </p>

        {hasConfidence && (
          <div className="mb-2">
            <small className="text-muted d-block mb-1">
              <strong>Confidence Level:</strong>
            </small>
            <div className="progress" style={{ height: "20px" }}>
              <div
                className={`progress-bar bg-${colorScheme.color}`}
                role="progressbar"
                style={{ width: `${Math.min(prediction.confidence, 100)}%` }}
                aria-valuenow={prediction.confidence}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {prediction.confidence.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {hasRecommendations && (
          <div className="mt-2">
            <p className="mb-1 fw-semibold" style={{ fontSize: "0.75rem" }}>
              <strong>AI Recommendations:</strong>
            </p>
            <ul className="mb-0" style={{ fontSize: "0.75rem", paddingLeft: "1.2rem" }}>
              {prediction.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {prediction.animalType && (
          <div className="mt-2">
            <small className="text-muted">
              <strong>Analyzed for:</strong> {prediction.animalType.charAt(0).toUpperCase() + prediction.animalType.slice(1)}
            </small>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`alert alert-${colorScheme.color} border-${colorScheme.color} mt-3`}
      style={{
        backgroundColor: colorScheme.bgColor,
        borderWidth: "1px"
      }}
    >
      <div className="d-flex align-items-start">
        <span className="me-2 mt-1" style={{ fontSize: "24px" }}>
          {colorScheme.icon}
        </span>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center mb-2">
            <Brain size={16} className={`text-${colorScheme.color} me-2`} />
            <h6 className={`text-${colorScheme.color} mb-0 fw-bold`}>
              AI Analysis Result
            </h6>
          </div>
          {renderPredictionDetails()}
          {aiSeverity && (
            <div className="d-flex align-items-center gap-2 mt-2">
              {getIconComponent()}
              <span className="badge bg-white text-dark border small">
                {colorScheme.message}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}