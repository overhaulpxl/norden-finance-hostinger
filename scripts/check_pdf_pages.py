import fitz

def inspect_pdf(filename):
    print(f"--- Inspecting {filename} ---")
    doc = fitz.open(filename)
    print(f"Total pages: {len(doc)}")
    for i, page in enumerate(doc):
        print(f"Page {i+1} Text Length: {len(page.get_text())}")
        print(page.get_text()[:300])

inspect_pdf("test-report-with-goals.pdf")
inspect_pdf("test-report-empty-goals.pdf")
