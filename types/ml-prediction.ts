export type MlPrediction = {
  sessionId: string;
  mlPrediction: string;
  confidence: number;
  probabilities: {
    legitimate: number;
    suspicious: number;
  };
  score: number;
  level: string;
  predictionId: string;
};

