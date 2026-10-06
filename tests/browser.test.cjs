const assert = require('node:assert/strict');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const { chromium } = require('playwright');
const { existsSync } = require('node:fs');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createServer } = require('node:net');

let browser, server, base, context, page, errors;
before(async () => {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    {
      env: { ...process.env, DISABLE_HMR: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Server startup timed out')),
      15000,
    );
    server.once('error', reject);
    server.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited (${code})`));
    });
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('Local:')) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  const executablePath =
    process.env.CHROMIUM_EXECUTABLE_PATH ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox'],
  });
});
after(async () => {
  await browser?.close();
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
});
beforeEach(async () => {
  context = await browser.newContext({ timezoneId: 'America/Fortaleza' });
  page = await context.newPage();
  page.setDefaultTimeout(8000);
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Every destructive action must use the application's confirmation UI.
  await page.addInitScript(() => {
    window.confirm = () => {
      throw new Error('Unexpected native confirmation');
    };
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await seed('demo');
});
afterEach(async () => {
  await context.close();
  assert.deepEqual(errors, []);
});

async function medications() {
  await page
    .getByRole('button', { name: 'Medicações & Rotina', exact: true })
    .click();
}
async function approve(target = page) {
  await target
    .getByRole('dialog', { name: 'Confirmar ação' })
    .getByRole('button', { name: 'Confirmar', exact: true })
    .click();
}
async function data(key) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
}
async function seed(operation) {
  await page.evaluate(async (operation) => {
    const s = await import('/src/services/storage.ts');
    operation === 'clear' ? s.clearAllUserData() : s.resetAllDataToDemo();
  }, operation);
  await page.reload({ waitUntil: 'networkidle' });
}

test('medication delete can be cancelled or confirmed and persists after reload', async () => {
  await medications();
  const deletes = page.locator('button[title="Excluir"]');
  await deletes.first().click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancelar', exact: true })
    .click();
  assert.equal(await deletes.count(), 3);
  await deletes.first().click();
  await approve();
  assert.equal(await deletes.count(), 2);
  await page.reload({ waitUntil: 'networkidle' });
  await medications();
  assert.equal(await deletes.count(), 2);
  while (await deletes.count()) {
    await deletes.first().click();
    await approve();
  }
  await page.reload({ waitUntil: 'networkidle' });
  await medications();
  assert.equal(await deletes.count(), 0);
});

test('delete works inside a sandboxed iframe without allow-modals', async () => {
  await page.setContent(
    `<iframe src="${base}" sandbox="allow-scripts allow-same-origin" style="width:1100px;height:900px"></iframe>`,
  );
  const frame = page.frameLocator('iframe');
  await frame
    .getByRole('button', { name: 'Medicações & Rotina', exact: true })
    .click();
  await frame.locator('button[title="Excluir"]').first().click();
  await approve(frame);
  assert.equal(await frame.locator('button[title="Excluir"]').count(), 2);
});

test('medication add, edit, pause and new-entry intake selection work', async () => {
  await seed('clear');
  await medications();
  await page
    .getByRole('button', { name: 'Adicionar Item', exact: true })
    .click();
  await page
    .getByPlaceholder('Ex: Regulador, Melatonina, Vitamina D...')
    .fill('Rotina de teste');
  await page.getByRole('button', { name: 'Salvar Item', exact: true }).click();
  await page
    .getByRole('button', { name: 'Editar Rotina de teste', exact: true })
    .click();
  await page
    .getByPlaceholder('Ex: Regulador, Melatonina, Vitamina D...')
    .fill('Rotina editada');
  await page.getByRole('button', { name: 'Salvar Item', exact: true }).click();
  await page
    .getByRole('checkbox', { name: 'Uso ativo', exact: true })
    .uncheck();
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  const entries = await data('afetivo_entries_v2');
  assert.deepEqual(entries[0].medicationIntakes, []);
  assert.equal(
    (await data('afetivo_medications_v2'))[0].name,
    'Rotina editada',
  );
});

test('clear, restore demonstration and journal deletion survive reload', async () => {
  await page.getByRole('button', { name: 'Limpar Tudo', exact: true }).click();
  await approve();
  await page.reload({ waitUntil: 'networkidle' });
  assert.deepEqual(await data('afetivo_entries_v2'), []);
  assert.deepEqual(await data('afetivo_medications_v2'), []);
  await page
    .getByRole('button', { name: 'Restaurar Demonstração', exact: true })
    .click();
  await approve();
  await page
    .getByRole('button', { name: 'Diário & Histórico', exact: true })
    .click();
  await page.locator('button[title="Excluir registro"]').first().click();
  await approve();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal((await data('afetivo_entries_v2')).length, 13);
});

test('new records are blank and opening optional sections does not create answers', async () => {
  await seed('clear');
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  const logger = page.getByRole('dialog', { name: 'Como está este momento?' });
  await logger.waitFor();
  assert.notEqual(await page.getByLabel('Data').inputValue(), '');
  assert.notEqual(await page.getByLabel('Horário').inputValue(), '');
  assert.equal(
    await page.getByRole('combobox', { name: 'Tipo de registro' }).count(),
    0,
  );
  assert.equal(await page.locator('details').count(), 0);
  await page
    .getByRole('button', { name: 'Adicionar mais detalhes', exact: true })
    .click();
  assert.equal(await page.locator('details').count(), 7);
  await page.getByText('Sono e disposição', { exact: true }).click();
  assert.equal(
    await page
      .getByRole('spinbutton', { name: 'Horas de sono', exact: true })
      .inputValue(),
    '',
  );
  await page.getByText('Medicações e rotina', { exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Salvo neste dispositivo.' })
    .waitFor();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  const saved = (await data('afetivo_entries_v2'))[0];
  for (const key of [
    'moodScore',
    'activationLevel',
    'energyLevel',
    'anxietyLevel',
    'irritabilityLevel',
    'sleepHours',
    'sleepQuality',
  ])
    assert.equal(saved[key], null);
  assert.deepEqual(saved.medicationIntakes, []);
  assert.deepEqual(saved.observedSections, []);
});

test('automatic draft survives closing, restores quick mode and clears after discard or save', async () => {
  await seed('clear');
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page.getByRole('button', { name: 'Agradável', exact: true }).click();
  assert.equal(
    await page.evaluate(() => localStorage.getItem('afetivo_entry_draft_v1')),
    null,
  );
  await page
    .getByRole('button', { name: 'Adicionar mais detalhes', exact: true })
    .click();
  await page.getByText('Notas livres', { exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Notas livres', exact: true })
    .fill('Uma ideia que quero retomar.');
  await page
    .getByRole('status')
    .filter({ hasText: 'Rascunho salvo neste dispositivo.' })
    .waitFor();
  await page.getByRole('button', { name: 'Fechar registro' }).click();

  const stored = await data('afetivo_entry_draft_v1');
  assert.equal(stored.version, 1);
  assert.equal(stored.entry.journalNotes, 'Uma ideia que quero retomar.');
  assert.equal(stored.showDetails, true);

  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Rascunho recuperado neste dispositivo.' })
    .waitFor();
  assert.equal(await page.locator('details').count(), 7);
  assert.equal(
    await page
      .getByRole('button', { name: 'Agradável', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  await page.getByText('Notas livres', { exact: true }).click();
  assert.equal(
    await page
      .getByRole('textbox', { name: 'Notas livres', exact: true })
      .inputValue(),
    'Uma ideia que quero retomar.',
  );
  await page
    .getByRole('button', { name: 'Descartar rascunho', exact: true })
    .click();
  await approve();
  assert.equal(await data('afetivo_entry_draft_v1'), null);
  assert.equal(await page.locator('details').count(), 0);

  await page
    .getByRole('button', { name: 'Desagradável', exact: true })
    .click();
  await page.getByRole('button', { name: 'Fechar registro' }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  assert.equal(
    (await data('afetivo_entry_draft_v1')).entry.moodScore,
    -2,
  );
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Rascunho recuperado neste dispositivo.' })
    .waitFor();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  assert.equal(await data('afetivo_entry_draft_v1'), null);
});

test('dashboard and journal empty states offer a low-friction check-in', async () => {
  await seed('clear');
  await page.getByText('Nada registrado ainda.', { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole('button', { name: 'Fazer check-in rápido', exact: true })
      .isVisible(),
    true,
  );
  await page
    .getByRole('button', { name: 'Diário & Histórico', exact: true })
    .click();
  await page
    .getByText('Quer fazer um check-in rápido? Você decide quanto responder.', {
      exact: true,
    })
    .waitFor();
  await page
    .getByRole('button', { name: 'Fazer check-in rápido', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: 'Como está este momento?' })
    .waitFor();
});

test('reminder preference is local and does not request notification permission', async () => {
  await page.addInitScript(() => {
    window.__notificationPermissionRequests = 0;
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: async () => {
          window.__notificationPermissionRequests++;
          return 'default';
        },
      },
    });
  });
  await page.reload({ waitUntil: 'networkidle' });
  await seed('clear');
  const preference = page.getByRole('checkbox', {
    name: 'Quero usar lembretes leves quando estiverem disponíveis.',
    exact: true,
  });
  await preference.check();
  await page
    .getByRole('status')
    .filter({ hasText: 'Nenhuma notificação será enviada por enquanto.' })
    .waitFor();
  assert.equal(
    (await data('afetivo_user_profile_v2')).notificationsEnabled,
    true,
  );
  assert.equal(
    await page.evaluate(() => window.__notificationPermissionRequests),
    0,
  );
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await preference.isChecked(), true);
});

test('backups download, reject invalid imports and restore valid data', async () => {
  await page
    .getByRole('button', { name: 'Backup & Exportar', exact: true })
    .click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Backup JSON Completo/ }).click();
  const file = await download;
  const { readFile } = require('node:fs/promises');
  const backup = JSON.parse(await readFile(await file.path(), 'utf8'));
  assert.equal(backup.entries.length, 14);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"entries":[null]}'),
  });
  await approve();
  await page.getByText('Item de backup inválido.', { exact: true }).waitFor();
  assert.equal((await data('afetivo_entries_v2')).length, 14);
  backup.entries = [];
  backup.medications = [];
  await page.locator('input[type="file"]').setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await approve();
  await page.getByText(/Backup restaurado com sucesso!/).waitFor();
  assert.deepEqual(await data('afetivo_entries_v2'), []);
});

test('report periods, clipboard failure and print layout behave correctly', async () => {
  await page.getByRole('button', { name: /Gerar Resumo em Texto/ }).click();
  await page
    .getByRole('button', { name: '7 Dias', exact: true })
    .last()
    .click();
  const report = page.locator('.report-print-root .whitespace-pre-wrap');
  await page.waitForFunction(() =>
    document
      .querySelector('.report-print-root .whitespace-pre-wrap')
      ?.textContent.includes('últimos 7 dias'),
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('Blocked')) },
    }),
  );
  await page.getByRole('button', { name: 'Copiar Texto', exact: true }).click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'O navegador bloqueou a cópia.' })
    .waitFor();
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('header').isVisible(), false);
  assert.equal(await report.isVisible(), true);
});

test('mobile navigation, local analysis and guide buttons work', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Medicações', exact: true }).click();
  await page
    .getByRole('button', { name: 'Adicionar Item', exact: true })
    .waitFor();
  await page.getByRole('button', { name: 'Padrões', exact: true }).click();
  await page.getByText('Cobertura dos registros', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Guia', exact: true }).click();
  await page
    .getByRole('button', { name: 'Entendido, começar a usar', exact: true })
    .click();
});

test('quick logger remains concise with 44px touch targets from 320 to 390px', async () => {
  await seed('clear');
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page
      .getByRole('button', { name: 'Novo Registro', exact: true })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Como está este momento?',
    });
    await dialog.waitFor();
    await page.getByText('Pronto para salvar', { exact: true }).waitFor();
    assert.equal(await page.locator('details').count(), 0);
    assert.equal(
      await page.getByText('Duas perguntas para começar.', { exact: false }).count(),
      0,
    );
    assert.equal(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
      true,
    );

    for (const target of [
      page.getByRole('button', { name: 'Agradável', exact: true }),
      page.getByRole('button', { name: 'Ativação 1', exact: true }),
      page.getByRole('button', { name: 'Pular humor', exact: true }),
      page.getByRole('button', { name: 'Pular ativação', exact: true }),
      page.getByRole('button', { name: 'Salvar', exact: true }),
    ]) {
      const box = await target.boundingBox();
      assert.ok(box);
      assert.ok(box.width >= 44, `${viewport.width}px: largura menor que 44px`);
      assert.ok(box.height >= 44, `${viewport.width}px: altura menor que 44px`);
      assert.ok(box.x >= 0 && box.x + box.width <= viewport.width);
    }
    await page.getByRole('button', { name: 'Fechar registro' }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
});

test('multiple moments in one day preserve both mood and activation separately', async () => {
  await seed('clear');
  for (const [mood, activation] of [
    ['Agradável', 'Ativação 1'],
    ['Desagradável', 'Ativação 5'],
  ]) {
    await page
      .getByRole('button', { name: 'Novo Registro', exact: true })
      .click();
    await page.getByRole('button', { name: mood, exact: true }).click();
    await page.getByRole('button', { name: activation, exact: true }).click();
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await page
      .getByRole('button', { name: 'Fechar registro' })
      .waitFor({ state: 'hidden' });
  }
  await page.reload({ waitUntil: 'networkidle' });
  const saved = await data('afetivo_entries_v2');
  assert.equal(saved.length, 2);
  assert.equal(saved[0].date, saved[1].date);
  assert.notEqual(saved[0].id, saved[1].id);
  assert.deepEqual(
    saved
      .map((e) => [e.moodScore, e.activationLevel])
      .sort((a, b) => a[0] - b[0]),
    [
      [-2, 5],
      [2, 1],
    ],
  );
  assert.equal(
    await page.getByText('2 registros em 1 dias', { exact: true }).isVisible(),
    true,
  );
});

test('failed writes keep the registration form and existing data intact', async () => {
  await seed('clear');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'Não foi possível salvar no navegador.' })
    .last()
    .waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Fechar registro' }).isVisible(),
    true,
  );
  assert.deepEqual(await data('afetivo_entries_v2'), []);
});

test('removing the last impulse does not recreate it when saving', async () => {
  await seed('clear');
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Adicionar mais detalhes', exact: true })
    .click();
  await page.getByText('Impulsos — sem julgamento', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Adicionar impulso', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Remover impulso', exact: true })
    .click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  assert.deepEqual(
    (await data('afetivo_entries_v2'))[0].impulsiveBehaviors,
    [],
  );
});

test('editing a historical record preserves optional fields and deleted medication history', async () => {
  const original = await data('afetivo_entries_v2');
  await page.evaluate(async () => {
    const s = await import('/src/services/storage.ts');
    s.saveMedications([]);
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: 'Diário & Histórico', exact: true })
    .click();
  await page.locator('button[title="Editar registro"]').first().click();
  await page.getByText('Medicações e rotina', { exact: true }).click();
  await page
    .getByText(/histórico \/ pausado/)
    .first()
    .waitFor();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  const saved = (await data('afetivo_entries_v2'))[0];
  const prior = original.find((entry) => entry.id === saved.id);
  assert.equal(saved.sleepLatencyMinutes, prior.sleepLatencyMinutes);
  assert.deepEqual(saved.medicationIntakes, prior.medicationIntakes);
});

test('reports stay local and explicit absent impulses differ from skipped questions', async () => {
  await seed('clear');
  let reportRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/clinical-report')) reportRequests++;
  });
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Adicionar mais detalhes', exact: true })
    .click();
  await page.getByText('Impulsos — sem julgamento', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Não percebi impulsos', exact: true })
    .click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: /Gerar Resumo em Texto/ }).click();
  await page
    .getByRole('button', { name: '7 Dias', exact: true })
    .last()
    .click();
  const report = await page
    .locator('.report-print-root .whitespace-pre-wrap')
    .innerText();
  assert.match(report, /1 respostas explícitas sem ocorrência/);
  assert.equal(reportRequests, 0);
});

test('first visit has no fictitious entries and keyboard focus returns after Escape', async () => {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  assert.deepEqual(await data('afetivo_entries_v2'), []);
  assert.deepEqual(await data('afetivo_medications_v2'), []);
  const trigger = page.getByRole('button', {
    name: 'Novo Registro',
    exact: true,
  });
  await trigger.click();
  assert.equal(
    await page
      .getByRole('dialog')
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.keyboard.press('Shift+Tab');
  assert.equal(
    await page
      .getByRole('button', { name: 'Salvar', exact: true })
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.keyboard.press('Tab');
  assert.equal(
    await page
      .getByRole('button', { name: 'Fechar registro', exact: true })
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(
    await trigger.evaluate((element) => element === document.activeElement),
    true,
  );
});

test('mobile records support context, multiple emotions, optional help and daily summaries', async () => {
  await seed('clear');
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Adicionar mais detalhes', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Tipo de registro', exact: true })
    .selectOption('daily_summary');
  await page.getByRole('button', { name: 'Neutro', exact: true }).click();
  await page.getByRole('button', { name: 'Ativação 5', exact: true }).click();
  await page.getByText('Contexto e emoções', { exact: true }).click();
  await page.getByRole('button', { name: 'Interrupções', exact: true }).click();
  await page.getByRole('button', { name: 'Frustração', exact: true }).click();
  await page.getByRole('button', { name: 'Entusiasmo', exact: true }).click();
  await page
    .getByRole('textbox', {
      name: 'Emoções (separadas por vírgula)',
      exact: true,
    })
    .press('End');
  await page
    .getByRole('textbox', {
      name: 'Emoções (separadas por vírgula)',
      exact: true,
    })
    .pressSequentially(', Curiosidade');
  await page.getByText('Apoio e próximo passo', { exact: true }).click();
  await page
    .getByRole('textbox', {
      name: 'Apoios (separados por vírgula)',
      exact: true,
    })
    .pressSequentially('Pausa, Conversa');
  await page
    .getByRole('combobox', { name: 'Avaliação do apoio', exact: true })
    .selectOption('partly');
  await page
    .getByRole('textbox', {
      name: 'Um próximo passo escolhido por você (opcional)',
      exact: true,
    })
    .fill('Organizar uma etapa');
  assert.equal(
    await page
      .getByRole('dialog')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
    true,
  );
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  const saved = (await data('afetivo_entries_v2'))[0];
  assert.equal(saved.recordKind, 'daily_summary');
  assert.equal(saved.moodScore, 0);
  assert.equal(saved.activationLevel, 5);
  assert.deepEqual(saved.emotions, ['Frustração', 'Entusiasmo', 'Curiosidade']);
  assert.deepEqual(saved.contexts, ['Interrupções']);
  assert.deepEqual(saved.protectiveFactors, ['Pausa', 'Conversa']);
  assert.equal(saved.nextStep, 'Organizar uma etapa');
  assert.equal(saved.strategyEffect, 'partly');
  await page.getByRole('button', { name: 'Diário', exact: true }).click();
  await page.getByText('Resumo do dia', { exact: true }).waitFor();
  await page.locator('button[title="Editar registro"]').first().click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  assert.equal((await data('afetivo_entries_v2')).length, 1);
  assert.deepEqual((await data('afetivo_entries_v2'))[0], saved);
});

test('pattern analysis stays local and does not require an AI endpoint', async () => {
  await page.evaluate(async () => {
    const s = await import('/src/services/storage.ts');
    s.saveEntries([
      ...s.generateInitialSeedEntries(),
      {
        ...s.generateInitialSeedEntries().at(-1),
        id: 'personal',
        isDemo: false,
        moodScale: 'valence',
        recordKind: 'moment',
        moodScore: 1,
      },
    ]);
  });
  await page.reload({ waitUntil: 'networkidle' });
  let analysisRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/analyze-patterns')) analysisRequests++;
  });
  await page
    .getByRole('button', { name: 'Análise de Padrões', exact: true })
    .click();
  await page.getByText('Análise local e privada', { exact: true }).waitFor();
  assert.equal(analysisRequests, 0);
  await page
    .getByRole('combobox', { name: 'Período da análise', exact: true })
    .selectOption('7');
  await page.getByText(/^1 registros em 1 dias:/).waitFor();
  assert.equal(analysisRequests, 0);
});

async function prepareFolder() {
  await page.addInitScript(() => {
    window.showDirectoryPicker = async () => {
      const root = await navigator.storage.getDirectory();
      return await root.getDirectoryHandle('Afetivo', { create: true });
    };
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: 'Backup & Exportar', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Escolher pasta do Drive', exact: true })
    .click();
  await page.getByText('Acesso autorizado', { exact: false }).waitFor();
}
async function folderFiles() {
  return page.evaluate(async () => {
    const folder = await (
      await navigator.storage.getDirectory()
    ).getDirectoryHandle('Afetivo');
    const files = [];
    for await (const handle of folder.values()) {
      if (handle.kind === 'file')
        files.push({
          name: handle.name,
          text: await (await handle.getFile()).text(),
        });
    }
    return files;
  });
}
test('folder backup writes real JSON files, remembers the folder and restores only after confirmation', async () => {
  await prepareFolder();
  const prior = await page.evaluate(async () => {
    const s = await import('/src/services/storage.ts');
    return JSON.parse(JSON.stringify(s.loadEntries()));
  });
  await page
    .getByRole('button', { name: 'Salvar backup na pasta', exact: true })
    .click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Backup gravado na pasta' })
    .waitFor();
  const copies = await folderFiles();
  assert.equal(copies.length, 1);
  assert.deepEqual(JSON.parse(copies[0].text).entries, prior);
  await page
    .getByRole('checkbox', {
      name: 'Criar backup ao salvar registros',
      exact: true,
    })
    .uncheck();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await seed('clear');
  await page
    .getByRole('button', { name: 'Backup & Exportar', exact: true })
    .click();
  await page.getByText('Acesso autorizado', { exact: false }).waitFor();
  await page
    .getByText('Restaurar uma cópia da pasta (1)', { exact: true })
    .click();
  await page.getByRole('button', { name: /^Restaurar backup de / }).click();
  await page
    .getByRole('dialog', { name: 'Confirmar ação' })
    .getByRole('button', { name: 'Cancelar', exact: true })
    .click();
  assert.deepEqual(await data('afetivo_entries_v2'), []);
  await page.getByRole('button', { name: /^Restaurar backup de / }).click();
  await approve();
  await page
    .getByRole('status')
    .filter({ hasText: 'Backup restaurado: 14 registros' })
    .waitFor();
  assert.deepEqual(await data('afetivo_entries_v2'), prior);
  assert.equal((await folderFiles()).length, 1);
});

test('automatic folder backup keeps working when the backup panel is closed and preserves versions', async () => {
  await seed('clear');
  await prepareFolder();
  assert.equal(
    await page
      .getByRole('checkbox', {
        name: 'Criar backup ao salvar registros',
        exact: true,
      })
      .isChecked(),
    true,
  );
  assert.equal((await folderFiles()).length, 0);
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page.getByRole('button', { name: 'Agradável', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  await page.waitForFunction(async () => {
    const dir = await (
      await navigator.storage.getDirectory()
    ).getDirectoryHandle('Afetivo');
    let count = 0;
    for await (const file of dir.values())
      if (file.kind === 'file' && (await file.getFile()).size > 0) count++;
    return count === 1;
  });
  await page
    .getByRole('button', { name: 'Novo Registro', exact: true })
    .click();
  await page.getByRole('button', { name: 'Desagradável', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Fechar registro' })
    .waitFor({ state: 'hidden' });
  await page.waitForFunction(async () => {
    const dir = await (
      await navigator.storage.getDirectory()
    ).getDirectoryHandle('Afetivo');
    let count = 0;
    for await (const file of dir.values())
      if (file.kind === 'file' && (await file.getFile()).size > 0) count++;
    return count === 2;
  });
  const counts = (await folderFiles())
    .map((file) => JSON.parse(file.text).entries.length)
    .sort();
  assert.deepEqual(counts, [1, 2]);
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: 'Backup & Exportar', exact: true })
    .click();
  await page.getByText('Acesso autorizado', { exact: false }).waitFor();
  assert.equal(
    await page
      .getByRole('checkbox', {
        name: 'Criar backup ao salvar registros',
        exact: true,
      })
      .isChecked(),
    true,
  );
});

test('cancelled folder selection and unsupported browsers retain downloadable backups', async () => {
  await page.evaluate(() => {
    window.showDirectoryPicker = async () => {
      throw new DOMException('Cancelled', 'AbortError');
    };
  });
  await page
    .getByRole('button', { name: 'Backup & Exportar', exact: true })
    .click();
  const prior = await data('afetivo_entries_v2');
  await page
    .getByRole('button', { name: 'Escolher pasta do Drive', exact: true })
    .click();
  assert.deepEqual(await data('afetivo_entries_v2'), prior);
  assert.equal(
    await page
      .getByRole('button', { name: 'Salvar backup na pasta', exact: true })
      .count(),
    0,
  );
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.evaluate(() => {
    window.showDirectoryPicker = undefined;
  });
  await page
    .getByRole('button', { name: 'Backup & Exportar', exact: true })
    .click();
  assert.equal(
    await page
      .getByRole('button', { name: 'Escolher pasta do Drive', exact: true })
      .isDisabled(),
    true,
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Backup JSON Completo/ }).click();
  await download;
});

test('a corrupt folder snapshot is rejected before confirmation and preserves the diary', async () => {
  await prepareFolder();
  const prior = await data('afetivo_entries_v2');
  await page.evaluate(async () => {
    const folder = await (
      await navigator.storage.getDirectory()
    ).getDirectoryHandle('Afetivo');
    const handle = await folder.getFileHandle('afetivo-backup-corrupt.json', {
      create: true,
    });
    const stream = await handle.createWritable();
    await stream.write('{"entries":[null],"medications":[]}');
    await stream.close();
  });
  await page
    .getByRole('button', { name: 'Atualizar backups da pasta', exact: true })
    .click();
  await page
    .getByText('Restaurar uma cópia da pasta (1)', { exact: true })
    .click();
  await page.getByRole('button', { name: /^Restaurar backup de / }).click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'Item de backup inválido.' })
    .waitFor();
  assert.equal(
    await page.getByRole('dialog', { name: 'Confirmar ação' }).count(),
    0,
  );
  assert.deepEqual(await data('afetivo_entries_v2'), prior);
});

test('revoked folder permission pauses automation and preserves prior backups and local entries', async () => {
  await page.addInitScript(() => {
    window.folderDenied = false;
    window.showDirectoryPicker = async () => {
      const native = await (
        await navigator.storage.getDirectory()
      ).getDirectoryHandle('Afetivo', { create: true });
      return {
        kind: 'directory',
        name: native.name,
        values: () => native.values(),
        getFileHandle: (...args) => native.getFileHandle(...args),
        removeEntry: (...args) => native.removeEntry(...args),
        queryPermission: async () =>
          window.folderDenied ? 'denied' : 'granted',
        requestPermission: async () =>
          window.folderDenied ? 'denied' : 'granted',
      };
    };
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: 'Backup & Exportar', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Escolher pasta do Drive', exact: true })
    .click();
  await page.getByText('Acesso autorizado', { exact: false }).waitFor();
  assert.equal(
    await page
      .getByRole('checkbox', {
        name: 'Criar backup ao salvar registros',
        exact: true,
      })
      .isChecked(),
    true,
  );
  await page
    .getByRole('button', { name: 'Salvar backup na pasta', exact: true })
    .click();
  await page
    .getByRole('status')
    .filter({ hasText: 'Backup gravado na pasta' })
    .waitFor();
  const prior = await data('afetivo_entries_v2');
  await page.evaluate(() => {
    window.folderDenied = true;
  });
  await page
    .getByRole('button', { name: 'Salvar backup na pasta', exact: true })
    .click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'O navegador não autorizou a pasta.' })
    .waitFor();
  assert.equal(
    await page
      .getByRole('button', { name: 'Salvar backup na pasta', exact: true })
      .count(),
    0,
  );
  assert.equal((await folderFiles()).length, 1);
  assert.deepEqual(await data('afetivo_entries_v2'), prior);
  await page.evaluate(() => {
    window.folderDenied = false;
  });
  await page
    .getByRole('button', { name: 'Autorizar pasta salva', exact: true })
    .click();
  await page.getByText('Acesso autorizado', { exact: false }).waitFor();
  assert.equal(
    await page
      .getByRole('checkbox', {
        name: 'Criar backup ao salvar registros',
        exact: true,
      })
      .isChecked(),
    true,
  );
});
