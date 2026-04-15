using PdfSharp.Drawing;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

// load existing PDF Formular
PdfDocument origDocument = PdfReader.Open(".\\Formular.pdf", PdfDocumentOpenMode.Import);

// Create new PDF document
PdfDocument newDocument = new PdfDocument();

// Copy all pages from existing PDF to new PDF
foreach (var origPage in origDocument.Pages)
{
    newDocument.AddPage(origPage);
}

// Open Page 1 in new document
PdfPage page = newDocument.Pages[0];

XGraphics gfx = XGraphics.FromPdfPage(page);

// Draw some helper lines to new document
XColor colorHelpLines = XColors.LightGreen;
XPen lineRed = new XPen(colorHelpLines, 1);
XFont font = new XFont("Verdana", 6, XFontStyle.Regular);
XRect rect = new XRect(0, 0, 20, 10);
for (int y = 0; y < page.Height; y = y + 24)
{
    gfx.DrawLine(lineRed, 0, y, page.Width, y);
    rect.Y = y;
    gfx.DrawString(y.ToString(), font, XBrushes.LightGreen, rect, XStringFormats.BottomLeft);
}

// Write text to PDF
XFont fontText = new XFont("Verdana", 10, XFontStyle.Regular);

XRect rectText = new XRect(65, 264, 350, 24);
gfx.DrawString("Fleischer", fontText, XBrushes.Black, rectText, XStringFormats.BottomLeft);

rectText = new XRect(65, 288, 350, 24);
gfx.DrawString("Horst", fontText, XBrushes.Black, rectText, XStringFormats.BottomLeft);

// Save PDF
newDocument.Save(".\\FormularAusgefuellt.pdf");
