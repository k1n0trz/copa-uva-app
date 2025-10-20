"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Icons } from "@/components/icons"; // tus íconos personalizados
import "@/styles/main.scss"; // importa tus estilos globales y variables
import { toast } from "react-hot-toast"; // Para notificaciones

// Tipos mejorados
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
  confidence: number; // 0-100%
}

interface NotificationSetting {
  type: "period" | "fertile" | "ovulation";
  daysInAdvance: number;
  enabled: boolean;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    { type: "period", daysInAdvance: 2, enabled: true },
    { type: "fertile", daysInAdvance: 1, enabled: true },
    { type: "ovulation", daysInAdvance: 1, enabled: true },
  ]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<DayEntry>>({
    flow: "none",
    symptoms: [],
    mood: "neutral",
    notes: "",
  });
  const [stats, setStats] = useState({
    averageCycleLength: 0,
    averagePeriodLength: 0,
    commonSymptoms: [] as Symptom[],
    commonMood: "" as MoodType,
  });

  // Generar calendario
  const startDay = currentMonth.startOf("month").startOf("week");
  const endDay = currentMonth.endOf("month").endOf("week");

  const calendar: dayjs.Dayjs[] = [];
  let day = startDay;

  while (day.isBefore(endDay, "day")) {
    calendar.push(day);
    day = day.add(1, "day");
  }

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const savedEntries = localStorage.getItem("menstrualEntries");
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    
    // Simular carga de notificaciones
    setTimeout(() => {
      checkNotifications();
    }, 1000);
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem("menstrualEntries", JSON.stringify(entries));
      calculatePredictions();
      calculateStats();
    }
  }, [entries]);

  // Función para calcular predicciones usando IA (simulada)
  const calculatePredictions = () => {
    if (entries.length < 2) {
      setPrediction(null);
      return;
    }

    // Ordenar entradas por fecha
    const sortedEntries = [...entries].sort((a, b) => 
      dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1
    );

    // Encontrar los últimos dos períodos
    const periodStarts = sortedEntries
      .filter((entry, index, arr) => {
        const prevEntry = index > 0 ? arr[index - 1] : null;
        return (entry.flow !== "none" && (!prevEntry || prevEntry.flow === "none"));
      })
      .map(entry => entry.date);

    if (periodStarts.length < 2) {
      setPrediction(null);
      return;
    }

    // Calcular longitud promedio del ciclo
    const cycleLengths = [];
    for (let i = 1; i < periodStarts.length; i++) {
      cycleLengths.push(dayjs(periodStarts[i]).diff(dayjs(periodStarts[i-1]), 'day'));
    }
    
    const avgCycleLength = Math.round(
      cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length
    );

    // Predecir próximo período
    const lastPeriodStart = periodStarts[periodStarts.length - 1];
    const nextPeriodStart = dayjs(lastPeriodStart).add(avgCycleLength, 'day');
    
    // Calcular ventana fértil y ovulación
    const ovulationDay = dayjs(nextPeriodStart).subtract(14, 'day');
    const fertileWindowStart = dayjs(ovulationDay).subtract(5, 'day');
    const fertileWindowEnd = dayjs(ovulationDay).add(1, 'day');
    
    // Calcular confianza basada en regularidad
    const stdDev = Math.sqrt(
      cycleLengths.reduce((sum, length) => sum + Math.pow(length - avgCycleLength, 2), 0) / 
      cycleLengths.length
    );
    
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev * 10)));
    
    setPrediction({
      nextPeriodStart: nextPeriodStart.format('YYYY-MM-DD'),
      fertileWindowStart: fertileWindowStart.format('YYYY-MM-DD'),
      fertileWindowEnd: fertileWindowEnd.format('YYYY-MM-DD'),
      ovulationDay: ovulationDay.format('YYYY-MM-DD'),
      confidence
    });
  };

  // Calcular estadísticas
  const calculateStats = () => {
    if (entries.length < 2) return;

    // Ordenar entradas por fecha
    const sortedEntries = [...entries].sort((a, b) => 
      dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1
    );

    // Encontrar períodos
    const periods: { start: string; end: string }[] = [];
    let currentPeriod: { start: string; end: string } | null = null;

    sortedEntries.forEach((entry, index) => {
      if (entry.flow !== "none") {
        if (!currentPeriod) {
          currentPeriod = { start: entry.date, end: entry.date };
        } else {
          currentPeriod.end = entry.date;
        }
      } else if (currentPeriod) {
        periods.push(currentPeriod);
        currentPeriod = null;
      }
    });

    if (currentPeriod) {
      periods.push(currentPeriod);
    }

    // Calcular longitud promedio del ciclo
    const cycleLengths = [];
    for (let i = 1; i < periods.length; i++) {
      cycleLengths.push(dayjs(periods[i].start).diff(dayjs(periods[i-1].start), 'day'));
    }
    
    const averageCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
      : 0;

    // Calcular longitud promedio del período
    const periodLengths = periods.map(period => 
      dayjs(period.end).diff(dayjs(period.start), 'day') + 1
    );
    
    const averagePeriodLength = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length)
      : 0;

    // Encontrar síntomas comunes
    const symptomCounts: Record<Symptom, number> = {
      cramps: 0, headache: 0, bloating: 0, fatigue: 0, acne: 0, backache: 0, nausea: 0, other: 0
    };
    
    entries.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        symptomCounts[symptom]++;
      });
    });
    
    const commonSymptoms = Object.entries(symptomCounts)
      .filter(([_, count]) => count > 0)
      .sort(([_, countA], [__, countB]) => countB - countA)
      .slice(0, 3)
      .map(([symptom]) => symptom as Symptom);

    // Encontrar estado de ánimo común
    const moodCounts: Record<MoodType, number> = {
      happy: 0, sad: 0, irritable: 0, anxious: 0, neutral: 0, energetic: 0, tired: 0
    };
    
    entries.forEach(entry => {
      moodCounts[entry.mood]++;
    });
    
    const commonMood = Object.entries(moodCounts)
      .sort(([_, countA], [__, countB]) => countB - countA)[0][0] as MoodType;

    setStats({
      averageCycleLength,
      averagePeriodLength,
      commonSymptoms,
      commonMood
    });
  };

  // Verificar notificaciones
  const checkNotifications = () => {
    if (!prediction) return;
    
    const today = dayjs();
    
    notificationSettings.forEach(setting => {
      if (!setting.enabled) return;
      
      let targetDate;
      let message = "";
      
      if (setting.type === "period") {
        targetDate = dayjs(prediction.nextPeriodStart);
        message = `Tu período probablemente comenzará en ${setting.daysInAdvance} días`;
      } else if (setting.type === "fertile") {
        targetDate = dayjs(prediction.fertileWindowStart);
        message = `Tu ventana fértil comenzará en ${setting.daysInAdvance} días`;
      } else if (setting.type === "ovulation") {
        targetDate = dayjs(prediction.ovulationDay);
        message = `Tu día de ovulación será en ${setting.daysInAdvance} días`;
      }
      
      if (targetDate && today.add(setting.daysInAdvance, 'day').isSame(targetDate, 'day')) {
        toast(message, {
          icon: '🔔',
          duration: 5000,
        });
      }
    });
  };

  // Funciones para manejar la interfaz
  const getFlowColor = (flow: FlowLevel) => {
    switch (flow) {
      case "light":
        return "bg-pink-200";
      case "medium":
        return "bg-pink-400";
      case "heavy":
        return "bg-pink-600";
      default:
        return "bg-gray-light";
    }
  };

  const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

  const selectedEntry = entries.find((e) => e.date === selectedDate.format("YYYY-MM-DD"));

  const handleSaveEntry = () => {
    const date = selectedDate.format("YYYY-MM-DD");
    const entryIndex = entries.findIndex(e => e.date === date);
    
    const fullEntry: DayEntry = {
      date,
      flow: newEntry.flow as FlowLevel || "none",
      symptoms: newEntry.symptoms as Symptom[] || [],
      mood: newEntry.mood as MoodType || "neutral",
      notes: newEntry.notes || ""
    };
    
    if (entryIndex >= 0) {
      const updatedEntries = [...entries];
      updatedEntries[entryIndex] = fullEntry;
      setEntries(updatedEntries);
    } else {
      setEntries([...entries, fullEntry]);
    }
    
    setShowEntryForm(false);
    toast.success('Entrada guardada correctamente');
  };

  const handleToggleSymptom = (symptom: Symptom) => {
    const currentSymptoms = newEntry.symptoms || [];
    if (currentSymptoms.includes(symptom)) {
      setNewEntry({
        ...newEntry,
        symptoms: currentSymptoms.filter(s => s !== symptom)
      });
    } else {
      setNewEntry({
        ...newEntry,
        symptoms: [...currentSymptoms, symptom]
      });
    }
  };

  const handleDeleteEntry = () => {
    const date = selectedDate.format("YYYY-MM-DD");
    setEntries(entries.filter(e => e.date !== date));
    setShowEntryForm(false);
    toast.success('Entrada eliminada correctamente');
  };

  const handleToggleNotification = (type: "period" | "fertile" | "ovulation") => {
    setNotificationSettings(settings => 
      settings.map(setting => 
        setting.type === type 
          ? { ...setting, enabled: !setting.enabled } 
          : setting
      )
    );
  };

  const getDayClass = (dayItem: dayjs.Dayjs) => {
    const isToday = dayItem.isSame(dayjs(), "day");
    const isSelected = dayItem.isSame(selectedDate, "day");
    const entry = entries.find((e) => e.date === dayItem.format("YYYY-MM-DD"));
    const isPredictedPeriod = prediction && 
      dayjs(dayItem).isSame(dayjs(prediction.nextPeriodStart), 'day');
    const isFertileDay = prediction && 
      dayjs(dayItem).isAfter(dayjs(prediction.fertileWindowStart).subtract(1, 'day'), 'day') && 
      dayjs(dayItem).isBefore(dayjs(prediction.fertileWindowEnd).add(1, 'day'), 'day');
    const isOvulationDay = prediction && 
      dayjs(dayItem).isSame(dayjs(prediction.ovulationDay), 'day');
    
    let classes = "cursor-pointer p-2 rounded-lg transition-all border ";
    
    if (isSelected) {
      classes += "border-accent ";
    } else {
      classes += "border-transparent ";
    }
    
    if (isToday) {
      classes += "ring-2 ring-primary-light ";
    }
    
    if (dayItem.month() !== currentMonth.month()) {
      classes += "text-gray-light ";
    } else {
      classes += "text-text-primary ";
    }
    
    if (isPredictedPeriod && !entry) {
      classes += "bg-pink-100 ";
    }
    
    if (isFertileDay && !entry && !isPredictedPeriod) {
      classes += "bg-green-100 ";
    }
    
    if (isOvulationDay && !entry && !isPredictedPeriod) {
      classes += "bg-purple-100 ";
    }
    
    classes += "flex flex-col items-center justify-center";
    
    return classes;
  };

  const getDayIndicator = (dayItem: dayjs.Dayjs) => {
    const entry = entries.find((e) => e.date === dayItem.format("YYYY-MM-DD"));
    const isPredictedPeriod = prediction && 
      dayjs(dayItem).isSame(dayjs(prediction.nextPeriodStart), 'day');
    const isFertileDay = prediction && 
      dayjs(dayItem).isAfter(dayjs(prediction.fertileWindowStart).subtract(1, 'day'), 'day') && 
      dayjs(dayItem).isBefore(dayjs(prediction.fertileWindowEnd).add(1, 'day'), 'day');
    const isOvulationDay = prediction && 
      dayjs(dayItem).isSame(dayjs(prediction.ovulationDay), 'day');
    
    if (entry) {
      return <div className={`w-3 h-3 rounded-full mt-1 ${getFlowColor(entry.flow)}`}></div>;
    } else if (isPredictedPeriod) {
      return <div className="w-3 h-3 rounded-full mt-1 bg-pink-300 border border-pink-500 opacity-70"></div>;
    } else if (isOvulationDay) {
      return <div className="w-3 h-3 rounded-full mt-1 bg-purple-300 border border-purple-500 opacity-70"></div>;
    } else if (isFertileDay) {
      return <div className="w-3 h-3 rounded-full mt-1 bg-green-300 border border-green-500 opacity-70"></div>;
    }
    
    return null;
  };

  return (
    <main className="min-h-screen bg-light px-4 py-8 font-family-base">
      <section className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-md bg-primary-light text-white hover:bg-primary transition"
          >
            <Icons.ChevronLeft />
          </button>
          <h1 className="text-xl font-bold text-primary">
            {currentMonth.format("MMMM YYYY")}
          </h1>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-md bg-primary-light text-white hover:bg-primary transition"
          >
            <Icons.ChevronRight />
          </button>
        </div>

        {/* Leyenda */}
        <div className="flex justify-center gap-4 mb-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-pink-400 mr-1"></div>
            <span>Período</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-pink-300 border border-pink-500 opacity-70 mr-1"></div>
            <span>Predicción período</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-300 border border-green-500 opacity-70 mr-1"></div>
            <span>Días fértiles</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-300 border border-purple-500 opacity-70 mr-1"></div>
            <span>Ovulación</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 text-center mb-6">
          {["D", "L", "M", "M", "J", "V", "S"].map((d) => (
            <div key={d} className="font-semibold text-text-secondary">
              {d}
            </div>
          ))}
          {calendar.map((dayItem) => (
            <div
              key={dayItem.toString()}
              onClick={() => {
                setSelectedDate(dayItem);
                setNewEntry({
                  flow: selectedEntry?.flow || "none",
                  symptoms: selectedEntry?.symptoms || [],
                  mood: selectedEntry?.mood || "neutral",
                  notes: selectedEntry?.notes || "",
                });
              }}
              className={getDayClass(dayItem)}
            >
              <span>{dayItem.date()}</span>
              {getDayIndicator(dayItem)}
            </div>
          ))}
        </div>

        {/* Selected Day Details */}
        {!showEntryForm && !showPredictions && !showNotificationSettings && (
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-lg font-bold text-primary mb-2">
              {selectedDate.format("DD MMMM YYYY")}
            </h2>
            
            {selectedEntry ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-primary">Flujo:</p>
                    <p className="capitalize">{selectedEntry.flow}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Estado de ánimo:</p>
                    <p className="capitalize">{selectedEntry.mood}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="font-semibold text-primary">Síntomas:</p>
                  <p>{selectedEntry.symptoms.length > 0 
                    ? selectedEntry.symptoms.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ") 
                    : "Ninguno"}
                  </p>
                </div>
                
                {selectedEntry.notes && (
                  <div className="mb-4">
                    <p className="font-semibold text-primary">Notas:</p>
                    <p className="text-sm">{selectedEntry.notes}</p>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => setShowEntryForm(true)}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition"
                  >
                    Editar entrada
                  </button>
                  <button 
                    onClick={handleDeleteEntry}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray mb-4">No hay datos para este día</p>
                <button 
                  onClick={() => setShowEntryForm(true)}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition"
                >
                  Añadir entrada
                </button>
              </div>
            )}
          </div>
        )}

        {/* Formulario para añadir/editar entrada */}
        {showEntryForm && (
          <div className="bg-white shadow-lg rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-primary">
                {selectedEntry ? "Editar entrada" : "Nueva entrada"} - {selectedDate.format("DD MMMM YYYY")}
              </h2>
              <button 
                onClick={() => setShowEntryForm(false)}
                className="text-gray hover:text-primary"
              >
                <Icons.X />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block font-semibold text-primary mb-2">Nivel de flujo</label>
              <div className="grid grid-cols-4 gap-2">
                {(["none", "light", "medium", "heavy"] as FlowLevel[]).map(flow => (
                  <button
                    key={flow}
                    onClick={() => setNewEntry({...newEntry, flow})}
                    className={`p-2 rounded-lg border ${
                      newEntry.flow === flow 
                        ? "border-accent bg-accent text-white" 
                        : "border-gray-light hover:border-accent"
                    }`}
                  >
                    {flow === "none" ? "Ninguno" : 
                     flow === "light" ? "Ligero" : 
                     flow === "medium" ? "Medio" : "Abundante"}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block font-semibold text-primary mb-2">Síntomas</label>
              <div className="grid grid-cols-4 gap-2">
                {(["cramps", "headache", "bloating", "fatigue", "acne", "backache", "nausea", "other"] as Symptom[]).map(symptom => (
                  <button
                    key={symptom}
                    onClick={() => handleToggleSymptom(symptom)}
                    className={`p-2 rounded-lg border ${
                      newEntry.symptoms?.includes(symptom)
                        ? "border-accent bg-accent text-white" 
                        : "border-gray-light hover:border-accent"
                    }`}
                  >
                    {symptom === "cramps" ? "Cólicos" : 
                     symptom === "headache" ? "Dolor de cabeza" : 
                     symptom === "bloating" ? "Hinchazón" : 
                     symptom === "fatigue" ? "Fatiga" : 
                     symptom === "acne" ? "Acné" : 
                     symptom === "backache" ? "Dolor de espalda" : 
                     symptom === "nausea" ? "Náuseas" : "Otro"}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block font-semibold text-primary mb-2">Estado de ánimo</label>
              <div className="grid grid-cols-4 gap-2">
                {(["happy", "sad", "irritable", "anxious", "neutral", "energetic", "tired"] as MoodType[]).map(mood => (
                  <button
                    key={mood}
                    onClick={() => setNewEntry({...newEntry, mood})}
                    className={`p-2 rounded-lg border ${
                      newEntry.mood === mood 
                        ? "border-accent bg-accent text-white" 
                        : "border-gray-light hover:border-accent"
                    }`}
                  >
                    {mood === "happy" ? "Feliz" : 
                     mood === "sad" ? "Triste" : 
                     mood === "irritable" ? "Irritable" : 
                     mood === "anxious" ? "Ansiosa" : 
                     mood === "neutral" ? "Neutral" : 
                     mood === "energetic" ? "Energética" : "Cansada"}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block font-semibold text-primary mb-2">Notas</label>
              <textarea
                value={newEntry.notes || ""}
                onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                className="w-full p-2 border border-gray-light rounded-lg focus:border-accent focus:outline-none"
                rows={3}
                placeholder="Añade notas adicionales aquí..."
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowEntryForm(false)}
                className="px-4 py-2 border border-gray-light rounded-lg hover:bg-gray-light transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEntry}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Predicciones */}
        {showPredictions && (
          <div className="bg-white shadow-lg rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-primary">Predicciones de tu ciclo</h2>
              <button 
                onClick={() => setShowPredictions(false)}
                className="text-gray hover:text-primary"
              >
                <Icons.X />
              </button>
            </div>
            
            {prediction ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-4 h-4 rounded-full bg-pink-400 mr-2"></div>
                    <h3 className="font-semibold">Próximo período</h3>
                  </div>
                  <p className="ml-6">
                    Fecha estimada: <span className="font-semibold">{dayjs(prediction.nextPeriodStart).format("DD MMMM YYYY")}</span>
                  </p>
                  <p className="ml-6 text-sm text-gray">
                    Confianza: {Math.round(prediction.confidence)}%
                  </p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-4 h-4 rounded-full bg-green-400 mr-2"></div>
                    <h3 className="font-semibold">Ventana fértil</h3>
                  </div>
                  <p className="ml-6">
                    Desde <span className="font-semibold">{dayjs(prediction.fertileWindowStart).format("DD MMMM")}</span> hasta <span className="font-semibold">{dayjs(prediction.fertileWindowEnd).format("DD MMMM YYYY")}</span>
                  </p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-4 h-4 rounded-full bg-purple-400 mr-2"></div>
                    <h3 className="font-semibold">Día de ovulación</h3>
                  </div>
                  <p className="ml-6">
                    <span className="font-semibold">{dayjs(prediction.ovulationDay).format("DD MMMM YYYY")}</span>
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-primary mb-2">Estadísticas de tu ciclo</h3>
                  <ul className="space-y-2">
                    <li>Duración promedio del ciclo: <span className="font-semibold">{stats.averageCycleLength} días</span></li>
                    <li>Duración promedio del período: <span className="font-semibold">{stats.averagePeriodLength} días</span></li>
                    <li>Síntomas más comunes: <span className="font-semibold">
                      {stats.commonSymptoms.length > 0 
                        ? stats.commonSymptoms.map(s => 
                            s === "cramps" ? "Cólicos" : 
                            s === "headache" ? "Dolor de cabeza" : 
                            s === "bloating" ? "Hinchazón" : 
                            s === "fatigue" ? "Fatiga" : 
                            s === "acne" ? "Acné" : 
                            s === "backache" ? "Dolor de espalda" : 
                            s === "nausea" ? "Náuseas" : "Otro"
                          ).join(", ") 
                        : "Ninguno"}
                    </span></li>
                    <li>Estado de ánimo más común: <span className="font-semibold">
                      {stats.commonMood === "happy" ? "Feliz" : 
                       stats.commonMood === "sad" ? "Triste" : 
                       stats.commonMood === "irritable" ? "Irritable" : 
                       stats.commonMood === "anxious" ? "Ansiosa" : 
                       stats.commonMood === "neutral" ? "Neutral" : 
                       stats.commonMood === "energetic" ? "Energética" : "Cansada"}
                    </span></li>
                  </ul>
                </div>
                
                <p className="text-sm text-gray mt-4">
                  Nota: Estas predicciones se basan en tus datos históricos. Cuantos más datos registres, más precisas serán las predicciones.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray mb-4">
                  No hay suficientes datos para generar predicciones. Registra al menos dos períodos para obtener predicciones.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Configuración de notificaciones */}
        {showNotificationSettings && (
          <div className="bg-white shadow-lg rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-primary">Configuración de notificaciones</h2>
              <button 
                onClick={() => setShowNotificationSettings(false)}
                className="text-gray hover:text-primary"
              >
                <Icons.X />
              </button>
            </div>
            
            <div className="space-y-4">
              {notificationSettings.map((setting, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-light rounded-lg">
                  <div>
                    <p className="font-semibold">
                      {setting.type === "period" ? "Notificación de período" : 
                       setting.type === "fertile" ? "Notificación de días fértiles" : 
                       "Notificación de ovulación"}
                    </p>
                    <p className="text-sm text-gray">
                      {setting.daysInAdvance} {setting.daysInAdvance === 1 ? "día" : "días"} antes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={setting.enabled}
                      onChange={() => handleToggleNotification(setting.type)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              ))}
              
              <div className="mt-4">
                <p className="text-sm text-gray">
                  Las notificaciones se mostrarán en la aplicación y, si lo permites, también como notificaciones del navegador.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add / Prediction */}
        <div className="mt-8 flex flex-col gap-4">
          <button 
            onClick={() => {
              setShowEntryForm(true);
              setShowPredictions(false);
              setShowNotificationSettings(false);
              setSelectedDate(dayjs());
              setNewEntry({
                flow: "none",
                symptoms: [],
                mood: "neutral",
                notes: "",
              });
            }}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition"
          >
            Registrar síntomas para hoy
          </button>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                setShowPredictions(true);
                setShowEntryForm(false);
                setShowNotificationSettings(false);
              }}
              className="py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-light hover:text-white transition"
            >
              Ver predicciones de ciclo
            </button>
            <button 
              onClick={() => {
                setShowNotificationSettings(true);
                setShowEntryForm(false);
                setShowPredictions(false);
              }}
              className="py-3 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent-light hover:text-white transition"
            >
              Configurar notificaciones
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}