import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join } from 'path';

interface SnapshotData {
  vendorName: string;
  effective: string;
  expires: string;
  glLimit: string;
  autoCoverage: string;
  additionalInsured: string;
  waiver: string;
  violations: string[];
  complianceStatus: string;
}

export async function generateComplianceSnapshot(data: SnapshotData): Promise<Buffer> {
  const templatePath = join(process.cwd(), 'agent', 'docs', 'SNAPSHOT_TEMPLATE.html');
  let template = readFileSync(templatePath, 'utf-8');

  const generatedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  template = template
    .replace('{{ generatedAt }}', generatedAt)
    .replace('{{ vendorName }}', data.vendorName)
    .replace('{{ effective }}', data.effective)
    .replace('{{ expires }}', data.expires)
    .replace('{{ glLimit }}', data.glLimit)
    .replace('{{ additionalInsured }}', data.additionalInsured)
    .replace('{{ waiver }}', data.waiver);

  let violationsHtml = '';
  if (data.violations && data.violations.length > 0) {
    violationsHtml = data.violations.map(v => `<li class="fail">${v}</li>`).join('');
  } else {
    violationsHtml = '<li class="ok">All checks passed</li>';
  }

  template = template.replace(
    /{{#each violations}}.*?{{\/each}}\s*{{#unless violations\.length}}.*?{{\/unless}}/s,
    violationsHtml
  );

  const linesHtml = `
    <tr><td>General Liability</td><td>${data.glLimit}</td></tr>
    ${data.autoCoverage !== 'N/A' ? `<tr><td>Auto Coverage</td><td>${data.autoCoverage}</td></tr>` : ''}
  `;

  template = template.replace(
    /{{#each lines}}.*?{{\/each}}/s,
    linesHtml
  );

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setContent(template);
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
  });

  await browser.close();

  return pdfBuffer;
}
