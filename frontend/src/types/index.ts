export type Vertical = 'retail' | 'healthcare_clinic' | 'professional_services';

export type SubCategory = 'access_control' | 'data_backup' | 'network_security' | 'email_phishing' | 'incident_response';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export type NISTFunction = 'Identify' | 'Protect' | 'Detect' | 'Respond' | 'Recover';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SubCategoryScore {
  category: SubCategory;
  score: number;
  grade: Grade;
  findings: string[];
  nist_references: string[];
  cis_references: string[];
}

export interface RemediationAction {
  day: number;
  priority: Priority;
  category: SubCategory;
  action: string;
  nist_function: NISTFunction;
  nist_category: string;
  cis_control: string;
  effort_estimate: string;
}

export interface ScorecardResponse {
  overall_grade: Grade;
  overall_score: number;
  sub_categories: SubCategoryScore[];
  remediation_plan: RemediationAction[];
  vertical: Vertical;
  interview_complete: boolean;
  next_question: string | null;
}

export interface ChatRequest {
  message: string;
  conversation_history: ChatMessage[];
  vertical: Vertical | null;
  session_id: string;
}

export interface ChatResponse {
  response: string;
  scorecard: ScorecardResponse | null;
  interview_complete: boolean;
}

export interface SessionState {
  sessionId: string;
  vertical: Vertical | null;
  messages: ChatMessage[];
  scorecard: ScorecardResponse | null;
  interviewComplete: boolean;
  isLoading: boolean;
  error: string | null;
}