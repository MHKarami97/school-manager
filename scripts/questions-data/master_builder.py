# -*- coding: utf-8 -*-
"""
سازنده تجمیعی بانک سوالات دوره ابتدایی (پایه‌های اول تا ششم)
این اسکریپت تمام سوالات تولید شده را اعتبارسنجی کرده و در قالب JSON ذخیره می‌کند.
"""

import json
import os
import sys

from math_generator import get_all_math_questions
from science_generator import get_all_science_questions
from persian_generator import get_all_persian_questions
from quran_generator import get_all_quran_questions
from heaven_gifts_generator import get_all_heaven_gifts_questions
from social_studies_generator import get_all_social_studies_questions
from thinking_and_work_generator import get_all_thinking_and_work_questions

def build_all_questions():
    print("Collecting questions from all modules...")
    questions = []
    
    questions.extend(get_all_math_questions())
    questions.extend(get_all_science_questions())
    questions.extend(get_all_persian_questions())
    questions.extend(get_all_quran_questions())
    questions.extend(get_all_heaven_gifts_questions())
    questions.extend(get_all_social_studies_questions())
    questions.extend(get_all_thinking_and_work_questions())
    
    print(f"Total raw questions collected: {len(questions)}")
    
    # Validation
    seen_ids = set()
    validated = []
    for q in questions:
        # Check uniqueness of ID
        qid = q["id"]
        if qid in seen_ids:
            qid = f"{q['courseId']}-g{q['grade']}-{len(seen_ids)+1:06d}"
            q["id"] = qid
        seen_ids.add(qid)
        
        # Verify fields
        assert len(q["options"]) == 4, f"Options count must be 4: {q['text']}"
        assert q["correctAnswer"] in ["0", "1", "2", "3"], f"Invalid correctAnswer: {q['correctAnswer']}"
        assert 1 <= q["grade"] <= 6, f"Invalid grade: {q['grade']}"
        assert q["text"], f"Empty question text"
        
        validated.append(q)
        
    print(f"Validation successful: {len(validated)} questions verified.")
    return validated

def save_json_files(questions, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Master JSON
    master_path = os.path.join(output_dir, "elementary-curriculum-questions.json")
    with open(master_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print(f"Saved master file: {master_path} ({len(questions)} questions)")
    
    # 2. Per-grade JSONs
    for grade in range(1, 7):
        grade_questions = [q for q in questions if q["grade"] == grade]
        grade_path = os.path.join(output_dir, f"grade-{grade}.json")
        with open(grade_path, "w", encoding="utf-8") as f:
            json.dump(grade_questions, f, ensure_ascii=False, indent=2)
        print(f"  Grade {grade}: saved {len(grade_questions)} questions to {grade_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
    out_dir = os.path.join(root_dir, "public", "data", "questions")
    
    all_q = build_all_questions()
    save_json_files(all_q, out_dir)
    print("All JSON question files successfully written!")
