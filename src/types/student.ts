export interface Student {
  id: number;
  name: string;
  rollNumber: string;
  studentId: string;
  dateOfBirth: string; // ISO date string for easier JSON serialization
  class: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentRequest {
  name: string;
  rollNumber: string;
  studentId: string;
  dateOfBirth: string;
  class: string;
}

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  id: number;
}

export interface StudentSearchFilters {
  name?: string;
  class?: string;
  rollNumber?: string;
}

export interface ExcelUploadResponse {
  success: boolean;
  studentsAdded: number;
  errors: string[];
  duplicates?: Student[];
}