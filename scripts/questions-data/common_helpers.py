# -*- coding: utf-8 -*-
"""
توابع کمکی و استانداردسازی سوالات درسی برای پایه‌های ۱ تا ۱۲
"""

import random

FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")

def to_fa(num):
    return str(num).translate(FA_DIGITS)

def build_distinct_options(correct_val, distractors):
    """
    تضمین اکید ساخت ۴ گزینه کاملاً متمایز
    """
    res = [str(correct_val).strip()]
    for d in distractors:
        s = str(d).strip()
        if s not in res:
            res.append(s)
        if len(res) == 4:
            break
    
    counter = 1
    while len(res) < 4:
        cand = f"{correct_val} ({to_fa(counter)})"
        if cand not in res:
            res.append(cand)
        counter += 1
        
    return res

def make_q(text, options, correct_idx, grade, course_id, difficulty="متوسط", tags=None, score=1, explanation=""):
    """
    تولید یک آبجکت استاندارد سوال چهارگزینه‌ای با اعتبارسنجی دقیق
    """
    assert len(options) == 4, f"Options count must be 4: {text}"
    options = [str(opt).strip() for opt in options]
    correct_val = options[correct_idx]
    
    # اگر گزینه‌ها حاوی مقدار تکراری باشند، با دیستراکتورهای جدید متمایز کن
    if len(set(options)) < 4:
        distractors = [opt for i, opt in enumerate(options) if i != correct_idx]
        options = build_distinct_options(correct_val, distractors)
        correct_val = options[0]
    
    shuffled = options[:]
    random.shuffle(shuffled)
    new_correct_idx = shuffled.index(correct_val)
    
    # تعیین تگ‌های پیش‌فرض در صورت عدم ارسال
    if not tags:
        tags = [course_id, f"پایه {grade}"]
        
    return {
        "id": f"{course_id}-g{grade}-{random.randint(100000, 999999)}",
        "text": text.strip(),
        "type": "multiple-choice",
        "options": shuffled,
        "correctAnswer": str(new_correct_idx),
        "courseId": course_id,
        "grade": grade,
        "difficulty": difficulty,
        "tags": tags,
        "suggestedScore": score,
        "explanation": explanation.strip() or f"پاسخ صحیح گزینه {new_correct_idx + 1} یعنی «{correct_val}» است.",
    }
