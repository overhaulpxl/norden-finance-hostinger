import fitz # PyMuPDF
import sys

def convert_pdf_to_png(pdf_path, prefix):
    print(f"Converting {pdf_path} to images...")
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc):
        # High resolution matrix
        zoom = 2 # zoom factor
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        output_filename = f"{prefix}_page_{i+1}.png"
        pix.save(output_filename)
        print(f"Saved: {output_filename}")

if __name__ == "__main__":
    pdf = "test-report-with-goals.pdf"
    if len(sys.argv) > 1:
        pdf = sys.argv[1]
    
    prefix = pdf.replace(".pdf", "")
    convert_pdf_to_png(pdf, prefix)
