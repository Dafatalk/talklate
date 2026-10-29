# Abre cada .docx en LibreOffice, actualiza indices y campos, y guarda .docx y .pdf
import sys, os, time, subprocess, uno
from com.sun.star.beans import PropertyValue
def prop(n, v):
    p = PropertyValue(); p.Name = n; p.Value = v; return p
proc = subprocess.Popen(['soffice', '--headless', '--invisible', '--norestore', '-env:UserInstallation=file:///tmp/claude-0/lo_uno', '--accept=socket,host=127.0.0.1,port=2002;urp;'])
ctx = None
for _ in range(60):
    try:
        local = uno.getComponentContext()
        res = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
        ctx = res.resolve('uno:socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext'); break
    except Exception: time.sleep(1)
desk = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
for f in sys.argv[1:]:
    url = uno.systemPathToFileUrl(os.path.abspath(f))
    doc = desk.loadComponentFromURL(url, '_blank', 0, (prop('Hidden', True),))
    idx = doc.getDocumentIndexes()
    for i in range(idx.getCount()): idx.getByIndex(i).update()
    doc.getTextFields().refresh()
    for i in range(idx.getCount()): idx.getByIndex(i).update()
    doc.storeToURL(url, (prop('FilterName', 'MS Word 2007 XML'),))
    doc.storeToURL(url[:-5] + '.pdf', (prop('FilterName', 'writer_pdf_Export'),))
    doc.close(True)
    print('ok', f)
try: desk.terminate()
except Exception: pass
proc.wait(timeout=30)
