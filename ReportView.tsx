import React, { useEffect } from 'react';
import { Report } from '../types';
import { Download, ArrowLeft, Printer, Trash2 } from 'lucide-react';
import { generatePDF } from '../services/pdfService';

interface ReportViewProps {
  report: Report;
  onBack: () => void;
  onDelete?: () => void;
  autoDownload?: boolean;
}

const ReportView: React.FC<ReportViewProps> = ({ report, onBack, onDelete, autoDownload }) => {
  const handleDownload = () => {
    generatePDF(report, 'printable-container');
  };

  useEffect(() => {
    if (autoDownload) {
        // Small delay to ensure DOM render
        setTimeout(() => {
            handleDownload();
        }, 500);
    }
  }, [autoDownload]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const formattedDate = formatDate(report.date);

  // Split comments by double newlines (paragraphs) and filter out empty strings
  const commentParagraphs = report.generalComments
    ? report.generalComments.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    : [];

  return (
    <div className="max-w-5xl mx-auto flex flex-col min-h-screen">
      {/* Top Controls */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center no-print gap-4">
        <button
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {onDelete && (
            <button
                onClick={onDelete}
                className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Container for PDF Generation - Scrollable on mobile to preserve A4 layout */}
      <div className="overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0">
        <div id="printable-container" className="space-y-8 min-w-[210mm] mx-auto">
          
          {/* Page 1: Main Report Table */}
          <div className="report-page bg-white p-8 md:p-12 shadow-2xl mx-auto w-full max-w-[210mm] min-h-[297mm] box-border">
            <div className="border-4 border-black">
              {/* Main Header */}
              <div className="bg-[#C4D79B] text-center py-4 border-b-2 border-black">
                <h1 className="text-3xl font-bold font-serif">Field Inspection</h1>
                <h1 className="text-3xl font-bold font-serif">Report</h1>
              </div>

              {/* Sub Header */}
              <div className="bg-gray-300 text-center py-1 border-b-2 border-black">
                <h2 className="text-lg font-bold">General Site Information</h2>
              </div>

              {/* Table Body */}
              <table className="w-full border-collapse">
                <tbody>
                    {/* Date / Time */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold align-top">
                        Date / Time of Inspection
                      </td>
                      <td className="p-2 font-medium">
                        <div className="flex justify-between">
                            <span>{formattedDate} – {report.timeRange}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Project Name */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Project Name</td>
                      <td className="p-0">
                        <div className="flex h-full">
                          <div className="flex-grow p-2 border-r-2 border-black">{report.projectName}</div>
                          <div className="w-16 p-2 text-center font-bold bg-gray-50">{report.jobId}</div>
                        </div>
                      </td>
                    </tr>

                    {/* Owner */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Owner / Developer</td>
                      <td className="p-2">{report.ownerDeveloper}</td>
                    </tr>

                    {/* Address */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Project Address</td>
                      <td className="p-2">{report.projectAddress}</td>
                    </tr>

                    {/* Stage */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Stage of Construction</td>
                      <td className="p-2">{report.stageOfConstruction}</td>
                    </tr>

                    {/* Project Type */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Project Type</td>
                      <td className="p-2">{report.projectType}</td>
                    </tr>

                    {/* Inspection Type */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Inspection Type</td>
                      <td className="p-2">{report.inspectionType}</td>
                    </tr>

                    {/* Weather */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Site Weather Information</td>
                      <td className="p-2">{report.weather}</td>
                    </tr>

                    {/* Photos */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Were Photos Taken?</td>
                      <td className="p-0">
                          <div className="flex h-full">
                            <div className="w-32 p-2 border-r-2 border-black text-center">{report.photosTaken ? 'Yes' : 'No'}</div>
                            <div className="p-2 flex-grow text-xs leading-tight">
                                <span className="font-bold block">Is there any reason a visual inspection cannot be performed at this time?</span>
                                {report.visualInspectionIssue}
                            </div>
                          </div>
                      </td>
                    </tr>

                    {/* Inspector Name */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Inspector Name</td>
                      <td className="p-2 font-serif text-lg">{report.inspectorName}</td>
                    </tr>

                    {/* Inspector Contact */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold">Inspector Contact Information</td>
                      <td className="p-2 text-sm">
                          <span className="mr-4">PH: {report.inspectorPhone}</span>
                          <span>Email: {report.inspectorEmail}</span>
                      </td>
                    </tr>

                    {/* Signature */}
                    <tr className="border-b-2 border-black">
                      <td className="w-1/3 border-r-2 border-black p-2 font-bold align-middle">Signature</td>
                      <td className="p-2 h-20">
                          {report.signature ? (
                              <img src={report.signature} alt="Signature" className="h-16 object-contain" />
                          ) : (
                              <span className="text-gray-400 italic font-serif text-2xl opacity-50">{report.inspectorName}</span>
                          )}
                      </td>
                    </tr>
                </tbody>
              </table>

              {/* General Comments Header */}
              <div className="bg-gray-300 text-center py-1 border-b-2 border-black">
                <h2 className="text-lg font-bold">General Comments</h2>
              </div>

              {/* Comments Body - Paragraphs with black borders */}
              <div className="min-h-[300px] text-lg font-medium">
                {commentParagraphs.length > 0 ? (
                  commentParagraphs.map((paragraph, index) => (
                    <div key={index} className="p-3 border-b-2 border-black leading-snug">
                      {paragraph}
                    </div>
                  ))
                ) : (
                   <div className="p-3 border-b-2 border-black leading-snug text-transparent">.</div>
                )}
              </div>

              {/* Footer of the PDF Box */}
              <div className="bg-black h-4 w-full"></div>
            </div>
          </div>

          {/* Page 2+: Images - Each image gets its own "page" div */}
          {report.images && report.images.length > 0 && report.images.map((img, index) => (
            <div key={index} className="report-page bg-white p-12 shadow-2xl mx-auto w-full max-w-[210mm] min-h-[297mm] flex items-center justify-center relative box-border">
              <img 
                src={img} 
                alt={`Field Observation ${index + 1}`} 
                className="max-w-full max-h-[85vh] object-contain shadow-lg border border-slate-200" 
              />
              <div className="absolute bottom-10 left-0 right-0 text-center text-slate-400 text-sm uppercase tracking-widest">
                Attachment #{index + 1}
              </div>
            </div>
          ))}

        </div>
      </div>
      
      {/* Bottom Download Button */}
       <div className="mt-4 mb-8 flex justify-center no-print px-4">
          <button
            onClick={handleDownload}
            className="w-full md:w-auto flex items-center justify-center px-8 py-4 bg-green-700 text-white rounded-full shadow-xl hover:bg-green-800 transition-all text-lg font-semibold"
          >
            <Download className="w-6 h-6 mr-2" />
            Download Field Report PDF
          </button>
        </div>
    </div>
  );
};

export default ReportView;