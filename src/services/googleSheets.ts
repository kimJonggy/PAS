import type { ShareRecord, SocietySummary, MonthKey } from '../types.ts';
import { ALL_MONTHS } from '../types.ts';
import { calculateShareRecord } from '../utils/calculations.ts';

export interface SheetMetadata {
  id: string;
  title: string;
  sheetName: string;
  sheetId: number;
  url: string;
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Generates the EXACT 6-row header + 31 member share rows + Grand Total
 * strictly matching the official Progressive Association Society register format (Image 2).
 */
export function formatSharesForSheet(
  shares: ShareRecord[],
  summary: SocietySummary
): (string | number)[][] {
  const rows: (string | number)[][] = [];

  // Row 1 (Index 0): Title Banner
  const row1 = new Array(20).fill('');
  row1[0] = 'PROGRESSIVE ASSOCIATION SOCIETY';
  rows.push(row1);

  // Row 2 (Index 1): Sub-title Banner
  const row2 = new Array(20).fill('');
  row2[0] = 'MEMBER PAYMENT & INSTALLMENT DASHBOARD';
  rows.push(row2);

  // Row 3 (Index 2): KPI Cards Top Header
  const row3 = new Array(20).fill('');
  row3[0] = 'TOTAL ACTIVE SHARES'; // Cols A-B
  row3[2] = 'TOTAL BANK DEPOSIT'; // Cols C-G
  row3[7] = 'TOTAL OUTSTANDING DUE'; // Cols H-M
  row3[13] = 'COLLECTION EFFICIENCY'; // Cols N-T
  rows.push(row3);

  // Row 4 (Index 3): KPI Cards Values & Sub-stats
  const row4 = new Array(20).fill('');
  row4[0] = `${summary.totalActiveShares} Shares`;
  row4[1] = '21 Active Members (32 Allotted IDs)';
  row4[2] = `Tk. ${summary.totalBankDeposit.toLocaleString('en-IN')}`;
  row4[3] = `Admission: Tk. ${summary.totalAdmissionCollected.toLocaleString('en-IN')} | Monthly: Tk. ${summary.totalMonthlyCollected.toLocaleString('en-IN')} | Late Fee: Tk. ${summary.totalLateFeeCollected.toLocaleString('en-IN')}`;
  row4[7] = `Tk. ${summary.totalOutstandingDue.toLocaleString('en-IN')}`;
  row4[8] = `Due: Tk. ${summary.totalDuePrincipal.toLocaleString('en-IN')} + Late Fee: Tk. ${summary.totalLateFeeDue.toLocaleString('en-IN')}`;
  row4[13] = `${summary.collectionEfficiency}%`;
  rows.push(row4);

  // Row 5 (Index 4): Table Main Headers
  rows.push([
    'SL',
    'Member Name',
    'Share ID',
    'Admission Fee',
    'Month of Aug-26',
    '',
    'Month of Sep-26',
    '',
    'Month of Oct-26',
    '',
    'Month of Nov-26',
    '',
    'Month of Dec-26',
    '',
    'Total Deposit',
    'Due Months',
    'Due Amount',
    'Late Fee / Fine',
    'Total Due',
    'Late Fee Paid',
  ]);

  // Row 6 (Index 5): Sub-header (Date / Amount columns)
  rows.push([
    '',
    '',
    '',
    '',
    'Date',
    'Amount',
    'Date',
    'Amount',
    'Date',
    'Amount',
    'Date',
    'Amount',
    'Date',
    'Amount',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  // Data rows (Row 7 to 37)
  let lastSeenMemberName = '';
  for (const s of shares) {
    const isSameMemberAsPrevious = s.memberName === lastSeenMemberName && !s.isClosed;
    lastSeenMemberName = s.memberName;

    const aug = s.months['Aug-26'];
    const sep = s.months['Sep-26'];
    const oct = s.months['Oct-26'];
    const nov = s.months['Nov-26'];
    const dec = s.months['Dec-26'];

    // In Image 2: Multi-share holders leave SL and Member Name blank on follow-up rows
    let slDisplay: string | number = '';
    let nameDisplay: string = s.memberName;

    if (s.isClosed) {
      slDisplay = '';
      nameDisplay = 'Closed Id';
    } else if (isSameMemberAsPrevious) {
      slDisplay = '';
      nameDisplay = ''; // Merged visually in sheet
    } else {
      slDisplay = s.sl ? String(s.sl).padStart(2, '0') : '';
      nameDisplay = s.memberName;
    }

    rows.push([
      slDisplay,
      nameDisplay,
      s.id,
      s.admissionFee,
      aug?.status === 'paid' ? aug.date || '' : aug?.status === 'due' ? 'Due' : '-',
      aug?.status === 'paid' ? aug.amount : aug?.status === 'due' ? '' : '',
      sep?.status === 'paid' ? sep.date || '' : sep?.status === 'due' ? 'Due' : '-',
      sep?.status === 'paid' ? sep.amount : sep?.status === 'due' ? '' : '',
      oct?.status === 'paid' ? oct.date || '' : oct?.status === 'due' ? 'Due' : '-',
      oct?.status === 'paid' ? oct.amount : oct?.status === 'due' ? '' : '',
      nov?.status === 'paid' ? nov.date || '' : nov?.status === 'due' ? 'Due' : '-',
      nov?.status === 'paid' ? nov.amount : '',
      dec?.status === 'paid' ? dec.date || '' : dec?.status === 'due' ? 'Due' : '-',
      dec?.status === 'paid' ? dec.amount : '',
      s.totalDeposit,
      s.dueMonths > 0 ? s.dueMonths : '-',
      s.dueAmount > 0 ? s.dueAmount : '-',
      s.lateFee > 0 ? s.lateFee : '-',
      s.totalDue > 0 ? s.totalDue : '-',
      s.lateFeePaid > 0 ? s.lateFeePaid : '-',
    ]);
  }

  // Grand Total Row (Row 38)
  const augStat = summary.monthStats?.['Aug-26'];
  const sepStat = summary.monthStats?.['Sep-26'];
  const octStat = summary.monthStats?.['Oct-26'];
  const novStat = summary.monthStats?.['Nov-26'];
  const decStat = summary.monthStats?.['Dec-26'];

  rows.push([
    '',
    'GRAND TOTAL',
    `${summary.totalShareIds} IDs`,
    summary.totalAdmissionCollected,
    augStat ? `${augStat.paidShares} Paid` : '30 Paid',
    augStat?.paidAmount ?? 0,
    sepStat ? `${sepStat.paidShares} Paid` : '27 Paid',
    sepStat?.paidAmount ?? 0,
    octStat ? `${octStat.paidShares} Paid` : '27 Paid',
    octStat?.paidAmount ?? 0,
    novStat && novStat.paidShares > 0 ? `${novStat.paidShares} Paid` : '-',
    novStat && novStat.paidAmount > 0 ? novStat.paidAmount : '-',
    decStat && decStat.paidShares > 0 ? `${decStat.paidShares} Paid` : '-',
    decStat && decStat.paidAmount > 0 ? decStat.paidAmount : '-',
    summary.totalBankDeposit,
    summary.totalDueMonths,
    summary.totalDuePrincipal,
    summary.totalLateFeeDue,
    summary.totalOutstandingDue,
    summary.totalLateFeeCollected > 0 ? summary.totalLateFeeCollected : '-',
  ]);

  return rows;
}

/**
 * Applies Google Sheets styling, cell merges, fonts, and colors matching Image 2.
 */
export async function applySheetStyling(
  spreadsheetId: string,
  sheetId: number,
  shares: ShareRecord[],
  token: string
): Promise<void> {
  const requests: any[] = [];

  // 1. Set column widths for comfortable reading
  const columnWidths = [
    { start: 0, end: 1, width: 45 },   // SL
    { start: 1, end: 2, width: 220 },  // Member Name
    { start: 2, end: 3, width: 85 },   // Share ID
    { start: 3, end: 4, width: 95 },   // Admission Fee
    { start: 4, end: 5, width: 85 },   // Aug-26 Date
    { start: 5, end: 6, width: 75 },   // Aug-26 Amount
    { start: 6, end: 7, width: 85 },   // Sep-26 Date
    { start: 7, end: 8, width: 75 },   // Sep-26 Amount
    { start: 8, end: 9, width: 85 },   // Oct-26 Date
    { start: 9, end: 10, width: 75 },  // Oct-26 Amount
    { start: 10, end: 11, width: 85 }, // Nov-26 Date
    { start: 11, end: 12, width: 75 }, // Nov-26 Amount
    { start: 12, end: 13, width: 85 }, // Dec-26 Date
    { start: 13, end: 14, width: 75 }, // Dec-26 Amount
    { start: 14, end: 15, width: 95 }, // Total Deposit
    { start: 15, end: 16, width: 75 }, // Due Months
    { start: 16, end: 17, width: 85 }, // Due Amount
    { start: 17, end: 18, width: 85 }, // Late Fee (10%)
    { start: 18, end: 19, width: 85 }, // Total Due
    { start: 19, end: 20, width: 85 }, // Late Fee Paid
  ];

  for (const cw of columnWidths) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: cw.start,
          endIndex: cw.end,
        },
        properties: { pixelSize: cw.width },
        fields: 'pixelSize',
      },
    });
  }

  // 2. Clear existing merges so we can apply fresh clean structure
  requests.push({
    unmergeCells: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 60,
        startColumnIndex: 0,
        endColumnIndex: 20,
      },
    },
  });

  // 3. Merges for Title Banners & KPI Cards
  const headerMerges = [
    // Row 1: Title
    { startRow: 0, endRow: 1, startCol: 0, endCol: 20 },
    // Row 2: Subtitle
    { startRow: 1, endRow: 2, startCol: 0, endCol: 20 },
    // Row 3: KPI Card Headers
    { startRow: 2, endRow: 3, startCol: 0, endCol: 2 },   // Total Active Shares
    { startRow: 2, endRow: 3, startCol: 2, endCol: 7 },   // Total Bank Deposit
    { startRow: 2, endRow: 3, startCol: 7, endCol: 13 },  // Total Outstanding Due
    { startRow: 2, endRow: 3, startCol: 13, endCol: 20 }, // Collection Efficiency
    // Row 4: KPI Card Values
    { startRow: 3, endRow: 4, startCol: 3, endCol: 7 },   // Bank breakdown
    { startRow: 3, endRow: 4, startCol: 8, endCol: 13 },  // Due breakdown
    { startRow: 3, endRow: 4, startCol: 13, endCol: 20 }, // Efficiency
    // Rows 5-6: Table Headers
    { startRow: 4, endRow: 6, startCol: 0, endCol: 1 },   // SL
    { startRow: 4, endRow: 6, startCol: 1, endCol: 2 },   // Member Name
    { startRow: 4, endRow: 6, startCol: 2, endCol: 3 },   // Share ID
    { startRow: 4, endRow: 6, startCol: 3, endCol: 4 },   // Admission Fee
    { startRow: 4, endRow: 5, startCol: 4, endCol: 6 },   // Month of Aug-26
    { startRow: 4, endRow: 5, startCol: 6, endCol: 8 },   // Month of Sep-26
    { startRow: 4, endRow: 5, startCol: 8, endCol: 10 },  // Month of Oct-26
    { startRow: 4, endRow: 5, startCol: 10, endCol: 12 }, // Month of Nov-26
    { startRow: 4, endRow: 5, startCol: 12, endCol: 14 }, // Month of Dec-26
    { startRow: 4, endRow: 6, startCol: 14, endCol: 15 }, // Total Deposit
    { startRow: 4, endRow: 6, startCol: 15, endCol: 16 }, // Due Months
    { startRow: 4, endRow: 6, startCol: 16, endCol: 17 }, // Due Amount
    { startRow: 4, endRow: 6, startCol: 17, endCol: 18 }, // Late Fee (10%)
    { startRow: 4, endRow: 6, startCol: 18, endCol: 19 }, // Total Due
    { startRow: 4, endRow: 6, startCol: 19, endCol: 20 }, // Late Fee Paid
  ];

  for (const m of headerMerges) {
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: m.startRow,
          endRowIndex: m.endRow,
          startColumnIndex: m.startCol,
          endColumnIndex: m.endCol,
        },
        mergeType: 'MERGE_ALL',
      },
    });
  }

  // 4. Multi-share holder merges for SL and Member Name (Data rows start at Row index 6)
  // Let's identify contiguous runs of shares belonging to the same member
  let runStartRow = 6;
  let currentMember = shares[0]?.memberName || '';

  for (let i = 1; i < shares.length; i++) {
    const s = shares[i];
    const currentRow = 6 + i;

    if (s.memberName === currentMember && !s.isClosed) {
      // Continuation of member run
    } else {
      // Previous run ended
      const runEndRow = 6 + i;
      if (runEndRow - runStartRow > 1) {
        // Merge Col A (SL) and Col B (Member Name)
        requests.push({
          mergeCells: {
            range: {
              sheetId,
              startRowIndex: runStartRow,
              endRowIndex: runEndRow,
              startColumnIndex: 0,
              endColumnIndex: 1,
            },
            mergeType: 'MERGE_ALL',
          },
        });
        requests.push({
          mergeCells: {
            range: {
              sheetId,
              startRowIndex: runStartRow,
              endRowIndex: runEndRow,
              startColumnIndex: 1,
              endColumnIndex: 2,
            },
            mergeType: 'MERGE_ALL',
          },
        });
      }
      runStartRow = currentRow;
      currentMember = s.memberName;
    }
  }

  // Check last member run
  const lastEndRow = 6 + shares.length;
  if (lastEndRow - runStartRow > 1 && !shares[runStartRow - 6]?.isClosed) {
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: runStartRow,
          endRowIndex: lastEndRow,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        mergeType: 'MERGE_ALL',
      },
    });
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: runStartRow,
          endRowIndex: lastEndRow,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        mergeType: 'MERGE_ALL',
      },
    });
  }

  // 5. Colors and Formats
  // Row 1 (Title): Forest Green background #235436, White Bold 14pt
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 20,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.14, green: 0.35, blue: 0.22 },
          textFormat: {
            foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            bold: true,
            fontSize: 14,
          },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
    },
  });

  // Row 2 (Subtitle): Forest Green #235436, White Bold 11pt
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 1,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: 20,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.14, green: 0.35, blue: 0.22 },
          textFormat: {
            foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            bold: true,
            fontSize: 10,
          },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
    },
  });

  // Rows 3-4 KPI Summary Cards Backgrounds
  // Card 1 (Active Shares): Soft Mint #e8f5e9
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 2,
        endRowIndex: 4,
        startColumnIndex: 0,
        endColumnIndex: 2,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.91, green: 0.96, blue: 0.91 },
          textFormat: {
            foregroundColor: { red: 0.1, green: 0.3, blue: 0.15 },
            bold: true,
          },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
    },
  });

  // Card 2 (Total Deposit): Soft Mint #e8f5e9
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 2,
        endRowIndex: 4,
        startColumnIndex: 2,
        endColumnIndex: 7,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.91, green: 0.96, blue: 0.91 },
          textFormat: {
            foregroundColor: { red: 0.1, green: 0.3, blue: 0.15 },
            bold: true,
          },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
    },
  });

  // Card 3 (Total Due): Soft Pink/Red #ffebee
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 2,
        endRowIndex: 4,
        startColumnIndex: 7,
        endColumnIndex: 13,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 1.0, green: 0.92, blue: 0.92 },
          textFormat: {
            foregroundColor: { red: 0.75, green: 0.1, blue: 0.1 },
            bold: true,
          },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
    },
  });

  // Card 4 (Efficiency): Soft Teal #e0f2f1
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 2,
        endRowIndex: 4,
        startColumnIndex: 13,
        endColumnIndex: 20,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.88, green: 0.95, blue: 0.95 },
          textFormat: {
            foregroundColor: { red: 0.05, green: 0.35, blue: 0.35 },
            bold: true,
          },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
    },
  });

  // Rows 5-6 (Table Headers): Dark Table Forest Green #164627, White Bold
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 4,
        endRowIndex: 6,
        startColumnIndex: 0,
        endColumnIndex: 20,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.1, green: 0.28, blue: 0.16 },
          textFormat: {
            foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            bold: true,
            fontSize: 9,
          },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
    },
  });

  // Data rows general format (Row 7 to 37): borders & vertical middle
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 6,
        endRowIndex: 6 + shares.length,
        startColumnIndex: 0,
        endColumnIndex: 20,
      },
      cell: {
        userEnteredFormat: {
          verticalAlignment: 'MIDDLE',
          textFormat: { fontSize: 9 },
        },
      },
      fields: 'userEnteredFormat(verticalAlignment,textFormat.fontSize)',
    },
  });

  // Grand Total row: Bold with light gray background #f8fafc
  const grandTotalRow = 6 + shares.length;
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: grandTotalRow,
        endRowIndex: grandTotalRow + 1,
        startColumnIndex: 0,
        endColumnIndex: 20,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.95, green: 0.96, blue: 0.98 },
          textFormat: { bold: true, fontSize: 9 },
          verticalAlignment: 'MIDDLE',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
    },
  });

  // 6. Freeze Top 6 Rows (Title, KPI, Headers) and First 3 Columns (SL, Member Name, Share ID)
  requests.push({
    updateSheetProperties: {
      properties: {
        sheetId,
        gridProperties: {
          frozenRowCount: 6,
          frozenColumnCount: 3,
        },
      },
      fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
    },
  });

  // 7. Clean Table Grid Borders (from header row 4 to grand total row)
  requests.push({
    updateBorders: {
      range: {
        sheetId,
        startRowIndex: 4,
        endRowIndex: grandTotalRow + 1,
        startColumnIndex: 0,
        endColumnIndex: 20,
      },
      top: { style: 'SOLID_MEDIUM', color: { red: 0.1, green: 0.28, blue: 0.16 } },
      bottom: { style: 'SOLID_MEDIUM', color: { red: 0.1, green: 0.28, blue: 0.16 } },
      left: { style: 'SOLID', color: { red: 0.75, green: 0.8, blue: 0.85 } },
      right: { style: 'SOLID', color: { red: 0.75, green: 0.8, blue: 0.85 } },
      innerHorizontal: { style: 'SOLID', color: { red: 0.88, green: 0.9, blue: 0.92 } },
      innerVertical: { style: 'SOLID', color: { red: 0.88, green: 0.9, blue: 0.92 } },
    },
  });

  // 8. Conditional Formatting: Red highlight on 'Due' status cells
  requests.push({
    addConditionalFormatRule: {
      rule: {
        ranges: [
          {
            sheetId,
            startRowIndex: 6,
            endRowIndex: 6 + shares.length,
            startColumnIndex: 4,
            endColumnIndex: 14,
          },
        ],
        booleanRule: {
          condition: {
            type: 'TEXT_EQ',
            values: [{ userEnteredValue: 'Due' }],
          },
          format: {
            backgroundColor: { red: 1.0, green: 0.9, blue: 0.9 },
            textFormat: {
              foregroundColor: { red: 0.8, green: 0.1, blue: 0.1 },
              bold: true,
            },
          },
        },
      },
      index: 0,
    },
  });

  // Send batchUpdate
  if (requests.length > 0) {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('Batch update styling warning:', err);
    }
  }
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  token: string
): Promise<SheetMetadata> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to access Google Sheet (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const firstSheet = data.sheets?.[0];
  const sheetName = firstSheet?.properties?.title || 'Sheet1';
  const sheetId = firstSheet?.properties?.sheetId || 0;

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Progressive Association Society Ledger',
    sheetName,
    sheetId,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

export async function createGoogleSpreadsheet(
  title: string,
  shares: ShareRecord[],
  summary: SocietySummary,
  token: string
): Promise<SheetMetadata> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Progressive Association Society - Member Ledger (2026-27)',
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${err}`);
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;
  const firstSheet = created.sheets?.[0];
  const sheetName = firstSheet?.properties?.title || 'Sheet1';
  const sheetId = firstSheet?.properties?.sheetId || 0;

  // 1. Populate full grid matching Image 2
  await pushToGoogleSheet(spreadsheetId, sheetName, shares, summary, token);

  // 2. Apply cell merges, colors, and layout matching Image 2
  try {
    await applySheetStyling(spreadsheetId, sheetId, shares, token);
  } catch (styleErr) {
    console.warn('Failed to apply optional sheet styling:', styleErr);
  }

  return {
    id: spreadsheetId,
    title: created.properties?.title || title,
    sheetName,
    sheetId,
    url: created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

export async function pushToGoogleSheet(
  spreadsheetId: string,
  sheetName: string,
  shares: ShareRecord[],
  summary: SocietySummary,
  token: string
): Promise<void> {
  const values = formatSharesForSheet(shares, summary);
  const range = `${sheetName}!A1:T${values.length}`;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to update Google Sheet: ${errorBody}`);
  }
}

