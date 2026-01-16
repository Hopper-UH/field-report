import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Report, ReportType } from '../types';
import { Save, X, Eraser, Wand2, Loader2, Image as ImageIcon, Upload, Trash2, AlignLeft, Eye, Download, History } from 'lucide-react';
import { refineText } from '../services/geminiService';

interface ReportFormProps {
  onSave: (report: Report, shouldDownload: boolean) => void;
  onCancel: () => void;
  selectedType: ReportType;
  initialData?: Report;
  history?: Report[];
}

const ReportForm: React.FC<ReportFormProps> = ({ onSave, onCancel, selectedType, initialData, history = [] }) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for weather components
  const [weatherCondition, setWeatherCondition] = useState('');
  const [weatherTemp, setWeatherTemp] = useState('');

  // Dropdown for previous projects
  const uniqueProjects = useMemo(() => {
    const projects = new Map<string, Report>();
    // Iterate through history to find unique projects. 
    // Since history is often newest first, the first time we see a project name, it's the latest data.
    history.forEach(report => {
        if (report.projectName && !projects.has(report.projectName)) {
            projects.set(report.projectName, report);
        }
    });
    return Array.from(projects.values());
  }, [history]);

  const [formData, setFormData] = useState<Partial<Report>>(() => {
    if (initialData) {
      return { ...initialData };
    }
    
    // Check for saved inspector settings
    const savedSettings = localStorage.getItem('field_reporter_settings');
    const defaultInspector = savedSettings ? JSON.parse(savedSettings) : {};

    return {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedType,
      date: new Date().toISOString().split('T')[0],
      timeRange: '',
      projectName: '',
      jobId: 'N/A',
      ownerDeveloper: '',
      projectAddress: '',
      stageOfConstruction: '',
      projectType: '',
      inspectionType: 'Field Inspection',
      weather: '',
      photosTaken: true,
      visualInspectionIssue: 'N/A',
      inspectorName: defaultInspector.name || '',
      inspectorPhone: defaultInspector.phone || '',
      inspectorEmail: defaultInspector.email || '',
      signature: '',
      generalComments: '',
      images: [],
      status: 'Completed',
      createdAt: Date.now(),
    };
  });

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProjectName = e.target.value;
    if (!selectedProjectName) return;

    const projectData = uniqueProjects.find(p => p.projectName === selectedProjectName);
    if (projectData) {
        setFormData(prev => ({
            ...prev,
            projectName: projectData.projectName,
            jobId: projectData.jobId,
            ownerDeveloper: projectData.ownerDeveloper,
            projectAddress: projectData.projectAddress,
            projectType: projectData.projectType,
            stageOfConstruction: projectData.stageOfConstruction 
        }));
    }
  };

  // Initialize weather local state if editing existing data
  useEffect(() => {
    if (formData.weather) {
        // Attempt to parse "Condition / Temp F"
        const parts = formData.weather.split(' / ');
        if (parts.length > 0) setWeatherCondition(parts[0]);
        if (parts.length > 1) setWeatherTemp(parts[1].replace(' F', ''));
    }
  }, []);

  // Update formData.weather when components change
  useEffect(() => {
    if (weatherCondition || weatherTemp) {
        updateField('weather', `${weatherCondition} / ${weatherTemp ? weatherTemp + ' F' : ''}`);
    }
  }, [weatherCondition, weatherTemp]);

  const updateField = (field: keyof Report, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAiRefine = async () => {
    if (!formData.generalComments) return;
    setLoadingAi(true);
    try {
      const refined = await refineText(formData.generalComments);
      setFormData(prev => ({ ...prev, generalComments: refined }));
    } catch (e) {
      alert("AI Service unavailable. Check API Key.");
    } finally {
      setLoadingAi(false);
    }
  };

  const insertParagraph = () => {
    setFormData(prev => ({
      ...prev,
      generalComments: (prev.generalComments || '') + '\n\n'
    }));
  };

  // --- Image Handling ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            newImages.push(reader.result as string);
            if (newImages.length === files.length) {
              setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), ...newImages]
              }));
            }
          }
        };
        // Explicitly cast file to Blob to satisfy TypeScript if inference fails
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  // --- Signature Pad Logic ---
  const getCoordinates = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    } else {
        return { x: 0, y: 0 };
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) updateField('signature', canvas.toDataURL());
    }
  };

  // Prevent scrolling when touching canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    if (canvas) {
        canvas.addEventListener('touchstart', preventDefault, { passive: false });
        canvas.addEventListener('touchmove', preventDefault, { passive: false });
        canvas.addEventListener('touchend', preventDefault, { passive: false });
    }
    return () => {
        if (canvas) {
            canvas.removeEventListener('touchstart', preventDefault);
            canvas.removeEventListener('touchmove', preventDefault);
            canvas.removeEventListener('touchend', preventDefault);
        }
    };
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateField('signature', '');
    }
  };

  const handleAction = (action: 'preview' | 'download') => {
    if (!formData.projectName || !formData.date || !formData.inspectorName) {
      alert("Please fill in required fields (Project, Date, Inspector Name)");
      return;
    }
    onSave(formData as Report, action === 'download');
  };

  const weatherOptions = [
    "Sunny", "Clear", "Partly Cloudy", "Cloudy", "Overcast", 
    "Light Rain", "Rain", "Heavy Rain", "Thunderstorm", 
    "Snow", "Sleet", "Foggy", "Windy"
  ];

  return (
    <div className="max-w-6xl mx-auto md:p-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{initialData ? 'Edit Report' : 'New Inspection Report'}</h2>
            <p className="text-slate-400 text-sm">{initialData ? 'Update the details below.' : 'Fill out the field inspection details below.'}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="p-4 md:p-8 space-y-8">
          
          {/* General Site Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">General Site Information</h3>
            
            {/* Quick Fill Dropdown */}
            {uniqueProjects.length > 0 && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center text-blue-900 font-semibold text-sm whitespace-nowrap">
                        <History className="w-4 h-4 mr-2" />
                        Quick Fill:
                    </div>
                    <select 
                        onChange={handleProjectSelect}
                        className="w-full sm:w-auto flex-1 bg-white text-slate-700 text-sm border border-blue-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-400 transition-colors"
                        defaultValue=""
                    >
                        <option value="" disabled>Select a previous project to auto-fill details...</option>
                        {uniqueProjects.map(p => (
                            <option key={p.projectName} value={p.projectName}>{p.projectName}</option>
                        ))}
                    </select>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="w-full rounded border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.date}
                  onChange={e => updateField('date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Time of Inspection</label>
                <input
                  type="text"
                  className="w-full rounded border-slate-300 border p-2 outline-none"
                  placeholder="e.g. 10:30AM to 1:30PM"
                  value={formData.timeRange}
                  onChange={e => updateField('timeRange', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  className="w-full rounded border-slate-300 border p-2 outline-none"
                  value={formData.projectName}
                  onChange={e => updateField('projectName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project ID / N/A</label>
                <input
                  type="text"
                  className="w-full rounded border-slate-300 border p-2 outline-none"
                  value={formData.jobId}
                  onChange={e => updateField('jobId', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Owner / Developer</label>
                <input
                  type="text"
                  className="w-full rounded border-slate-300 border p-2 outline-none"
                  value={formData.ownerDeveloper}
                  onChange={e => updateField('ownerDeveloper', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Address</label>
                <input
                  type="text"
                  className="w-full rounded border-slate-300 border p-2 outline-none"
                  value={formData.projectAddress}
                  onChange={e => updateField('projectAddress', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Stage of Construction</label>
                <input
                  type="text"
                  className="w-full rounded border-slate-300 border p-2 outline-none"
                  value={formData.stageOfConstruction}
                  onChange={e => updateField('stageOfConstruction', e.target.value)}
                  placeholder="e.g. Demolition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Project Type</label>
                <input
                  type="text"
                  className="w-full rounded border-slate-300 border p-2 outline-none"
                  value={formData.projectType}
                  onChange={e => updateField('projectType', e.target.value)}
                  placeholder="e.g. Sidewalk Improvement"
                />
              </div>

               <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Inspection Type</label>
                <input
                  type="text"
                  className="w-full rounded border-slate-300 border p-2 outline-none"
                  value={formData.inspectionType}
                  onChange={e => updateField('inspectionType', e.target.value)}
                />
              </div>
              
              {/* Updated Weather Inputs - Stacked on Mobile */}
              <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Weather Condition</label>
                    <select
                        className="w-full rounded border-slate-300 border p-2 outline-none bg-white"
                        value={weatherCondition}
                        onChange={e => setWeatherCondition(e.target.value)}
                    >
                        <option value="">Select...</option>
                        {weatherOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Temp (°F)</label>
                    <input
                      type="number"
                      className="w-full rounded border-slate-300 border p-2 outline-none"
                      value={weatherTemp}
                      onChange={e => setWeatherTemp(e.target.value)}
                      placeholder="65"
                    />
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Were Photos Taken?</label>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                            <input type="radio" checked={formData.photosTaken === true} onChange={() => updateField('photosTaken', true)} className="text-blue-600 focus:ring-blue-500" />
                            <span>Yes</span>
                        </label>
                         <label className="flex items-center space-x-2">
                            <input type="radio" checked={formData.photosTaken === false} onChange={() => updateField('photosTaken', false)} className="text-blue-600 focus:ring-blue-500" />
                            <span>No</span>
                        </label>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Reason for no visual inspection (if any)</label>
                    <input
                      type="text"
                      className="w-full rounded border-slate-300 border p-2 outline-none"
                      value={formData.visualInspectionIssue}
                      onChange={e => updateField('visualInspectionIssue', e.target.value)}
                    />
                 </div>
            </div>
          </div>

          {/* Inspector Info & Signature */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Inspector Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Inspector Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded border-slate-300 border p-2 outline-none"
                      value={formData.inspectorName}
                      onChange={e => updateField('inspectorName', e.target.value)}
                    />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-2">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                        <input
                          type="text"
                          className="w-full rounded border-slate-300 border p-2 outline-none"
                          value={formData.inspectorPhone}
                          onChange={e => updateField('inspectorPhone', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                        <input
                          type="text"
                          className="w-full rounded border-slate-300 border p-2 outline-none"
                          value={formData.inspectorEmail}
                          onChange={e => updateField('inspectorEmail', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Signature Pad */}
            <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Signature</label>
                 <div className="border-2 border-slate-300 border-dashed rounded-lg bg-slate-50 w-full md:w-1/2 overflow-hidden touch-none h-32 relative">
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={120}
                        className="w-full h-full cursor-crosshair bg-white block"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                 </div>
                 <div className="flex space-x-2 mt-2 w-full md:w-1/2">
                    <button type="button" onClick={clearSignature} className="text-xs flex items-center text-red-600 hover:text-red-700 font-medium">
                        <Eraser className="w-3 h-3 mr-1" /> Clear Signature
                    </button>
                    <span className="text-xs text-slate-400 ml-auto">Sign within the box</span>
                 </div>
            </div>
          </div>


          {/* General Comments */}
          <div>
            <div className="flex flex-wrap justify-between items-center mb-4 border-b pb-2 gap-2">
              <h3 className="text-lg font-bold text-slate-800">General Comments</h3>
              <div className="flex space-x-2">
                <button
                    type="button"
                    onClick={insertParagraph}
                    className="flex items-center text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-wider"
                    title="Insert Paragraph Break"
                >
                    <AlignLeft className="w-3 h-3 mr-2" />
                    <span className="hidden sm:inline">Add Paragraph</span>
                    <span className="sm:hidden">Para</span>
                </button>
                <button
                    type="button"
                    onClick={handleAiRefine}
                    disabled={loadingAi || !formData.generalComments}
                    className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-all ${
                    loadingAi 
                        ? 'bg-slate-100 text-slate-400' 
                        : 'bg-gradient-to-r from-green-600 to-lime-600 text-white shadow-md hover:shadow-lg'
                    }`}
                >
                    {loadingAi ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Wand2 className="w-3 h-3 mr-2" />}
                    {loadingAi ? 'Improving...' : 'Refine with AI'}
                </button>
              </div>
            </div>
            <textarea
              className="w-full rounded-lg border-slate-300 border p-4 min-h-[200px] outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              placeholder="Enter your observations here..."
              value={formData.generalComments}
              onChange={e => updateField('generalComments', e.target.value)}
            ></textarea>
          </div>

          {/* Image Uploads */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-slate-800">Site Photos</h3>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors uppercase tracking-wider"
                >
                    <Upload className="w-3 h-3 mr-2" />
                    Add Images
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>
            
            {formData.images && formData.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((img, index) => (
                        <div key={index} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                            <img src={img} alt={`Site photo ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No photos added. Click to upload.</p>
                </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="pt-8 border-t flex flex-col sm:flex-row justify-between gap-4">
            
            {/* Left: Delete/Cancel */}
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-medium transition-colors flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Report
            </button>

            {/* Right: Preview & Download */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                type="button"
                onClick={() => handleAction('preview')}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors flex items-center justify-center"
                >
                <Eye className="w-4 h-4 mr-2" />
                Preview
                </button>
                <button
                type="button"
                onClick={() => handleAction('download')}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-md transition-colors flex items-center justify-center"
                >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
