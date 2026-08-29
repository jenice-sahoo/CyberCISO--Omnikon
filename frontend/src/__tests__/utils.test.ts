import { cn, getGradeColor, getPriorityColor, formatCategory, formatVertical, generateSessionId } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('a', 'b')).toBe('a b');
      expect(cn('a', false && 'b')).toBe('a');
      expect(cn('a', { b: true, c: false })).toBe('a b');
    });
  });

  describe('getGradeColor', () => {
    it('returns correct classes for each grade', () => {
      expect(getGradeColor('A')).toContain('green');
      expect(getGradeColor('B')).toContain('green');
      expect(getGradeColor('C')).toContain('yellow');
      expect(getGradeColor('D')).toContain('orange');
      expect(getGradeColor('F')).toContain('red');
    });
  });

  describe('getPriorityColor', () => {
    it('returns correct classes for each priority', () => {
      expect(getPriorityColor('Critical')).toContain('red');
      expect(getPriorityColor('High')).toContain('orange');
      expect(getPriorityColor('Medium')).toContain('yellow');
      expect(getPriorityColor('Low')).toContain('blue');
    });
  });

  describe('formatCategory', () => {
    it('formats category names correctly', () => {
      expect(formatCategory('access_control')).toBe('Access Control');
      expect(formatCategory('data_backup')).toBe('Data Backup');
      expect(formatCategory('network_security')).toBe('Network Security');
      expect(formatCategory('email_phishing')).toBe('Email Phishing');
      expect(formatCategory('incident_response')).toBe('Incident Response');
    });
  });

  describe('formatVertical', () => {
    it('formats vertical names correctly', () => {
      expect(formatVertical('retail')).toBe('Retail');
      expect(formatVertical('healthcare_clinic')).toBe('Healthcare Clinic');
      expect(formatVertical('professional_services')).toBe('Professional Services');
    });
  });

  describe('generateSessionId', () => {
    it('generates unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });
});