/**
 * Reads and parses rows from the connected Google Sheet into ShareRecord[].
 * Correctly handles merged cells by propagating the member name across multi-share rows.
 */
export async function pullFromGoogleSheet(
  spreadsheetId: string,
  sheetName: string,
  token: string
): Promise<ShareRecord[]> {
  const range = `${sheetName}!A1:T150`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch Google Sheet data: ${err}`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length === 0) {
    throw new Error('Spreadsheet contains no data rows.');
  }

  // Find the header row (identifying columns)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const r = rows[i].map((c) => String(c || '').toLowerCase().trim());
    if (r.some((c) => c.includes('share id') || (c.includes('member name') && !c.includes('dashboard')))) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      'Could not detect standard header row (expected "Share ID", "Member Name" etc.).'
    );
  }

  // If next row is the sub-header row ('Date', 'Amount'), skip it too
  let dataStartIndex = headerRowIndex + 1;
  if (
    dataStartIndex < rows.length &&
    rows[dataStartIndex]?.some((c: any) => String(c || '').toLowerCase().includes('date') || String(c || '').toLowerCase().includes('amount'))
  ) {
    dataStartIndex += 1;
  }

  const parsedShares: ShareRecord[] = [];
  let currentMemberName = '';
  let currentSl: number | undefined = undefined;

  for (let rIdx = dataStartIndex; rIdx < rows.length; rIdx++) {
    const row = rows[rIdx];
    if (!row || row.length < 3) continue;

    const slRaw = row[0] !== undefined ? String(row[0]).trim() : '';
    const nameRaw = row[1] !== undefined ? String(row[1]).trim() : '';
    const shareId = row[2] !== undefined ? String(row[2]).trim().toUpperCase() : '';

    // Stop or skip if it's the grand total row
    if (
      nameRaw.toUpperCase() === 'GRAND TOTAL' ||
      String(row[0]).toUpperCase() === 'GRAND TOTAL' ||
      shareId.includes('IDS')
    ) {
      continue;
    }

    if (!shareId) continue;

    // Check if this is the closed slot
    const isClosed =
      nameRaw.toLowerCase().includes('closed') ||
      shareId.includes('12,13') ||
      shareId.includes(',');

    // Handle merged cells: propagate member name & SL if this row has an empty name
    if (nameRaw) {
      currentMemberName = nameRaw;
    }

    if (slRaw && !isNaN(Number(slRaw))) {
      currentSl = Number(slRaw);
    }

    const memberName = isClosed ? 'Closed Id' : currentMemberName || `Member ${shareId}`;
    const sl = isClosed ? undefined : slRaw && !isNaN(Number(slRaw)) ? Number(slRaw) : currentSl;

    const admissionFee = Number(String(row[3] || '5000').replace(/[^0-9.-]+/g, '')) || 5000;

    // Month parsing helper:
    // Aug: row[4]=date, row[5]=amount
    // Sep: row[6]=date, row[7]=amount
    // Oct: row[8]=date, row[9]=amount
    // Nov: row[10]=date, row[11]=amount
    // Dec: row[12]=date, row[13]=amount
    const parseMonth = (dateCell: any, amountCell: any) => {
      const d = String(dateCell || '').trim();
      const a = Number(String(amountCell || '0').replace(/[^0-9.-]+/g, '')) || 0;

      if (d.toLowerCase() === 'due' || String(amountCell).toLowerCase() === 'due') {
        return { status: 'due' as const, amount: 2800 };
      }
      if (a > 0 || (d && d !== '-' && d !== '')) {
        return {
          status: 'paid' as const,
          date: d && d !== '-' ? d : '15.09.26',
          amount: a || 2800,
          paymentMethod: 'Bank Deposit',
        };
      }
      return { status: 'upcoming' as const, amount: 2800 };
    };

    const months = {
      'Aug-26': parseMonth(row[4], row[5]),
      'Sep-26': parseMonth(row[6], row[7]),
      'Oct-26': parseMonth(row[8], row[9]),
      'Nov-26': parseMonth(row[10], row[11]),
      'Dec-26': parseMonth(row[12], row[13]),
    };

    const lateFeePaid = Number(String(row[19] || '0').replace(/[^0-9.-]+/g, '')) || 0;

    const shareRecord: ShareRecord = calculateShareRecord({
      id: shareId,
      sl: typeof sl === 'number' ? sl : undefined,
      memberName,
      isClosed,
      admissionFee,
      months,
      totalDeposit: 0,
      dueMonths: 0,
      dueAmount: 0,
      lateFee: 0,
      totalDue: 0,
      lateFeePaid,
    });

    parsedShares.push(shareRecord);
  }

  if (parsedShares.length === 0) {
    throw new Error('No valid member shares found in the connected Google Sheet.');
  }

  return parsedShares;
}
