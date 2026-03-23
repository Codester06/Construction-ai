import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';

const BORDER = { style: BorderStyle.SINGLE, size: 8, color: 'D4C9BA' };
const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

function cellBorders(isHeader: boolean) {
  return {
    top: isHeader ? { style: BorderStyle.SINGLE, size: 12, color: '6B5D52' } : BORDER,
    bottom: BORDER,
    left: BORDER_NONE,
    right: BORDER_NONE,
  };
}

function parseInlineRuns(text: string, baseSize = 22, baseColor = '2A2420'): TextRun[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ text: part.slice(2, -2), bold: true, size: baseSize, color: baseColor });
    }
    return new TextRun({ text: part, size: baseSize, color: baseColor });
  });
}

function buildTable(tableLines: string[]): Table {
  const rows = tableLines.map(row =>
    row.split('|')
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      .map(c => c.trim())
  );

  const colCount = Math.max(...rows.map(r => r.length));
  // Distribute columns evenly as percentage (in fifths of a percent = pct * 50)
  const colWidthPct = Math.floor(5000 / colCount);

  return new Table({
    width: { size: 5000, type: WidthType.PERCENTAGE },
    margins: {
      top: convertInchesToTwip(0.04),
      bottom: convertInchesToTwip(0.04),
      left: convertInchesToTwip(0.1),
      right: convertInchesToTwip(0.1),
    },
    rows: rows.map((cells, rowIdx) => {
      const isHeader = rowIdx === 0;
      return new TableRow({
        tableHeader: isHeader,
        children: cells.map(cell =>
          new TableCell({
            width: { size: colWidthPct, type: WidthType.PERCENTAGE },
            shading: isHeader
              ? { type: ShadingType.SOLID, color: 'F4EFE8', fill: 'F4EFE8' }
              : rowIdx % 2 === 0
                ? { type: ShadingType.SOLID, color: 'FDFAF7', fill: 'FDFAF7' }
                : { type: ShadingType.SOLID, color: 'FFFFFF', fill: 'FFFFFF' },
            borders: cellBorders(isHeader),
            margins: {
              top: convertInchesToTwip(0.05),
              bottom: convertInchesToTwip(0.05),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
            children: [new Paragraph({
              children: parseInlineRuns(cell, isHeader ? 20 : 20, isHeader ? '4A3F36' : '2A2420'),
              spacing: { before: 40, after: 40 },
            })],
          })
        ),
      });
    }),
  });
}

function parseMarkdownToDocx(content: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection — look for separator row on next line
    if (
      line.trim().startsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().match(/^\|[\s\-:|]+\|$/)
    ) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!lines[i].trim().match(/^\|[\s\-:|]+\|$/)) {
          tableLines.push(lines[i]);
        }
        i++;
      }
      if (tableLines.length > 0) {
        elements.push(new Paragraph({ text: '', spacing: { before: 80 } }));
        elements.push(buildTable(tableLines));
        elements.push(new Paragraph({ text: '', spacing: { after: 160 } }));
      }
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
    } else if (line.startsWith('## ')) {
      elements.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
    } else if (line.startsWith('# ')) {
      elements.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.slice(2);
      elements.push(new Paragraph({
        children: parseInlineRuns(text),
        bullet: { level: 0 },
      }));
    } else if (line.match(/^---+$/)) {
      elements.push(new Paragraph({ text: '', spacing: { before: 120, after: 120 } }));
    } else if (line.trim() === '') {
      elements.push(new Paragraph({ text: '' }));
    } else {
      elements.push(new Paragraph({
        children: parseInlineRuns(line),
        alignment: AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
      }));
    }

    i++;
  }

  return elements;
}

export async function exportToDocx(content: string, title: string, subtitle: string, filename: string) {
  const bodyElements = parseMarkdownToDocx(content);

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal',
          run: { size: 36, bold: true, color: '2A2420' },
          paragraph: { spacing: { before: 320, after: 160 } },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal',
          run: { size: 28, bold: true, color: '2A2420' },
          paragraph: { spacing: { before: 240, after: 100 } },
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal',
          run: { size: 24, bold: true, color: '4A3F36' },
          paragraph: { spacing: { before: 180, after: 80 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1.2),
          },
        },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 44, color: '2A2420' })],
          spacing: { after: 160 },
        }),
        new Paragraph({
          children: [new TextRun({ text: subtitle, size: 22, color: '8B7D6B', italics: true })],
          spacing: { after: 480 },
        }),
        ...bodyElements,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
