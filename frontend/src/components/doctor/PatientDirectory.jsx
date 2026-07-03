import React, { useState } from 'react';
import { 
  Search, ListFilter, ArrowUpDown, Play, Eye, FileText, Pill, HeartPulse, 
  Clock, ShieldAlert, ChevronLeft, ChevronRight, UserMinus, Plus
} from 'lucide-react';
import { Card, Button, Field } from '../design-system';

export default function PatientDirectory({
  patients = [],
  onSelectPatient,
  onSelectView,
  onStartConsultation
}) {
  // Advanced Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterBlood, setFilterBlood] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterAdherence, setFilterAdherence] = useState('all'); // 'low' (<80%), 'high' (>=80%)
  const [sortBy, setSortBy] = useState('name-asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Extended mock patient profiles mapped to real database list, with fallbacks
  const mockExtendedProfiles = {
    'p1': {
      age: 42,
      gender: 'Male',
      bloodGroup: 'O+',
      riskLevel: 'High',
      treatment: 'Metformin & BP inhibitors',
      doctor: 'Dr. Gregory House',
      lastVisit: '2026-06-25',
      nextAppointment: '2026-07-04',
      adherence: 72,
      healthScore: 68,
      notesCount: 4,
      condition: 'Diabetes'
    },
    'p2': {
      age: 28,
      gender: 'Female',
      bloodGroup: 'A-',
      riskLevel: 'Moderate',
      treatment: 'Albuterol Inhaler',
      doctor: 'Dr. Gregory House',
      lastVisit: '2026-06-28',
      nextAppointment: '2026-07-04',
      adherence: 88,
      healthScore: 82,
      notesCount: 2,
      condition: 'Asthma'
    },
    'p3': {
      age: 54,
      gender: 'Male',
      bloodGroup: 'B+',
      riskLevel: 'Low',
      treatment: 'Cardio Monitoring',
      doctor: 'Dr. Gregory House',
      lastVisit: '2026-07-01',
      nextAppointment: '2026-07-05',
      adherence: 95,
      healthScore: 91,
      notesCount: 1,
      condition: 'Tachycardia'
    }
  };

  const getExtendedProfile = (patient) => {
    // Merge real database patient info with high-fidelity mock indicators
    const ext = mockExtendedProfiles[patient.id] || {
      age: 36,
      gender: 'Female',
      bloodGroup: 'O-',
      riskLevel: 'Low',
      treatment: 'Standard Care',
      doctor: 'Dr. Gregory House',
      lastVisit: '2026-06-30',
      nextAppointment: '2026-07-10',
      adherence: 90,
      healthScore: 85,
      notesCount: 0,
      condition: 'General'
    };

    return {
      id: patient.id,
      name: patient.name,
      accessCode: patient.accessCode,
      ...ext
    };
  };

  // Compile directory
  const directoryList = patients.map(p => getExtendedProfile(p));

  // Filter application
  const filteredList = directoryList.filter(p => {
    // Search filter
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.accessCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.treatment.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Dropdown filters
    const matchesGender = filterGender === 'all' || p.gender.toLowerCase() === filterGender.toLowerCase();
    const matchesRisk = filterRisk === 'all' || p.riskLevel.toLowerCase() === filterRisk.toLowerCase();
    const matchesBlood = filterBlood === 'all' || p.bloodGroup === filterBlood;
    const matchesCondition = filterCondition === 'all' || p.condition.toLowerCase() === filterCondition.toLowerCase();
    
    let matchesAdherence = true;
    if (filterAdherence === 'low') matchesAdherence = p.adherence < 80;
    if (filterAdherence === 'high') matchesAdherence = p.adherence >= 80;

    return matchesSearch && matchesGender && matchesRisk && matchesBlood && matchesCondition && matchesAdherence;
  });

  // Sorting application
  const sortedList = [...filteredList].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'adherence-asc':
        return a.adherence - b.adherence;
      case 'adherence-desc':
        return b.adherence - a.adherence;
      case 'score-desc':
        return b.healthScore - a.healthScore;
      case 'risk-desc':
        const priority = { 'High': 3, 'Moderate': 2, 'Low': 1 };
        return priority[b.riskLevel] - priority[a.riskLevel];
      default:
        return 0;
    }
  });

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedList.length / itemsPerPage);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterGender('all');
    setFilterRisk('all');
    setFilterBlood('all');
    setFilterCondition('all');
    setFilterAdherence('all');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-rise-in">
      
      {/* HEADER TITLE */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Directory</h1>
        <p className="text-slate-500 text-sm mt-0.5">Filter diagnoses, manage clinical profiles, and initiate direct consultations.</p>
      </div>

      {/* FILTER CONTROLS CARD */}
      <Card className="p-5 border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ListFilter className="h-4 w-4 text-emerald-700" />
            Advanced Clinical Filters
          </h2>
          <button 
            onClick={resetFilters} 
            className="text-xs text-slate-400 hover:text-emerald-700 font-bold transition-all"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search Patient</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Name, code, or treatment..." 
                className="input-field pl-8 py-1.5 text-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Risk Status</label>
            <select 
              value={filterRisk} 
              onChange={(e) => { setFilterRisk(e.target.value); setCurrentPage(1); }}
              className="input-field py-1.5 text-xs bg-white font-medium"
            >
              <option value="all">All Risks</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Adherence</label>
            <select 
              value={filterAdherence} 
              onChange={(e) => { setFilterAdherence(e.target.value); setCurrentPage(1); }}
              className="input-field py-1.5 text-xs bg-white font-medium"
            >
              <option value="all">All Adherences</option>
              <option value="low">Low (&lt;80%)</option>
              <option value="high">Good (&ge;80%)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Blood Group</label>
            <select 
              value={filterBlood} 
              onChange={(e) => { setFilterBlood(e.target.value); setCurrentPage(1); }}
              className="input-field py-1.5 text-xs bg-white font-medium"
            >
              <option value="all">All Bloods</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Diagnosis Group</label>
            <select 
              value={filterCondition} 
              onChange={(e) => { setFilterCondition(e.target.value); setCurrentPage(1); }}
              className="input-field py-1.5 text-xs bg-white font-medium"
            >
              <option value="all">All Conditions</option>
              <option value="diabetes">Diabetes</option>
              <option value="asthma">Asthma</option>
              <option value="tachycardia">Tachycardia</option>
            </select>
          </div>
        </div>

        {/* SORTING CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100/50">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Sort Registry By:</span>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'name-asc', label: 'Name (A-Z)' },
                { id: 'risk-desc', label: 'Risk (High-Low)' },
                { id: 'adherence-desc', label: 'Adherence (High)' },
                { id: 'score-desc', label: 'Health Score' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    sortBy === opt.id 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] font-semibold text-slate-400">
            Registry matched: <strong className="text-slate-700">{filteredList.length} patients</strong>
          </span>
        </div>
      </Card>

      {/* PATIENT GRID LIST */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentItems.length > 0 ? (
          currentItems.map((p) => {
            const initials = p.name.split(' ').map(n => n[0]).join('');
            
            // Risk Level Color
            const riskColors = 
              p.riskLevel === 'High' 
                ? 'bg-rose-50 text-rose-800 border-rose-200 ring-rose-500/50 ring-2'
                : p.riskLevel === 'Moderate'
                ? 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/50 ring-2'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/50 ring-2';

            return (
              <Card key={p.id} interactive className="p-5 flex flex-col justify-between h-[280px]">
                {/* Upper block */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ring-offset-2 ${riskColors}`}>
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{p.name}</h3>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{p.accessCode}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                      p.riskLevel === 'High' 
                        ? 'bg-rose-50 text-rose-800 border-rose-100'
                        : p.riskLevel === 'Moderate'
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    }`}>
                      {p.riskLevel} Risk
                    </span>
                  </div>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] border-b border-slate-100/50 pb-3">
                    <div>
                      <span className="text-slate-400 block font-bold">Specs</span>
                      <strong className="text-slate-700 block mt-0.5">{p.age}y • {p.gender[0]} • {p.bloodGroup}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Adherence</span>
                      <strong className={`block mt-0.5 ${p.adherence < 80 ? 'text-rose-700' : 'text-emerald-700'}`}>{p.adherence}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Health Score</span>
                      <strong className="text-emerald-800 block mt-0.5">{p.healthScore}/100</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3 font-medium">
                    Active Regimen: <strong className="text-slate-800 font-semibold">{p.treatment}</strong>
                  </p>
                </div>

                {/* Bottom action bar */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100/50">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onStartConsultation(p.id)}
                    className="flex-1 text-[11px] py-1.5 min-h-9 flex items-center justify-center gap-1"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    Consult
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onSelectPatient(p.id);
                      onSelectView('records');
                    }}
                    className="text-[11px] py-1.5 min-h-9"
                  >
                    Chart
                  </Button>
                  <button
                    onClick={() => {
                      onSelectPatient(p.id);
                      onSelectView('prescriptions');
                    }}
                    className="h-9 w-9 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 flex items-center justify-center text-slate-500 hover:text-emerald-800 transition-all focus:outline-none"
                    title="Write Prescription"
                  >
                    <Pill className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center">
            <p className="text-xs text-slate-400">No patient records matched the filtered metrics.</p>
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <IconButton 
            label="Previous Page" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <span className="text-xs font-bold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <IconButton 
            label="Next Page" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      )}

    </div>
  );
}
