from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph


def extract_text_docx(path):
    doc = Document(path)
    text = ""
    for child in doc.element.body.iterchildren():
        if child.tag.endswith("}p"):
            text = text + Paragraph(child, doc).text + "\n"
        elif child.tag.endswith("}tbl"):
            table = Table(child, doc)
            for row in table.rows:
                seen = []
                for cell in row.cells:
                    if cell.text not in seen:
                        seen.append(cell.text)
                        text = text + cell.text + "\n"
    return text
