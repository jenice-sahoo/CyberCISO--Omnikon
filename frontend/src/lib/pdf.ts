import { ScorecardResponse } from '@/types';

function getGradeColor(grade: string): [number, number, number] {
  const colors: Record<string, [number, number, number]> = {
    A: [22, 163, 74],
    B: [14, 165, 233],
    C: [234, 179, 8],
    D: [249, 115, 22],
    F: [220, 38, 38],
  };
  return colors[grade] || [107, 114, 128];
}

function getPriorityColor(priority: string): [number, number, number] {
  const colors: Record<string, [number, number, number]> = {
    Critical: [220, 38, 38],
    High: [234, 88, 12],
    Medium: [202, 138, 4],
    Low: [37, 99, 235],
  };
  return colors[priority] || [107, 114, 128];
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatVertical(vertical: string): string {
  const map: Record<string, string> = {
    retail: 'Retail',
    healthcare_clinic: 'Healthcare Clinic',
    professional_services: 'Professional Services',
  };
  return map[vertical] || vertical;
}

export async function exportScorecardToPDF(scorecard: ScorecardResponse): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CyberCISO', margin, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Virtual CISO Security Assessment', margin, 26);
  doc.text(
    `${formatVertical(scorecard.vertical)} | ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    margin, 33
  );
  y = 50;

  const [gr, gg, gb] = getGradeColor(scorecard.overall_grade);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, 50, 30, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, 50, 30, 3, 3, 'S');
  doc.setTextColor(gr, gg, gb);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(scorecard.overall_grade, margin + 25, y + 15, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`${scorecard.overall_score}/100`, margin + 25, y + 22, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Assessment Framework: NIST CSF 2.0 & CIS Controls v8', margin + 56, y + 10);
  doc.text(`Categories Assessed: 5 (Equally Weighted)`, margin + 56, y + 16);
  doc.text(`Remediation Actions: ${scorecard.remediation_plan.length} over 30 days`, margin + 56, y + 22);
  y += 38;

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Sub-Category Scores', margin, y);
  y += 6;

  for (const sc of scorecard.sub_categories) {
    if (y > pageH - 40) {
      doc.addPage();
      y = margin;
    }

    const [r, g, b] = getGradeColor(sc.grade);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentW, 32, 2, 2, 'FD');

    doc.setFillColor(r, g, b);
    doc.roundedRect(margin + contentW - 20, y + 3, 16, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(sc.grade, margin + contentW - 12, y + 8.5, { align: 'center' });

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCategory(sc.category), margin + 4, y + 8);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin + 4, y + 12, contentW - 8, 3, 1.5, 1.5, 'F');
    doc.setFillColor(r, g, b);
    const barW = Math.max(2, (sc.score / 100) * (contentW - 8));
    doc.roundedRect(margin + 4, y + 12, barW, 3, 1.5, 1.5, 'F');

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sc.score}/100`, margin + 4, y + 19);

    doc.setTextColor(75, 85, 99);
    doc.setFontSize(7);
    let fy = y + 23;
    for (const f of sc.findings) {
      doc.text(`• ${f}`, margin + 6, fy);
      fy += 3.5;
    }

    doc.setTextColor(156, 163, 175);
    doc.setFontSize(6);
    doc.text(`NIST: ${sc.nist_references.join(', ')}`, margin + 4, y + 30);
    doc.text(`CIS: ${sc.cis_references.join(', ')}`, margin + contentW / 2 + 2, y + 30);

    y += 36;
  }

  if (y > pageH - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('30-Day Prioritized Remediation Plan', margin, y);
  y += 8;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentW, y);
  doc.line(margin, y + 7, margin + contentW, y + 7);
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  const cols = [margin + 3, margin + 14, margin + 26, margin + 42, margin + 120, margin + 140, margin + 155];
  doc.text('Day', cols[0], y + 5);
  doc.text('Priority', cols[1], y + 5);
  doc.text('Category', cols[2], y + 5);
  doc.text('Action', cols[3], y + 5);
  doc.text('NIST', cols[5], y + 5);
  doc.text('CIS', cols[6], y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  for (const action of scorecard.remediation_plan) {
    if (y > pageH - 15) {
      doc.addPage();
      y = margin;
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, margin + contentW, y);
      doc.line(margin, y + 7, margin + contentW, y + 7);
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text('Day', cols[0], y + 5);
      doc.text('Priority', cols[1], y + 5);
      doc.text('Category', cols[2], y + 5);
      doc.text('Action', cols[3], y + 5);
      doc.text('NIST', cols[5], y + 5);
      doc.text('CIS', cols[6], y + 5);
      y += 7;
      doc.setFont('helvetica', 'normal');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentW, y);

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(6);
    doc.text(`D${action.day}`, cols[0], y + 4);

    const [pr, pg, pb] = getPriorityColor(action.priority);
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(cols[1] - 1, y + 1, 12, 3.5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.text(action.priority.charAt(0), cols[1] + 5, y + 3.5, { align: 'center' });

    doc.setTextColor(75, 85, 99);
    doc.setFontSize(6);
    doc.text(formatCategory(action.category), cols[2], y + 4);

    doc.setTextColor(31, 41, 55);
    const actionLines = doc.splitTextToSize(action.action, 76);
    doc.text(actionLines[0], cols[3], y + 4);

    doc.setTextColor(107, 114, 128);
    doc.text(action.nist_function, cols[5], y + 4);
    doc.text(action.cis_control, cols[6], y + 4);

    y += 6;
  }

  y += 6;

  if (y > pageH - 25) {
    doc.addPage();
    y = margin;
  }
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, contentW, 16, 2, 2, 'F');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('Disclaimer', margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  const disclaimer = doc.splitTextToSize(
    'This assessment is based on self-reported information and should not replace a professional security audit. NIST CSF 2.0 and CIS Controls v8 references are thematic; verify control numbers against official publications.',
    contentW - 8
  );
  doc.text(disclaimer, margin + 4, y + 10);

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const footerY = pageH - 10;
  doc.text('Generated by CyberCISO - Virtual CISO for Small Business', pageW / 2, footerY, { align: 'center' });

  doc.save(`CyberCISO_Scorecard_${scorecard.vertical}_${new Date().toISOString().split('T')[0]}.pdf`);
}
