"""Optional independent reader diagnostic; pypdfium2 lives outside app dependencies.
Run: /tmp/cvforge-f8/pdfium-tools/bin/python scripts/f8-pdfium-check.py OUTPUT
"""
import json, pathlib, sys
import pypdfium2 as pdfium
root = pathlib.Path(sys.argv[1])
results = []
for item in json.loads((root / 'metrics.json').read_text())['results']:
    name = item['name']
    doc = pdfium.PdfDocument(root / (name + '.pdf'))
    assert len(doc) == item['pageCount'], name
    pages = []
    for page in doc:
        text = page.get_textpage()
        pages.append(text.get_text_range().replace('\r\n', '\n'))
        text.close()
        page.close()
    all_text = '\n'.join(pages)
    assert 'PRIVATE_' not in all_text, name
    assert 'Persona de prueba Ștefan' in all_text, name
    if name.startswith('large-'):
        previous = -1
        for n in range(1, 49):
            marker = f'F8_END_{n:02}'
            assert all_text.count(marker) == 1, (name, marker)
            assert all_text.index(marker) > previous, name
            previous = all_text.index(marker)
    if name.startswith('oversized-'):
        assert all_text.count('OVERSIZED_START') == 1, name
        assert all_text.count('OVERSIZED_END') == 1, name
        for n in range(8):
            assert all_text.count(f'LIST_END_{n}') == 1, name
    if not name.startswith('minimal-'):
        for glyph in 'áéíóúñ¿¡ăâîșț':
            assert glyph in all_text, (name, glyph)
    (root / (name + '-pdfium-text.txt')).write_text(all_text)
    results.append({'name': name, 'pages': len(doc), 'selectableCharacters': len(all_text), 'completeMarkers': True})
    doc.close()
(root / 'pdfium-inspection.json').write_text(json.dumps({'reader': str(pdfium.PYPDFIUM_INFO), 'pdfium': str(pdfium.PDFIUM_INFO), 'results': results}, indent=2))
print('PDFium PASS', len(results))
