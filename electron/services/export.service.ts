import * as fs from 'fs';
import * as path from 'path';

export async function exportToPDF(data: {
  note: any;
  mode: string;
  clozeLevel?: string;
  includeAnswerKey: boolean;
  filePath: string;
}) {
  const { note, mode, clozeLevel, includeAnswerKey, filePath } = data;

  // pdfmake 动态导入（CommonJS）
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      lineHeight: 1.5,
    },
    content: [
      // 标题
      {
        text: note.title || '康奈尔笔记',
        style: 'title',
        margin: [0, 0, 0, 5],
      },
      {
        text: `${mode === 'cloze' ? '挖空版' : '原文版'} · ${new Date(note.createdAt).toLocaleString('zh-CN')}`,
        style: 'subtitle',
        margin: [0, 0, 0, 15],
      },
      // 康奈尔表格
      {
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 0,
          widths: ['30%', '70%'],
          body: [
            [
              { text: '线索栏 Cues', style: 'header', fillColor: '#eff6ff', margin: [5, 5, 5, 5] },
              { text: '笔记栏 Notes', style: 'header', fillColor: '#f8fafc', margin: [5, 5, 5, 5] },
            ],
            [
              {
                stack: buildCueContent(note),
                fillColor: '#fafbff',
                margin: [5, 8, 5, 8],
              },
              {
                stack: buildNoteContent(note, mode),
                margin: [8, 8, 5, 8],
              },
            ],
          ],
        },
      },
      // 总结栏
      {
        layout: 'noBorders',
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: '总结栏 Summary', style: 'header', color: '#92400e', margin: [0, 10, 0, 5] },
                  { text: note.summary || '无总结内容', style: 'summary', color: '#78350f' },
                ],
                fillColor: '#fffbeb',
                margin: [5, 5, 5, 8],
              },
            ],
          ],
        },
      },
    ],
    styles: {
      title: { fontSize: 18, bold: true, color: '#1e293b' },
      subtitle: { fontSize: 9, color: '#94a3b8' },
      header: { fontSize: 10, bold: true },
      cueItem: { fontSize: 9, color: '#1e40af', margin: [0, 2, 0, 2] },
      noteItem: { fontSize: 9.5, color: '#1e293b', margin: [0, 3, 0, 3] },
      summary: { fontSize: 9, lineHeight: 1.6, italics: true },
      blank: { color: '#3b82f6', decoration: 'underline' },
      answer: { fontSize: 8, color: '#6b7280' },
    },
  };

  // 答案页
  if (mode === 'cloze' && includeAnswerKey) {
    docDefinition.content.push({ text: '', pageBreak: 'before' });
    docDefinition.content.push({ text: '答案参考', style: 'title', margin: [0, 0, 0, 10] });
    docDefinition.content.push({
      text: '以下为挖空部分的答案，供复习参考：',
      style: 'subtitle',
      margin: [0, 0, 0, 10],
    });

    const answers: string[] = [];
    for (const n of note.notes || []) {
      for (const kw of n.keywords || []) {
        answers.push(kw);
      }
    }

    docDefinition.content.push({
      ul: answers.map((a: string, i: number) => ({
        text: `${i + 1}. ${a}`,
        style: 'answer',
        margin: [0, 2, 0, 2],
      })),
    });
  }

  const pdfDoc = pdfMake.createPdf(docDefinition);

  return new Promise<void>((resolve, reject) => {
    pdfDoc.getBuffer((buffer: Buffer) => {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

function buildCueContent(note: any): any[] {
  return (note.cues || []).map((cue: any) => ({
    text: typeof cue === 'string' ? cue : cue.text,
    style: 'cueItem',
  }));
}

function buildNoteContent(note: any, mode: string): any[] {
  return (note.notes || []).map((n: any) => {
    let text = n.text;
    if (mode === 'cloze') {
      for (const kw of n.keywords || []) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escaped, 'g'), '______');
      }
    }
    return { text, style: 'noteItem' };
  });
}

export async function exportToWord(data: {
  note: any;
  mode: string;
  clozeLevel?: string;
  includeAnswerKey: boolean;
  filePath: string;
}) {
  const { note, mode, clozeLevel, includeAnswerKey, filePath } = data;

  const docx = await import('docx');
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel } = docx;

  const children: any[] = [];

  // 标题
  children.push(
    new Paragraph({
      children: [new TextRun({ text: note.title || '康奈尔笔记', bold: true, size: 36 })],
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${mode === 'cloze' ? '挖空版' : '原文版'} · ${new Date(note.createdAt).toLocaleString('zh-CN')}`,
          size: 18,
          color: '999999',
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // 康奈尔表格
  const tableRows: any[] = [];

  // 表头行
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: '线索栏 Cues', bold: true, size: 20 })],
            }),
          ],
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: 'eff6ff' },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: '笔记栏 Notes', bold: true, size: 20 })],
            }),
          ],
          width: { size: 70, type: WidthType.PERCENTAGE },
        }),
      ],
    })
  );

  // 内容行
  const cueChildren: any[] = (note.cues || []).length > 0
    ? (note.cues || []).map((c: any) =>
        new Paragraph({
          children: [new TextRun({ text: typeof c === 'string' ? c : c.text, size: 18, color: '1e40af' })],
          spacing: { after: 60 },
        })
      )
    : [new Paragraph({ children: [new TextRun({ text: '' })] })];

  const noteChildren: any[] = (note.notes || []).map((n: any) => {
    let text = n.text;
    if (mode === 'cloze') {
      for (const kw of n.keywords || []) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escaped, 'g'), '______');
      }
    }
    return new Paragraph({
      children: [new TextRun({ text, size: 18 })],
      spacing: { after: 80 },
    });
  });

  if (noteChildren.length === 0) {
    noteChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }

  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: cueChildren,
          shading: { fill: 'fafbff' },
        }),
        new TableCell({
          children: noteChildren,
        }),
      ],
    })
  );

  children.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  // 总结
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '总结栏 Summary', bold: true, size: 20, color: '92400e' }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: note.summary || '无总结内容', size: 18, italics: true, color: '78350f' }),
      ],
      spacing: { after: 200 },
    })
  );

  // 答案页
  if (mode === 'cloze' && includeAnswerKey) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '', break: 1 })],
        pageBreakBefore: true,
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '答案参考', bold: true, size: 36 })],
        spacing: { after: 200 },
      })
    );

    const answers: string[] = [];
    for (const n of note.notes || []) {
      for (const kw of n.keywords || []) {
        answers.push(kw);
      }
    }

    answers.forEach((a, i) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${a}`, size: 20 })],
          spacing: { after: 40 },
        })
      );
    });
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, Buffer.from(buffer));
}
