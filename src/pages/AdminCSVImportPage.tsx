import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { validateCSVRows, importCSVRows, clearAllQuestions } from '../services/db';
import { CSVImportQuestion, CSVValidationResult } from '../types';
import { 
  FileUp, Download, CheckCircle2, AlertTriangle, ArrowLeft, 
  Copy, FileText, Check, Trash2, Image as ImageIcon 
} from 'lucide-react';
import { LoadingState } from '../components/LoadingState';
import { ConfirmDialog } from '../components/ConfirmDialog';

const SAMPLE_CSV = `class,subject,chapter,topic,difficulty,source_type,exam_name,exam_year,question,image_url,option_a,option_b,option_c,option_d,correct_answer,marks,negative_marks,solution
Class 9,Science,Cell : building block of life,Cell Structure,easy,practice,School Exam,2024,"Which organelle is known as the powerhouse of the cell?",https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80,Ribosome,Mitochondria,Nucleus,Golgi Apparatus,B,1,0.25,"Mitochondria produce ATP energy for cellular processes."
JEE Mains,Physics,Kinematics & Laws of Motion,Projectile Motion,medium,pyq,JEE Main,2024,"In a projectile motion, if the angle of projection is 45°, the ratio of maximum height to horizontal range is:",,1:4,1:2,1:1,2:1,A,4,1,"H = u^2 sin^2(45)/(2g) and R = u^2 sin(90)/g. H/R = 1/4."
NEET,Biology,Genetics and Evolution,Mendelian Genetics,easy,pyq,NEET,2024,"The process of copying genetic information from DNA to RNA is catalyzed by RNA polymerase and is called:",,Transcription,Translation,Replication,Transduction,A,4,1,"Transcription is the synthesis of RNA from a DNA template."
CUET,Mathematics,Relations, Functions & Calculus,Critical Points,easy,pyq,CUET UG,2024,"If f(x) = x^3 - 3x + 5, then the critical points of f(x) are:",,x = -1 and x = 1,x = 0,x = 2 and x = -2,No critical points,A,5,1,"f'(x) = 3x^2 - 3 = 0 implies x = 1 or x = -1."`;

export const AdminCSVImportPage: React.FC = () => {
  const navigate = useNavigate();

  const [rawText, setRawText] = useState<string>('');
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccessMsg, setClearSuccessMsg] = useState('');

  const handleClearAll = async () => {
    await clearAllQuestions();
    setShowClearConfirm(false);
    setClearSuccessMsg('Question Bank cleared successfully! All previous questions removed.');
    setTimeout(() => setClearSuccessMsg(''), 4000);
  };

  const handleParseCSV = (content: string) => {
    setParsing(true);
    setValidationResult(null);
    setImportSuccessCount(null);

    Papa.parse<any>(content, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.replace(/^\ufeff/, '').trim(),
      complete: (results) => {
        const rows = results.data;
        validateCSVRows(rows).then((valRes) => {
          setValidationResult(valRes);
          setParsing(false);
        });
      },
      error: (err: any) => {
        console.error(err);
        setParsing(false);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      handleParseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await importCSVRows(validationResult.validRows);
      setImportSuccessCount(res.importedCount);
      setTimeout(() => {
        navigate('/admin/questions');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_CSV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/admin/questions')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Question Bank
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Bulk CSV Question Import
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload or paste CSV spreadsheets to import hundreds of questions into Horizon CBT database instantly.
        </p>
      </div>

      {importSuccessCount !== null && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Successfully imported {importSuccessCount} questions! Redirecting to Question Bank...</span>
        </div>
      )}

      {clearSuccessMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-rose-600" />
          <span>{clearSuccessMsg}</span>
        </div>
      )}

      {/* Main Upload Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 1: Upload CSV or Paste Content</h2>
            <p className="text-xs text-slate-500">Supported columns: class, subject, chapter, topic, difficulty, source_type, exam_name, exam_year, question, image_url (optional), option_a, option_b, option_c, option_d, correct_answer, marks, negative_marks, solution</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Clear Question Bank
            </button>

            <button
              type="button"
              onClick={copyTemplate}
              className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Template Copied!' : 'Copy Sample CSV'}
            </button>
          </div>
        </div>

        {/* File Drop Area */}
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
          <FileUp className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">Drag & drop your CSV file here, or browse</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">UTF-8 encoded .csv files up to 10MB</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-file-input"
          />
          <label
            htmlFor="csv-file-input"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Select CSV File
          </label>
        </div>

        {/* Or Paste Raw Text */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Or Paste Raw CSV Data</label>
          <textarea
            rows={5}
            placeholder="Paste raw CSV text with headers..."
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              handleParseCSV(e.target.value);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Validation Results & Preview Table */}
      {parsing ? (
        <LoadingState message="Parsing & validating CSV rows..." />
      ) : validationResult && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 2: Validation Results</h2>
              <p className="text-xs text-slate-500">Review valid questions before saving to database</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                {validationResult.validRows.length} Valid Questions
              </span>
              {validationResult.invalidRows.length > 0 && (
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">
                  {validationResult.invalidRows.length} Invalid Rows
                </span>
              )}
            </div>
          </div>

          {/* Invalid Rows Error List */}
          {validationResult.invalidRows.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Validation Errors Detected ({validationResult.invalidRows.length} rows will be skipped):
              </div>
              <div className="space-y-1 text-rose-800 max-h-40 overflow-y-auto">
                {validationResult.invalidRows.map((inv, idx) => (
                  <div key={idx} className="font-semibold">
                    Row {inv.rowNumber}: {inv.errors.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Questions Table Preview */}
          {validationResult.validRows.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valid Rows Ready for Import</h3>
              <div className="overflow-x-auto max-h-60 border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Chapter</th>
                      <th className="py-2.5 px-3">Topic</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Question</th>
                      <th className="py-2.5 px-3">Image</th>
                      <th className="py-2.5 px-3">Correct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {validationResult.validRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-800">{row.class}</td>
                        <td className="py-2 px-3 text-indigo-700 font-semibold">{row.subject}</td>
                        <td className="py-2 px-3 text-slate-700 truncate max-w-[150px]">{row.chapter}</td>
                        <td className="py-2 px-3 text-emerald-700 font-semibold truncate max-w-[150px]">{row.topic}</td>
                        <td className="py-2 px-3 truncate max-w-[200px]">{row.question}</td>
                        <td className="py-2 px-3">
                          {row.image_url ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <ImageIcon className="w-3 h-3 text-blue-600" /> Yes
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-700">{row.correct_answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={importing || validationResult.validRows.length === 0}
            onClick={handleConfirmImport}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {importing ? 'Importing Questions...' : `Confirm & Import ${validationResult.validRows.length} Questions`}
          </button>
        </div>
      )}

      {/* CONFIRM CLEAR ALL QUESTIONS DIALOG */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All Questions from Question Bank?"
        message="Are you sure you want to permanently clear the Question Bank? All current questions will be deleted so you can upload fresh questions through CSV."
        confirmLabel="Yes, Clear Question Bank"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
