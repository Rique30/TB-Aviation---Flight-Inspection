// ===== BACKUP AUTOMÁTICO POR EMAIL =====
// Disparado semanalmente pelo cron do vercel.json (Vercel injeta o header
// Authorization com CRON_SECRET automaticamente — não precisa configurar isso).
// Mesmo estilo usado no projeto de despesas: nodemailer + SMTP, sem depender
// de nenhum provedor de email novo — só a caixa de email que você já usa.
//
// Setup necessário nas Environment Variables do projeto na Vercel:
//   CRON_SECRET         → qualquer string secreta (ex: gerar com `openssl rand -hex 32`)
//   UPSTASH_REST_URL    → mesmo valor de _UPSTASH_URL em firebase-sync.js
//   UPSTASH_REST_TOKEN  → mesmo valor de _UPSTASH_TOKEN em firebase-sync.js
//   SMTP_HOST           → ex: smtp.gmail.com
//   SMTP_PORT           → opcional, default 587
//   SMTP_USER           → email/usuário da conta SMTP
//   SMTP_PASS           → senha (ou senha de app, ex: App Password do Gmail)
//   BACKUP_EMAIL        → email que vai receber o backup (opcional, tem default abaixo)
//
// Depois de criar/alterar env vars na Vercel é preciso fazer um redeploy manual
// para elas passarem a valer (não é aplicado a builds já existentes).

const nodemailer = require('nodemailer');
const archiver = require('archiver');

const BASE_USERS = ['gabriela', 'caio', 'thomas', 'henrique', 'matheus', 'rafael', 'luis', 'rafaelh'];
const AC_REGS = [
  'PP-JDB', 'PP-JMJ', 'PP-NRN',
  'PR-EOB', 'PR-JAQ', 'PR-JGG', 'PR-RCF',
  'PS-BYO', 'PS-CGM', 'PS-FRN', 'PS-INJ', 'PS-MNC', 'PS-PHE', 'PS-RAR', 'PS-TJM', 'PS-VJZ', 'PS-WRA',
  'PT-LBM', 'PT-TJS'
];
const MAX_PHOTO_BYTES = 15 * 1024 * 1024; // orçamento de fotos no zip, pra não deixar o email gigante

