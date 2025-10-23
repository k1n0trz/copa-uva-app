"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Calendar, Activity, Bell } from "lucide-react";

type FlowLevel = "none" | "light" | "medium" | "heavy";
type Symptom = "cramps" | "headache" | "bloating" | "fatigue" | "acne" | "backache" | "nausea" | "other";
type MoodType = "happy" | "sad" | "irritable" | "anxious" | "neutral" | "energetic" | "tired";

interface DayEntry {
  date: string;
  flow: FlowLevel;
  symptoms: Symptom[];
  mood: MoodType;
  notes?: string;
}

interface CyclePrediction {
  nextPeriodStart: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDay: string;
  confidence: number;
}

export default function CircularCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<DayEntry>>({
    flow: "none",
    symptoms: [],
    mood: "neutral",
    notes: "",
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useEffect(() => {
    const saved = localStorage.getItem("menstrualEntries");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem("menstrualEntries", JSON.stringify(entries));
      calculatePredictions();
    }
  }, [entries]);

  const calculatePredictions = () => {
    if (entries.length < 2) return;
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const periodStarts = sorted.filter((e, i, arr) => e.flow !== "none" && (!arr[i - 1] || arr[i - 1].flow === "none")).map(e => e.date);
    
    if (periodStarts.length < 2) return;
    
    const cycleLengths = periodStarts.slice(1).map((date, i) => 
      Math.floor((new Date(date).getTime() - new Date(periodStarts[i]).getTime()) / (1000 * 60 * 60 * 24))
    );
    const avgCycle = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    const lastPeriod = new Date(periodStarts[periodStarts.length - 1]);
    const nextPeriod = new Date(lastPeriod.getTime() + avgCycle * 24 * 60 * 60 * 1000);
    const ovulation = new Date(nextPeriod.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    setPrediction({
      nextPeriodStart: nextPeriod.toISOString().split('T')[0],
      fertileWindowStart: new Date(ovulation.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fertileWindowEnd: new Date(ovulation.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ovulationDay: ovulation.toISOString().split('T')[0],
      confidence: 85
    });
  };

  const getDateString = (day: number) => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDayInfo = (day: number) => {
    const dateStr = getDateString(day);
    const entry = entries.find(e => e.date === dateStr);
    const isPredicted = prediction && dateStr === prediction.nextPeriodStart;
    const isFertile = prediction && dateStr >= prediction.fertileWindowStart && dateStr <= prediction.fertileWindowEnd;
    const isOvulation = prediction && dateStr === prediction.ovulationDay;
    
    return { entry, isPredicted, isFertile, isOvulation };
  };

  const getSegmentColor = (day: number) => {
    const { entry, isPredicted, isFertile, isOvulation } = getDayInfo(day);
    
    if (entry) {
      if (entry.flow === "heavy") return "#e91e63";
      if (entry.flow === "medium") return "#f06292";
      if (entry.flow === "light") return "#f8bbd0";
    }
    if (isPredicted) return "#ffcdd2";
    if (isOvulation) return "#9c27b0";
    if (isFertile) return "#81c784";
    return "#e8e8e8";
  };

  const handleSaveEntry = () => {
    if (selectedDay === null) return;
    const dateStr = getDateString(selectedDay);
    const fullEntry: DayEntry = {
      date: dateStr,
      flow: newEntry.flow as FlowLevel || "none",
      symptoms: newEntry.symptoms as Symptom[] || [],
      mood: newEntry.mood as MoodType || "neutral",
      notes: newEntry.notes || ""
    };
    
    setEntries(prev => {
      const filtered = prev.filter(e => e.date !== dateStr);
      return [...filtered, fullEntry];
    });
    setShowEntryForm(false);
    setSelectedDay(null);
  };

  const CircularCalendarSVG = () => {
    const size = typeof window !== 'undefined' && window.innerWidth < 640 ? 320 : 400;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;
    const innerRadius = size * 0.15;
    
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-full">
        <circle cx={centerX} cy={centerY} r={radius + 20} fill="#fafafa" />
        
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const angle = (360 / daysInMonth) * (day - 1) - 90;
          const nextAngle = (360 / daysInMonth) * day - 90;
          const isToday = day === new Date().getDate() && 
                         currentDate.getMonth() === new Date().getMonth() &&
                         currentDate.getFullYear() === new Date().getFullYear();
          
          const startAngleRad = (angle * Math.PI) / 180;
          const endAngleRad = (nextAngle * Math.PI) / 180;
          
          const x1 = centerX + innerRadius * Math.cos(startAngleRad);
          const y1 = centerY + innerRadius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(startAngleRad);
          const y2 = centerY + radius * Math.sin(startAngleRad);
          const x3 = centerX + radius * Math.cos(endAngleRad);
          const y3 = centerY + radius * Math.sin(endAngleRad);
          const x4 = centerX + innerRadius * Math.cos(endAngleRad);
          const y4 = centerY + innerRadius * Math.sin(endAngleRad);
          
          const largeArc = nextAngle - angle > 180 ? 1 : 0;
          const pathData = `M ${x1} ${y1} L ${x2} ${y2} A ${radius} ${radius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`;
          
          const textAngle = (angle + nextAngle) / 2;
          const textRadius = (radius + innerRadius) / 2;
          const textX = centerX + textRadius * Math.cos((textAngle * Math.PI) / 180);
          const textY = centerY + textRadius * Math.sin((textAngle * Math.PI) / 180);
          
          return (
            <g key={day}>
              <path
                d={pathData}
                fill={getSegmentColor(day)}
                stroke={isToday ? "#ff4081" : selectedDay === day ? "#7c4dff" : "#fff"}
                strokeWidth={isToday ? 3 : selectedDay === day ? 2.5 : 1}
                className="cursor-pointer transition-all hover:opacity-80 active:opacity-70"
                onClick={() => {
                  setSelectedDay(day);
                  const entry = entries.find(e => e.date === getDateString(day));
                  setNewEntry({
                    flow: entry?.flow || "none",
                    symptoms: entry?.symptoms || [],
                    mood: entry?.mood || "neutral",
                    notes: entry?.notes || "",
                  });
                }}
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] sm:text-xs font-semibold pointer-events-none select-none"
                fill={getSegmentColor(day) === "#e8e8e8" ? "#666" : "#fff"}
              >
                {day}
              </text>
            </g>
          );
        })}
        
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="white" stroke="#e0e0e0" strokeWidth="2" />
        <text x={centerX} y={centerY - size * 0.025} textAnchor="middle" className="text-sm sm:text-base font-bold" fill="#666">
          {monthNames[currentDate.getMonth()]}
        </text>
        <text x={centerX} y={centerY + size * 0.035} textAnchor="middle" className="text-xl sm:text-2xl font-bold" fill="#e91e63">
          {currentDate.getFullYear()}
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white rounded-2xl p-3 sm:p-4 shadow-lg">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} 
                  className="p-2 hover:bg-pink-100 rounded-full transition active:scale-95">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
            Ciclo Menstrual
          </h1>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} 
                  className="p-2 hover:bg-pink-100 rounded-full transition active:scale-95">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
          </button>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-xs sm:text-sm px-2">
          {[
            { color: "#f06292", label: "Período" },
            { color: "#ffcdd2", label: "Predicción" },
            { color: "#81c784", label: "Fértil" },
            { color: "#9c27b0", label: "Ovulación" }
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 sm:px-3 py-1 rounded-full shadow">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendario Circular */}
        <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="w-full max-w-md mx-auto aspect-square">
            <CircularCalendarSVG />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 px-1">
          <button onClick={() => { setSelectedDay(new Date().getDate()); setShowEntryForm(true); }}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-xs sm:text-base">Hoy</span>
          </button>
          <button onClick={() => setShowPredictions(true)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-xs sm:text-base">Predicciones</span>
          </button>
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-xs sm:text-base">Alertas</span>
          </button>
        </div>

        {/* Detalle del día seleccionado */}
        {selectedDay && !showEntryForm && !showPredictions && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
              {selectedDay} de {monthNames[currentDate.getMonth()]}
            </h2>
            {(() => {
              const entry = entries.find(e => e.date === getDateString(selectedDay));
              return entry ? (
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-500">Flujo</p>
                      <p className="font-semibold text-sm sm:text-base capitalize">{entry.flow}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-500">Ánimo</p>
                      <p className="font-semibold text-sm sm:text-base capitalize">{entry.mood}</p>
                    </div>
                  </div>
                  {entry.symptoms.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Síntomas</p>
                      <p className="font-semibold text-sm sm:text-base">{entry.symptoms.join(", ")}</p>
                    </div>
                  )}
                  <button onClick={() => setShowEntryForm(true)}
                          className="w-full bg-pink-500 text-white py-2 sm:py-2.5 rounded-lg hover:bg-pink-600 transition active:scale-98 text-sm sm:text-base">
                    Editar
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowEntryForm(true)}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2.5 sm:py-3 rounded-lg hover:shadow-lg transition active:scale-98 text-sm sm:text-base">
                  Añadir entrada
                </button>
              );
            })()}
          </div>
        )}

        {/* Formulario de entrada */}
        {showEntryForm && selectedDay && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Registrar síntomas</h2>
              <button onClick={() => setShowEntryForm(false)} className="p-1 hover:bg-gray-100 rounded active:scale-95">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2">Flujo</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["none", "light", "medium", "heavy"] as FlowLevel[]).map(f => (
                    <button key={f} onClick={() => setNewEntry({...newEntry, flow: f})}
                            className={`p-2 rounded-lg border-2 transition active:scale-95 text-xs sm:text-sm ${newEntry.flow === f ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}>
                      {f === "none" ? "Sin" : f === "light" ? "Leve" : f === "medium" ? "Medio" : "Alto"}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2">Estado de ánimo</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["happy", "sad", "irritable", "anxious"] as MoodType[]).map(m => (
                    <button key={m} onClick={() => setNewEntry({...newEntry, mood: m})}
                            className={`p-2 rounded-lg border-2 transition active:scale-95 text-lg sm:text-xl ${newEntry.mood === m ? "border-purple-500 bg-purple-50" : "border-gray-200"}`}>
                      {m === "happy" ? "😊" : m === "sad" ? "😢" : m === "irritable" ? "😤" : "😰"}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2">Síntomas</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["cramps", "headache", "bloating", "fatigue"] as Symptom[]).map(s => (
                    <button key={s} onClick={() => {
                      const current = newEntry.symptoms || [];
                      setNewEntry({
                        ...newEntry, 
                        symptoms: current.includes(s) ? current.filter(x => x !== s) : [...current, s]
                      });
                    }}
                            className={`p-2 rounded-lg border-2 transition active:scale-95 text-xs ${(newEntry.symptoms || []).includes(s) ? "border-pink-500 bg-pink-50" : "border-gray-200"}`}>
                      {s === "cramps" ? "Cólicos" : s === "headache" ? "Dolor" : s === "bloating" ? "Hinchazón" : "Fatiga"}
                    </button>
                  ))}
                </div>
              </div>
              
              <button onClick={handleSaveEntry}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition active:scale-98 text-sm sm:text-base">
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Predicciones */}
        {showPredictions && prediction && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Predicciones del ciclo</h2>
              <button onClick={() => setShowPredictions(false)} className="p-1 hover:bg-gray-100 rounded active:scale-95">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 bg-pink-50 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-600">Próximo período</p>
                <p className="text-base sm:text-lg font-bold text-pink-600">{new Date(prediction.nextPeriodStart).toLocaleDateString()}</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-600">Ventana fértil</p>
                <p className="text-base sm:text-lg font-bold text-green-600">
                  {new Date(prediction.fertileWindowStart).toLocaleDateString()} - {new Date(prediction.fertileWindowEnd).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-purple-50 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-600">Ovulación</p>
                <p className="text-base sm:text-lg font-bold text-purple-600">{new Date(prediction.ovulationDay).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}