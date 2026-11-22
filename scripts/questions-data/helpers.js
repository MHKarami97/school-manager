/**
 * کمکی‌های تولید سوالات استاندارد ابتدایی
 */

export function createQuestion({
  text,
  options,
  correctAnswer,
  courseId,
  grade,
  difficulty = 'متوسط',
  tags = [],
  suggestedScore = 1,
  explanation = '',
}) {
  if (!text || typeof text !== 'string') throw new Error(`Invalid text: ${text}`)
  if (!Array.isArray(options) || options.length !== 4) {
    throw new Error(`Options must be an array of 4 items for: ${text}`)
  }
  const strCorrect = String(correctAnswer)
  if (!['0', '1', '2', '3'].includes(strCorrect)) {
    throw new Error(`correctAnswer must be '0','1','2','3' for: ${text}, got ${correctAnswer}`)
  }
  if (!['آسان', 'متوسط', 'سخت'].includes(difficulty)) {
    throw new Error(`Invalid difficulty: ${difficulty}`)
  }
  if (typeof grade !== 'number' || grade < 1 || grade > 6) {
    throw new Error(`Invalid grade: ${grade}`)
  }

  return {
    id: `${courseId}-g${grade}-${Math.random().toString(36).substring(2, 9)}`,
    text: text.trim(),
    type: 'multiple-choice',
    options: options.map((opt) => String(opt).trim()),
    correctAnswer: strCorrect,
    courseId,
    grade,
    difficulty,
    tags: Array.isArray(tags) ? tags : [tags],
    suggestedScore,
    explanation: explanation.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * تبدیل اعداد انگلیسی به فارسی برای متن‌های ریاضی و فارسی
 */
export function toPersianDigits(n) {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/[0-9]/g, (w) => farsiDigits[+w])
}

/**
 * جابجایی تصادفی گزینه‌ها با حفظ اندیس پاسخ صحیح
 */
export function shuffleOptions(options, correctIdx) {
  const correctVal = options[correctIdx]
  const shuffled = [...options]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const newCorrectIdx = shuffled.indexOf(correctVal)
  return {
    options: shuffled,
    correctAnswer: String(newCorrectIdx),
  }
}
