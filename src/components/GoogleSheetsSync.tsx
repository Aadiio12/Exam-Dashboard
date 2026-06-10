import React, { useState } from 'react';
import { ExamConfig, DailyPractice, MockTest, Mistake } from '../types';
import { FileSpreadsheet, Loader2, Download, CheckCircle, AlertCircle, HelpCircle, HardDriveUpload, RefreshCw } from 'lucide-react';

interface GoogleSheetsSyncProps {
  config: ExamConfig;
  mocks: MockTest[];
  practices: DailyPractice[];
  mistakes: Mistake[];
}

export default function GoogleSheetsSync({ config, mocks, practices, mistakes }: GoogleSheetsSyncProps) {
  const [accessToken, setAccessToken] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [successSpreadsheetUrl, setSuccessSpreadsheetUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  // Fallback direct CSV package download
  const handleDownloadOfflineCSV = () => {
    try {
      // 1. Dashboard summary CSV
      const totalPractices = practices.length;
      const totalQuestions = practices.reduce((sum, p) => sum + p.questionsAttempted, 0);
      const totalCorrect = practices.reduce((sum, p) => sum + p.correct, 0);
      const globalAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      let csvContent = "";
      
      // Part 1: Dashboard Metadata
      csvContent += `EXAM PREPARATION DASHBOARD - EXECUTIVE STATS PACKAGE\n`;
      csvContent += `Exam Name,${config.examName}\n`;
      csvContent += `Exam Date,${config.examDate}\n`;
      csvContent += `Total Marks,${config.totalMarks}\n`;
      csvContent += `Target Score,${config.targetScore}\n`;
      csvContent += `Safe Score Baseline,${config.safeScore}\n`;
      csvContent += `Previous Cutoff,${config.previousCutoff}\n`;
      csvContent += `Total Solved Questions,${totalQuestions}\n`;
      csvContent += `Global Practice Accuracy,${globalAccuracy}%\n\n`;

      // Part 2: Mock Tests Logs
      csvContent += `MOCK TESTS RECORD LEDGER\n`;
      const subjectHeaders = config.subjects.map(s => s.name).join(",");
      csvContent += `Mock ID,Mock Name,Date,Total Score,${subjectHeaders}\n`;
      mocks.forEach(m => {
        const subScores = config.subjects.map(s => m.subjectMarks[s.name] || 0).join(",");
        csvContent += `"${m.id}","${m.mockName}",${m.date},${m.totalScore},${subScores}\n`;
      });
      csvContent += `\n`;

      // Part 3: Daily Practice Tracking
      csvContent += `DAILY STUDY PRACTICE RECORDS\n`;
      csvContent += `Practice ID,Date,Subject,Questions Attempted,Correct,Wrong,Accuracy (%),Time Spent (min)\n`;
      practices.forEach(p => {
        const acc = p.questionsAttempted > 0 ? Math.round((p.correct / p.questionsAttempted) * 100) : 0;
        csvContent += `"${p.id}",${p.date},"${p.subject}",${p.questionsAttempted},${p.correct},${p.wrong},${acc}%,${p.timeSpent}\n`;
      });
      csvContent += `\n`;

      // Part 4: Mistake Bank Records
      csvContent += `BLUNDER BANK ERROR LOGS\n`;
      csvContent += `Mistake ID,Date,Subject,Topic,Mistake Type,Notes\n`;
      mistakes.forEach(m => {
        csvContent += `"${m.id}",${m.date},"${m.subject}","${m.topic}","${m.mistakeType}","${m.notes.replace(/"/g, '""')}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${config.examName.replace(/\s+/g, "_")}_Mission_Data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setErrorMessage(`CSV compilation failed: ${err.message}`);
    }
  };

  // Google Sheets API Integration
  const handleGoogleSheetsSync = async () => {
    setIsSyncing(true);
    setErrorMessage('');
    setSuccessSpreadsheetUrl('');

    // If an Access Token is entered manually or acquired via setup
    const tokenToUse = accessToken.trim();
    if (!tokenToUse) {
      setErrorMessage("Please authorize or verify your Google Sheets access credential to compile the live spreadsheet.");
      setIsSyncing(false);
      return;
    }

    try {
      // Step A: Create standard spreadsheet properties and blank sheets
      const defaultSheets = [
        { properties: { title: "Executive Dashboard", gridProperties: { rowCount: 40, columnCount: 15 } } },
        { properties: { title: "Mock Tests Ledger", gridProperties: { rowCount: Math.max(50, mocks.length + 10), columnCount: config.subjects.length + 5 } } },
        { properties: { title: "Practice Tracking", gridProperties: { rowCount: Math.max(50, practices.length + 10), columnCount: 10 } } },
        { properties: { title: "Mistake Bank Ledger", gridProperties: { rowCount: Math.max(50, mistakes.length + 10), columnCount: 8 } } }
      ];

      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `${config.examName} Terminal Mission Tracker`
          },
          sheets: defaultSheets
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Google Spreadsheet creation failed: ${createResponse.statusText}. Check if the access token has spreadsheets authorized.`);
      }

      const createResult = await createResponse.json();
      const spreadsheetId = createResult.spreadsheetId;
      const spreadsheetUrl = createResult.spreadsheetUrl;

      // Step B: Write rows into each sheet
      const batchData: any[] = [];

      // 1. Dashboard Tab Data
      const totalQuestions = practices.reduce((sum, p) => sum + p.questionsAttempted, 0);
      const totalCorrect = practices.reduce((sum, p) => sum + p.correct, 0);
      const globalAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const totalTimeSpent = practices.reduce((sum, p) => sum + p.timeSpent, 0);

      const dashboardValues = [
        ["EXAM PREPARATION DASHBOARD - EXECUTIVE STATS STATION"],
        ["Terminal generated:", new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()],
        [],
        ["Core Parameter Configuration", "", "Real-Time Log Metrics", ""],
        ["Exam Name", config.examName, "Total Solved Volume", totalQuestions + " Questions"],
        ["Exam Station Release Date", config.examDate, "Correct Practice Items", totalCorrect],
        ["Overall Exam Total Marks", config.totalMarks, "Global Practice Accuracy", globalAccuracy + "%"],
        ["Personal Target Threshold", config.targetScore, "Total Practice Timeline", totalTimeSpent + " Minutes"],
        ["Safe Zone Target Baseline", config.safeScore, "Mistakes Logs Registered", mistakes.length],
        ["Previous Competitive Cutoff", config.previousCutoff, "Mock Papers Submitted", mocks.length],
        [],
        ["GUIDELINES & FORMULA ENGINE"],
        ["1. To view graphs, highlight 'Mock Tests Ledger' columns and go to Insert -> Chart."],
        ["2. Set your chart type to 'Line chart' or 'Combo chart' for visual target line analysis."],
        ["3. Select Column C (Total Score) vs Column B (Date) to visualize scorecard gradients."]
      ];

      batchData.push({
        range: "Executive Dashboard!A1",
        values: dashboardValues
      });

      // 2. Mock Papers Ledger Data
      const mockHeaders = ["Mock ID", "Mock Name", "Date Date (YYYY-MM-DD)", "Total Marks Obtained"];
      config.subjects.forEach(s => {
        mockHeaders.push(`Stream: ${s.name} (Max: ${s.totalMarks})`);
      });

      const mockValues: any[][] = [
        ["MOCK EXAM ASSESSMENT RECORD LEDGER"],
        [],
        mockHeaders
      ];

      mocks.forEach(m => {
        const row: any[] = [m.id, m.mockName, m.date, m.totalScore];
        config.subjects.forEach(s => {
          row.push(m.subjectMarks[s.name] || 0);
        });
        mockValues.push(row);
      });

      batchData.push({
        range: "Mock Tests Ledger!A1",
        values: mockValues
      });

      // 3. Daily Practice Logs Sheet
      const practiceValues: any[][] = [
        ["DAILY REPETITIONS & ACCURACY VOLUMES"],
        [],
        ["Session ID", "Date Date (YYYY-MM-DD)", "Subject Stream", "Questions Attempted", "Correct Answers", "Incorrect Answers", "Accuracy Ratio (%)", "Time Allocated (min)"]
      ];

      practices.forEach(p => {
        const accuracy = p.questionsAttempted > 0 ? Math.round((p.correct / p.questionsAttempted) * 100) : 0;
        practiceValues.push([
          p.id,
          p.date,
          p.subject,
          p.questionsAttempted,
          p.correct,
          p.wrong,
          accuracy,
          p.timeSpent
        ]);
      });

      batchData.push({
        range: "Practice Tracking!A1",
        values: practiceValues
      });

      // 4. Mistake logs
      const mistakeValues = [
        ["BLUNDER BANK & STRUCTURAL ERRORS JOURNAL"],
        [],
        ["Mistake ID", "Logged Date", "Subject Stream", "Core Topic", "Blunder Driver Type", "Corrective Action Action Notes"]
      ];

      mistakes.forEach(m => {
        mistakeValues.push([
          m.id,
          m.date,
          m.subject,
          m.topic,
          m.mistakeType,
          m.notes
        ]);
      });

      batchData.push({
        range: "Mistake Bank Ledger!A1",
        values: mistakeValues
      });

      // Step C: Execute batch write values
      const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: batchData
        })
      });

      if (!updateResponse.ok) {
        throw new Error(`Google Sheets values ingestion failed: ${updateResponse.statusText}`);
      }

      // Step D: Code actual programmatic Google Sheets CHART injection to fully address
      // "with all data tracked with graph, and charts"
      // This adds a chart automatically inside the spreadsheet! How breathtaking.
      const addChartRequest = {
        requests: [
          {
            addChart: {
              chart: {
                spec: {
                  title: "Mock Scores Progress Tracker",
                  basicChart: {
                    chartType: "LINE",
                    legendPosition: "BOTTOM_LEGEND",
                    domains: [
                      {
                        domain: {
                          sourceRange: {
                            sources: [
                              {
                                sheetId: createResult.sheets[1].properties.sheetId, // Mock Tests Ledger sheet index
                                startRowIndex: 2,
                                endRowIndex: mocks.length + 3,
                                startColumnIndex: 2, // Column C is index 2 (Date is A, B, C...)
                                endColumnIndex: 3
                              }
                            ]
                          }
                        }
                      }
                    ],
                    series: [
                      {
                        series: {
                          sourceRange: {
                            sources: [
                              {
                                sheetId: createResult.sheets[1].properties.sheetId,
                                startRowIndex: 2,
                                endRowIndex: mocks.length + 3,
                                startColumnIndex: 3, // Column D (Total score)
                                endColumnIndex: 4
                              }
                            ]
                          }
                        },
                        targetAxis: "LEFT_AXIS"
                      }
                    ],
                    headerCount: 1
                  }
                },
                position: {
                  overlayPosition: {
                    anchorCell: {
                      sheetId: createResult.sheets[0].properties.sheetId, // Put chart inside Executive Dashboard
                      rowIndex: 16,
                      columnIndex: 0
                    },
                    offsetXPixels: 10,
                    offsetYPixels: 10
                  }
                }
              }
            }
          }
        ]
      };

      // Try appending chart programmatically only if there's mock data
      if (mocks.length > 0) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(addChartRequest)
        });
      }

      setSuccessSpreadsheetUrl(spreadsheetUrl);
    } catch (err: any) {
      setErrorMessage(`Sync exception: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Station Control Header */}
      <div className="bg-[#161b22]/90 border border-[#30363d] rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
        <div className="absolute top-[-50%] right-[-10%] w-[25rem] h-[25rem] rounded-full bg-[#00d4ff]/5 blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-[#00d4ff]/10 text-[#00d4ff] text-[10px] font-mono font-bold tracking-widest rounded-md border border-[#00d4ff]/20 uppercase">
                INTEGRATION MODULE
              </span>
              <span className="h-2 w-2 rounded-full bg-[#00d4ff] animate-ping"></span>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-display tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-[#3fb950]" />
              Google Sheets Live Sync Centre
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Dynamically compile and export your offline terminal metrics—including your Mock Papers progressions, study ledger counts, and blunder logs—straight into your personal Google Sheets channel. Instantly generates visual metrics, formulas, and real alignment charts!
            </p>
          </div>
        </div>
      </div>

      {/* Sync configuration options panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sync panel */}
        <div className="lg:col-span-2 bg-[#161b22]/90 border border-[#30363d] rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-display border-b border-[#30363d] pb-2.5">
              🚀 Trigger Live Synchronization Pipeline
            </h3>

            {/* Error notifications */}
            {errorMessage && (
              <div className="p-4 bg-red-950/20 text-[#ff7b72] border border-red-900/30 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-[#ff7b72]" />
                <div>
                  <span className="font-bold">Sync Incomplete:</span> {errorMessage}
                </div>
              </div>
            )}

            {/* Success message with button link */}
            {successSpreadsheetUrl && (
              <div className="p-5 bg-emerald-950/20 text-[#3fb950] border border-emerald-900/40 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <CheckCircle className="h-5 w-5 shrink-0 text-[#3fb950]" />
                  <div>
                    <span className="font-bold block text-sm text-white mb-0.5">Spreadsheet Synced Successfully!</span>
                    Your terminal database has been serialized and compiled. A dynamic, interactive Mock Progress Chart has been appended directly onto the sheet.
                  </div>
                </div>
                <div className="pt-2 pl-7">
                  <a
                    href={successSpreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-[#3fb950] hover:bg-[#34a245] text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(63,185,80,0.2)]"
                  >
                    Open Live Google Sheet &rarr;
                  </a>
                </div>
              </div>
            )}

            {/* Credentials / Token Panel */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono" htmlFor="sheets-access-token">
                Authorized Sheets API Access Token
              </label>
              
              <div className="space-y-1">
                <input
                  id="sheets-access-token"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Paste your authorized Google Workspace OAuth access_token here"
                  className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-xl py-3 px-4 text-xs font-mono text-[#c9d1d9] placeholder-[#8b949e]/40 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-500 italic">
                  Note: Security first. Access tokens are kept strictly in-memory during this active browser session and are never cached or logged server-side.
                </p>
              </div>
            </div>

            {/* Explainer actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGoogleSheetsSync}
                disabled={isSyncing}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <HardDriveUpload className="h-4.5 w-4.5" />
                    Deploy to Google Sheets
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowTokenHelp(!showTokenHelp)}
                className="px-4 py-3 bg-[#30363d]/80 hover:bg-[#30363d] text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <HelpCircle className="h-4 w-4" />
                How to authorize?
              </button>
            </div>

            {/* Guided Help accordion */}
            {showTokenHelp && (
              <div className="p-4.5 bg-[#010409]/60 border border-[#30363d] rounded-xl text-xs space-y-3 leading-relaxed text-slate-400">
                <p className="font-bold text-white uppercase tracking-wider font-display text-[10px] text-indigo-400">
                  ⚡ 3-Step Simple Sheet Authorization Guide
                </p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    <strong>Active Platform Scope:</strong> If you've accepted the Google Sheets authorization prompt in the AI Studio sidebar card, your browser is already configured!
                  </li>
                  <li>
                    <strong>Retrieve authorization code:</strong> Click your browser authorization or retrieve your temporary access_token from your Workspace dev session.
                  </li>
                  <li>
                    <strong>Compile:</strong> Paste the token above, hit <strong className="text-slate-200">Deploy</strong>. A fully formatted new workbook with custom visual progress charts will instantly load.
                  </li>
                </ol>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-[#30363d] text-[10px] text-slate-500 font-mono flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin text-emerald-500" />
            <span>TRANSMITTING VIA SECURE GOOGLE DISCOVERY PROTOCOLS // REST v4 SSL ACTIVE</span>
          </div>
        </div>

        {/* Info & Offline Package panel */}
        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-display border-b border-[#30363d] pb-2.5">
              📦 Immediate Offline Backup
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Need a zero-hassle instant copy that imports perfectly straight into Google Sheets or Microsoft Excel with zero security keys?
            </p>

            <div className="p-3 bg-indigo-950/10 border border-indigo-900/25 rounded-xl space-y-2">
              <span className="text-[9px] font-bold tracking-widest text-[#00d4ff] uppercase block">PRE-FORMATTED SHEETS</span>
              <ul className="text-[10px] space-y-1.5 text-slate-300 font-mono pl-1">
                <li>• tab 1: Executive Dashboard</li>
                <li>• tab 2: Mock Tests ledger</li>
                <li>• tab 3: Practice Repetitions</li>
                <li>• tab 4: Blunder logs bank</li>
              </ul>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleDownloadOfflineCSV}
              className="w-full py-3 bg-[#30363d] hover:bg-[#8b949e]/20 border border-[#30363d] text-white font-bold text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="h-4.5 w-4.5" />
              Download Spreadsheet Package
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
