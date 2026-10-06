import { useState } from 'react';
import { X } from 'lucide-react';
import type { Impulse, PhysicalActivity, Tag, TagKind } from '@/core/entry';
import { TAG_KINDS } from '@/core/entry';
import { ACTIVITY_INTENSITY_LABELS, OUTCOME_LABELS, TAG_KIND_LABELS } from '@/core/labels';
import { Button, Field, inputClass } from '@/components/ui';

/** Tags do registro: add por tipo + label, remove em um toque. */
export function TagEditor({ tags, onChange }: { tags: Tag[]; onChange: (tags: Tag[]) => void }) {
  const [kind, setKind] = useState<TagKind>('emotion');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addTag(): void {
    const clean = label.trim();
    if (clean === '') {
      setError('Escreva a tag antes de adicionar.');
      return;
    }
    const duplicate = tags.some(
      (tag) => tag.kind === kind && tag.label.toLowerCase() === clean.toLowerCase(),
    );
    if (duplicate) {
      setError('Essa tag já está marcada.');
      return;
    }
    setError(null);
    onChange([...tags, { kind, label: clean }]);
    setLabel('');
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nova tag" error={error ?? undefined}>
          {(control) => (
            <input
              {...control}
              className={inputClass}
              value={label}
              maxLength={200}
              placeholder="Ex.: reunião tensa"
              onChange={(event) => {
                setLabel(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTag();
                }
              }}
            />
          )}
        </Field>
        <Field label="Tipo de tag">
          {(control) => (
            <select
              {...control}
              className={inputClass}
              value={kind}
              onChange={(event) => setKind(event.target.value as TagKind)}
            >
              {TAG_KINDS.map((value) => (
                <option key={value} value={value}>
                  {TAG_KIND_LABELS[value]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={addTag}>Adicionar tag</Button>
        {tags.length === 0 && <span className="text-sm text-ink-muted">Nenhuma tag ainda.</span>}
      </div>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <li
              key={`${tag.kind}:${tag.label}`}
              className="flex items-center gap-1.5 rounded-full border border-edge bg-panel-2 py-1 pl-3 pr-1.5 text-sm"
            >
              <span className="text-ink-muted">{tag.label}</span>
              <span className="text-xs text-ink-muted">· {TAG_KIND_LABELS[tag.kind]}</span>
              <button
                type="button"
                aria-label={`Remover tag ${tag.label}`}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-panel hover:text-danger"
                onClick={() => onChange(tags.filter((_, i) => i !== index))}
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Impulsos/compulsões: linhas editáveis com tipo, intensidade e desfecho. */
export function ImpulseEditor({
  impulses,
  onChange,
}: {
  impulses: Impulse[];
  onChange: (impulses: Impulse[]) => void;
}) {
  function addImpulse(): void {
    onChange([
      ...impulses,
      {
        id: crypto.randomUUID(),
        type: '',
        intensity: null,
        outcome: null,
        resisted: null,
        copingUsed: null,
        trigger: null,
        consequence: null,
        reflection: null,
      },
    ]);
  }

  function update(id: string, patch: Partial<Impulse>): void {
    onChange(impulses.map((impulse) => (impulse.id === id ? { ...impulse, ...patch } : impulse)));
  }

  return (
    <div className="space-y-3">
      {impulses.map((impulse, index) => (
        <div key={impulse.id} className="space-y-3 rounded-xl border border-edge p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Impulso {index + 1}</p>
            <button
              type="button"
              aria-label={`Remover impulso ${index + 1}`}
              className="min-h-11 rounded-lg px-2 text-sm text-danger hover:bg-danger/10"
              onClick={() => onChange(impulses.filter((item) => item.id !== impulse.id))}
            >
              Remover
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tipo de impulso">
              {(control) => (
                <input
                  {...control}
                  className={inputClass}
                  value={impulse.type}
                  maxLength={120}
                  placeholder="Ex.: compras por impulso"
                  onChange={(event) => update(impulse.id, { type: event.target.value })}
                />
              )}
            </Field>

            <Field label="Intensidade (1–5)">
              {(control) => (
                <select
                  {...control}
                  className={inputClass}
                  value={impulse.intensity ?? ''}
                  onChange={(event) =>
                    update(impulse.id, {
                      intensity: event.target.value === '' ? null : Number(event.target.value),
                    })
                  }
                >
                  <option value="">Não informado</option>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Desfecho">
              {(control) => (
                <select
                  {...control}
                  className={inputClass}
                  value={impulse.outcome ?? ''}
                  onChange={(event) =>
                    update(impulse.id, {
                      outcome: (event.target.value || null) as Impulse['outcome'],
                    })
                  }
                >
                  <option value="">Não informado</option>
                  {Object.entries(OUTCOME_LABELS).map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Gatilho">
              {(control) => (
                <input
                  {...control}
                  className={inputClass}
                  value={impulse.trigger ?? ''}
                  maxLength={500}
                  placeholder="O que veio antes?"
                  onChange={(event) => update(impulse.id, { trigger: event.target.value || null })}
                />
              )}
            </Field>

            <Field label="O que usei para lidar">
              {(control) => (
                <input
                  {...control}
                  className={inputClass}
                  value={impulse.copingUsed ?? ''}
                  maxLength={500}
                  placeholder="Estratégia, pausa, pessoa de apoio…"
                  onChange={(event) =>
                    update(impulse.id, { copingUsed: event.target.value || null })
                  }
                />
              )}
            </Field>

            <Field label="Consequência">
              {(control) => (
                <input
                  {...control}
                  className={inputClass}
                  value={impulse.consequence ?? ''}
                  maxLength={500}
                  placeholder="O que aconteceu depois?"
                  onChange={(event) =>
                    update(impulse.id, { consequence: event.target.value || null })
                  }
                />
              )}
            </Field>
          </div>

          <Field label="Reflexão">
            {(control) => (
              <textarea
                {...control}
                className="w-full min-h-20 rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted"
                value={impulse.reflection ?? ''}
                maxLength={1000}
                placeholder="Opcional"
                onChange={(event) => update(impulse.id, { reflection: event.target.value || null })}
              />
            )}
          </Field>
        </div>
      ))}

      <Button variant="secondary" onClick={addImpulse}>
        Adicionar impulso
      </Button>
    </div>
  );
}

/** Atividades físicas do registro (linhas editáveis). */
export function ActivityEditor({
  activities,
  onChange,
}: {
  activities: PhysicalActivity[];
  onChange: (activities: PhysicalActivity[]) => void;
}) {
  function update(index: number, patch: Partial<PhysicalActivity>): void {
    onChange(activities.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div
          key={`${index}:${activity.type}`}
          className="grid gap-3 rounded-xl border border-edge p-3 sm:grid-cols-2"
        >
          <Field label="Tipo de atividade">
            {(control) => (
              <input
                {...control}
                className={inputClass}
                value={activity.type}
                maxLength={80}
                placeholder="Ex.: caminhada"
                onChange={(event) => update(index, { type: event.target.value })}
              />
            )}
          </Field>

          <Field label="Duração (minutos)">
            {(control) => (
              <input
                {...control}
                type="number"
                min={1}
                max={1440}
                step={1}
                className={inputClass}
                value={activity.durationMinutes ?? ''}
                onChange={(event) =>
                  update(index, {
                    durationMinutes: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
              />
            )}
          </Field>

          <Field label="Intensidade">
            {(control) => (
              <select
                {...control}
                className={inputClass}
                value={activity.intensity ?? ''}
                onChange={(event) =>
                  update(index, {
                    intensity: (event.target.value || null) as PhysicalActivity['intensity'],
                  })
                }
              >
                <option value="">Não informado</option>
                {Object.entries(ACTIVITY_INTENSITY_LABELS).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Como me senti depois">
            {(control) => (
              <input
                {...control}
                className={inputClass}
                value={activity.postFeeling ?? ''}
                maxLength={300}
                placeholder="Opcional"
                onChange={(event) => update(index, { postFeeling: event.target.value || null })}
              />
            )}
          </Field>

          <div className="sm:col-span-2">
            <button
              type="button"
              aria-label={`Remover atividade ${index + 1}`}
              className="min-h-11 rounded-lg px-2 text-sm text-danger hover:bg-danger/10"
              onClick={() => onChange(activities.filter((_, i) => i !== index))}
            >
              Remover atividade
            </button>
          </div>
        </div>
      ))}

      <Button
        variant="secondary"
        onClick={() =>
          onChange([
            ...activities,
            { type: '', durationMinutes: null, intensity: null, postFeeling: null },
          ])
        }
      >
        Adicionar atividade
      </Button>
    </div>
  );
}