async function upstashPipeline(url, token, cmds) {
  const r = await fetch(url + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('Upstash pipeline falhou: HTTP ' + r.status);
  return r.json();
}

async function fetchAllBackupData() {
  const url = process.env.UPSTASH_REST_URL;
  const token = process.env.UPSTASH_REST_TOKEN;
  if (!url || !token) throw new Error('UPSTASH_REST_URL / UPSTASH_REST_TOKEN não configurados');

  // Precisa ler tb7_admin_data primeiro para saber quais usuários "extra" existem
  const [adminProbe] = await upstashPipeline(url, token, [['GET', 'tb7_admin_data']]);
  const adminRaw = adminProbe && adminProbe.result;
  const adminData = adminRaw ? JSON.parse(adminRaw) : null;
  const extraUsers = (adminData && Array.isArray(adminData.users_extra))
    ? adminData.users_extra.map((u) => u.u).filter(Boolean)
    : [];
  const allUsers = Array.from(new Set(BASE_USERS.concat(extraUsers)));

  // Fase 1: dados textuais (checklists, fichas, usuários, log) — sempre incluído, é leve
  const textCmds = [['GET', 'tb7_admin_data'], ['LRANGE', 'tb7_actlog_v1', '0', '-1']]
    .concat(allUsers.map((u) => ['GET', 'tb7_' + u]));
  const textRes = await upstashPipeline(url, token, textCmds);

  const backup = { generated_at: new Date().toISOString(), admin_data: null, actlog: [], users: {} };
  backup.admin_data = textRes[0] && textRes[0].result ? JSON.parse(textRes[0].result) : null;
  const logItems = textRes[1] && Array.isArray(textRes[1].result) ? textRes[1].result : [];
  backup.actlog = logItems.map((s) => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);
  let totalFlight = 0;
  let totalMand = 0;
  let totalVtivte = 0;
  allUsers.forEach((u, i) => {
    const raw = textRes[2 + i] && textRes[2 + i].result;
    const data = raw ? JSON.parse(raw) : null;
    backup.users[u] = data;
    if (data) {
      const fins = data.fins || [];
      totalFlight += fins.filter((f) => !f.type || f.type === 'flight').length;
      totalMand += fins.filter((f) => f.type === 'mandatory').length;
      totalVtivte += (data.vtivte_fins || []).length;
    }
  });
  backup.total_flight = totalFlight;
  backup.total_mandatory = totalMand;
  backup.total_vtivte = totalVtivte;
  backup.total_checklists = totalFlight + totalMand + totalVtivte;

  // Fase 2: fotos — best effort, cortado se ultrapassar o orçamento de tamanho
  const photoCmds = allUsers.map((u) => ['GET', 'tb7_' + u + '_fp'])
    .concat(AC_REGS.map((r) => ['GET', 'tb7_rimg_' + r.replace(/-/g, '_')]));
  const photoRes = await upstashPipeline(url, token, photoCmds);

  const photos = { users_fp: {}, reg_imgs: {} };
  let photoBytes = 0;
  let photosSkipped = false;
  allUsers.forEach((u, i) => {
    const raw = photoRes[i] && photoRes[i].result;
    if (!raw) return;
    photoBytes += raw.length;
    if (photoBytes > MAX_PHOTO_BYTES) { photosSkipped = true; return; }
    photos.users_fp[u] = JSON.parse(raw);
  });
  AC_REGS.forEach((reg, i) => {
    const raw = photoRes[allUsers.length + i] && photoRes[allUsers.length + i].result;
    if (!raw) return;
    photoBytes += raw.length;
    if (photoBytes > MAX_PHOTO_BYTES) { photosSkipped = true; return; }
    photos.reg_imgs[reg] = raw;
  });
  backup.photos = photos;
  backup.photos_skipped_due_to_size = photosSkipped;
  backup.users_included = allUsers;

  return backup;
}

function criarZipBuffer(nomeArquivo, conteudo) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', reject);
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.append(conteudo, { name: nomeArquivo });
    archive.finalize();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // Só o cron da Vercel (ou quem tiver o CRON_SECRET) pode acionar este backup.
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || req.headers?.Authorization || '';
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const destinatario = process.env.BACKUP_EMAIL || 'ltavares@tbaviation.com.br';

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(500).json({ error: 'SMTP não configurado' });
  }

  try {
    const backup = await fetchAllBackupData();
    const dataArquivo = backup.generated_at.substring(0, 10);
    const zipBuffer = await criarZipBuffer(
      `backup_td_aviation_${dataArquivo}.json`,
      JSON.stringify(backup, null, 2)
    );

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass }
    });

    const sizeMb = (zipBuffer.length / 1024 / 1024).toFixed(2);

    await transporter.sendMail({
      from: `"TD Aviation FI" <${smtpUser}>`,
      to: destinatario,
      subject: `[TD Aviation FI] Backup automático — ${dataArquivo}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#f5f7fa;border-radius:8px;">
          <div style="background:#1B3A6B;padding:16px 24px;border-radius:6px 6px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">TD Aviation FI — Backup Automático</h2>
          </div>
          <div style="background:#fff;padding:20px 24px;border-radius:0 0 6px 6px;border:1px solid #e0e6ef;">
            <p>Backup semanal gerado em ${dataArquivo}.</p>
            <p><strong>Usuários:</strong> ${backup.users_included.length}</p>
            <p><strong>Checklists no total:</strong> ${backup.total_checklists}</p>
            <p style="margin-left:12px;">✈️ Flight: ${backup.total_flight}<br>📋 Mandatory: ${backup.total_mandatory}<br>🛠️ VTI/VTE: ${backup.total_vtivte}</p>
            <p><strong>Tamanho do arquivo:</strong> ${sizeMb} MB</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <p style="color:#888;font-size:12px;">Arquivo em anexo (.zip), contendo o JSON completo do sistema (fichas, checklists e usuários${backup.photos_skipped_due_to_size ? ' — algumas fotos foram omitidas por excederem o limite de tamanho' : ', incluindo fotos'}).</p>
          </div>
        </div>
      `,
      attachments: [{ filename: `backup_td_aviation_${dataArquivo}.zip`, content: zipBuffer }]
    });

    return res.json({
      ok: true,
      to: destinatario,
      users: backup.users_included.length,
      total_checklists: backup.total_checklists,
      total_flight: backup.total_flight,
      total_mandatory: backup.total_mandatory,
      total_vtivte: backup.total_vtivte,
      photos_skipped_due_to_size: backup.photos_skipped_due_to_size
    });
  } catch (err) {
    console.error('/api/backup-automatico error:', err);
    return res.status(500).json({ error: err.message });
  }
};
