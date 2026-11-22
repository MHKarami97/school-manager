const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const publicDataDir = path.join(__dirname, '..', 'public', 'data', 'questions');
const downloadsDir = path.join(__dirname, '..', 'public', 'downloads', 'questions');

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

function exportQuestionsToExcel(questions, filePath) {
  const rows = questions.map((q, idx) => ({
    'ردیف': idx + 1,
    'شناسه سوال': q.id,
    'پایه تحصیلی': q.grade,
    'شناسه درس': q.courseId,
    'متن سوال': q.text,
    'گزینه ۱': q.options[0] || '',
    'گزینه ۲': q.options[1] || '',
    'گزینه ۳': q.options[2] || '',
    'گزینه ۴': q.options[3] || '',
    'پاسخ صحیح (۱ تا ۴)': Number(q.correctAnswer) + 1,
    'سطح دشواری': q.difficulty || 'متوسط',
    'نکات و پاسخ تشریحی': q.explanation || '',
    'بارم پیشنهادی': q.suggestedScore || 1
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'بانک سوالات استاندارد');
  XLSX.writeFile(workbook, filePath);
  console.log(`Saved Excel: ${path.basename(filePath)} (${questions.length} questions)`);
}

// 1. هر پایه از ۱ تا ۱۲
for (let g = 1; g <= 12; g++) {
  const jsonPath = path.join(publicDataDir, `grade-${g}.json`);
  if (fs.existsSync(jsonPath)) {
    const qs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const xlsxPath = path.join(downloadsDir, `grade-${g}-questions.xlsx`);
    exportQuestionsToExcel(qs, xlsxPath);
  }
}

// 2. بسته جامع ابتدایی
const elemJson = path.join(publicDataDir, 'elementary-curriculum-questions.json');
if (fs.existsSync(elemJson)) {
  const qs = JSON.parse(fs.readFileSync(elemJson, 'utf8'));
  exportQuestionsToExcel(qs, path.join(downloadsDir, 'elementary-all-grades-questions.xlsx'));
}

// 3. بسته جامع متوسطه اول
const lowerSecJson = path.join(publicDataDir, 'lower-secondary-curriculum-questions.json');
if (fs.existsSync(lowerSecJson)) {
  const qs = JSON.parse(fs.readFileSync(lowerSecJson, 'utf8'));
  exportQuestionsToExcel(qs, path.join(downloadsDir, 'lower-secondary-all-grades-questions.xlsx'));
}

// 4. بسته جامع متوسطه دوم
const upperSecJson = path.join(publicDataDir, 'upper-secondary-curriculum-questions.json');
if (fs.existsSync(upperSecJson)) {
  const qs = JSON.parse(fs.readFileSync(upperSecJson, 'utf8'));
  exportQuestionsToExcel(qs, path.join(downloadsDir, 'upper-secondary-all-grades-questions.xlsx'));
}

console.log('All Excel question files successfully generated!');
