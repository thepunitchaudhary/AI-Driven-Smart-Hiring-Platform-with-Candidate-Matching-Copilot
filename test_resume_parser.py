import csv
import json
import os
import sys
from resume_parser import parse_resume

FIELDS = ["name", "email", "phone", "location", "education", "experience",
          "skills", "projects", "certifications"]


def only_digits(text):
    return "".join(ch for ch in text if ch.isdigit())


def check_field(field, profile, expected):
    if field == "name":
        return profile["name"].lower() == expected["name"].lower()
    if field == "email":
        return profile["email"].lower() == expected["email"].lower()
    if field == "phone":
        return only_digits(profile["phone"]) == only_digits(expected["phone"])
    if field == "location":
        return profile["location"].lower() == expected["location"].lower()
    if field == "education":
        found = " ".join(profile["education"]).lower()
        return expected["degree"].lower() in found and expected["university"].lower() in found
    if field == "experience":
        return profile["experience"] == expected["experience"]
    if field == "skills":
        got = set(s.lower() for s in profile["skills"])
        want = set(s.lower() for s in expected["skills"])
        recall = len(got & want) / len(want) if want else 1
        precision = len(got & want) / len(got) if got else 1
        return recall >= 0.9 and precision >= 0.9
    got_text = " ".join(profile[field]).lower()
    items = expected[field]
    if len(items) == 0:
        return len(profile[field]) == 0
    return all(item.lower() in got_text for item in items)


folder = sys.argv[1] if len(sys.argv) > 1 else "test_resumes"

with open(os.path.join(folder, "expected.json")) as f:
    all_expected = json.load(f)

rows = []
field_correct = {field: 0 for field in FIELDS}
total_correct = 0
total_checks = 0

for file_name, expected in all_expected.items():
    profile = parse_resume(os.path.join(folder, file_name))
    row = {"file": file_name}
    for field in FIELDS:
        ok = check_field(field, profile, expected)
        row[field] = "OK" if ok else "WRONG"
        if ok:
            field_correct[field] += 1
            total_correct += 1
        else:
            print("WRONG", file_name, field, "| got:", profile[field], "| expected:", expected.get(field, expected.get("degree")))
        total_checks += 1
    rows.append(row)

print()
print("Per field accuracy")
for field in FIELDS:
    print("  %-15s %5.1f%%" % (field, field_correct[field] / len(rows) * 100))
print()
print("Overall accuracy: %.2f%% (%d of %d fields correct, %d resumes)" % (
    total_correct / total_checks * 100, total_correct, total_checks, len(rows)))

with open("accuracy_report.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["file"] + FIELDS)
    writer.writeheader()
    writer.writerows(rows)
