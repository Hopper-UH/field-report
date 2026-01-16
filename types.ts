export enum ReportType {
  FIELD_INSPECTION = 'Field Inspection Report',
}

export interface Report {
  id: string;
  type: ReportType;
  
  // General Site Information
  date: string;
  timeRange: string; // e.g. "10:30AM to 1:30PM"
  projectName: string;
  jobId: string; // corresponds to the "N/A" or Project # box
  ownerDeveloper: string;
  projectAddress: string;
  stageOfConstruction: string;
  projectType: string;
  inspectionType: string;
  weather: string; // e.g. "Windy / 63 F"
  
  // Questions
  photosTaken: boolean;
  visualInspectionIssue: string; // "Is there any reason..."

  // Inspector Info
  inspectorName: string;
  inspectorPhone: string;
  inspectorEmail: string;
  signature: string; // Base64 data URL

  // Content
  generalComments: string;
  images: string[]; // Array of base64 image strings
  
  // Meta
  status: 'Draft' | 'Completed';
  createdAt: number;
}

export interface FormProps {
  onSave: (report: Report) => void;
  onCancel: () => void;
  initialData?: Report;
}