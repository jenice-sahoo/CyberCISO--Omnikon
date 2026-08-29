import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: 'bg-green-100 text-green-800 border-green-200',
    B: 'bg-green-100 text-green-800 border-green-200',
    C: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    D: 'bg-orange-100 text-orange-800 border-orange-200',
    F: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[grade] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    Critical: 'bg-red-100 text-red-800 border-red-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function formatCategory(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatVertical(vertical: string): string {
  const map: Record<string, string> = {
    retail: 'Retail',
    healthcare_clinic: 'Healthcare Clinic',
    professional_services: 'Professional Services',
  };
  return map[vertical] || vertical;
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}