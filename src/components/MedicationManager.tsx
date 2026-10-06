import React, { useState } from 'react';
import { Medication, MedicationCategory, AfetivoEntry } from '../types/mood';
import { Pill, Plus, Trash2, Edit2 } from 'lucide-react';

interface Props {
  medications: Medication[];
  entries: AfetivoEntry[];
  onUpdateMedications: (meds: Medication[]) => void;
}

const CATEGORY_LABELS: Record<MedicationCategory, string> = {
  mood_stabilizer: 'Estabilidade & Equilíbrio',
  antidepressant: 'Uso Contínuo / Rotina',
  anxiolytic: 'Momento Pontual / SOS',
  sleep_aid: 'Sono & Relaxamento',
  supplement: 'Suplemento / Vitaminas',
  routine: 'Hábito & Autocuidado',
  other: 'Outro',
};

export const MedicationManager: React.FC<Props> = ({
  medications,
  entries,
  onUpdateMedications,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MedicationCategory>('mood_stabilizer');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<'daily_morning' | 'daily_night' | 'twice_daily' | 'as_needed'>('daily_night');
  const [notes, setNotes] = useState('');

  // Calculate consistency across all entries
  let totalDosesPrescribed = 0;
  let totalDosesTaken = 0;
  let totalDosesSkipped = 0;

  entries.forEach((e) => {
    e.medicationIntakes?.forEach((m) => {
      totalDosesPrescribed++;
      if (m.status === 'taken' || m.status === 'delayed') totalDosesTaken++;
      if (m.status === 'skipped') totalDosesSkipped++;
    });
  });

  const consistencyRate = totalDosesPrescribed > 0 ? Math.round((totalDosesTaken / totalDosesPrescribed) * 100) : 100;

  const handleSaveMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const updated = medications.map((m) =>
        m.id === editingId
          ? {
              ...m,
              name: name.trim(),
              category,
              dosage: dosage.trim(),
              frequency,
              notes: notes.trim() || undefined,
            }
          : m
      );
      onUpdateMedications(updated);
      setEditingId(null);
    } else {
      const newMed: Medication = {
        id: `med-${Date.now()}`,
        name: name.trim(),
        category,
        dosage: dosage.trim() || 'Dose padrão',
        frequency,
        notes: notes.trim() || undefined,
        active: true,
      };
      onUpdateMedications([...medications, newMed]);
    }

    setName('');
    setDosage('');
    setNotes('');
    setIsAdding(false);
  };

  const handleStartEdit = (med: Medication) => {
    setEditingId(med.id);
    setName(med.name);
    setCategory(med.category);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setNotes(med.notes || '');
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja remover este item da lista?')) {
      onUpdateMedications(medications.filter((m) => m.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = medications.map((m) =>
      m.id === id ? { ...m, active: !m.active } : m
    );
    onUpdateMedications(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-0.5">
            <span>Acompanhamento da Rotina</span>
            <span aria-hidden="true">·</span>
            <span>Medicações & Suplementos</span>
          </div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Registro de Medicações & Hábitos
          </h2>
          <p className="text-xs text-stone-500 max-w-xl mt-1">
            Cadastre os medicamentos ou suplementos que fazem parte da sua rotina. O sistema ajuda a observar se dias com horários alterados ou esquecimentos coincidiram com oscilações no sono ou impulsos.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-stone-400">Regularidade de Tomada</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {consistencyRate}%
            </div>
            <div className="text-[11px] text-stone-400">
              {totalDosesSkipped} dias não tomados no histórico
            </div>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setName('');
              setDosage('');
              setNotes('');
              setIsAdding(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Item</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSaveMed}
          className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {editingId ? 'Editar Item' : 'Cadastrar Novo Item'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
                Nome do Remédio ou Suplemento *
              </label>
              <input
                type="text"
                placeholder="Ex: Regulador, Melatonina, Vitamina D..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
                Dosagem
              </label>
              <input
                type="text"
                placeholder="Ex: 300mg, 50mg, 1 cápsula..."
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MedicationCategory)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
              >
                {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                  <option key={cat} value={cat}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
                Horário habitual
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
              >
                <option value="daily_morning">Manhã (após café)</option>
                <option value="daily_night">Noite (antes de dormir)</option>
                <option value="twice_daily">2x ao dia (Manhã e Noite)</option>
                <option value="as_needed">SOS / Apenas quando necessário</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
                Observações ou orientações
              </label>
              <input
                type="text"
                placeholder="Ex: Tomar após refeição; para ajudar a relaxar à noite..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-teal-800 hover:bg-teal-900 rounded-lg cursor-pointer"
            >
              Salvar Item
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medications.map((med) => (
          <div
            key={med.id}
            className={`p-5 rounded-2xl border transition-all ${
              med.active
                ? 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 shadow-xs'
                : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-900/60 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    {med.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span className="font-mono text-stone-700 dark:text-stone-300 font-medium">
                      {med.dosage}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{CATEGORY_LABELS[med.category]}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStartEdit(med)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(med.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-stone-500">
                Horário: {med.frequency === 'daily_morning' ? 'Manhã' : med.frequency === 'daily_night' ? 'Noite' : med.frequency === 'twice_daily' ? '2x ao dia' : 'SOS (Se necessário)'}
              </span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={med.active}
                  onChange={() => handleToggleActive(med.id)}
                  className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[11px] text-stone-500">
                  {med.active ? 'Uso ativo' : 'Pausado'}
                </span>
              </label>
            </div>

            {med.notes && (
              <div className="mt-2 text-[11px] text-stone-500 italic">
                Nota: {med.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
