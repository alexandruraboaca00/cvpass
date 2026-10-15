// Generador de controles sintéticos de investigación; no es el exportador del producto.
import java.io.*;
import java.nio.file.*;
import java.util.*;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.*;
import org.apache.pdfbox.pdmodel.common.filespecification.*;
import org.apache.pdfbox.pdmodel.font.*;
import org.apache.pdfbox.pdmodel.encryption.*;
import org.apache.pdfbox.pdmodel.interactive.form.*;
import org.apache.pdfbox.pdfwriter.compress.CompressParameters;
import org.apache.pdfbox.cos.COSName;

public class PdfCompatibilityFixtures {
 static Path out=Path.of("/tmp/europass-seguimiento/corpus");
 static void line(PDPageContentStream c,PDFont f,float x,float y,String s)throws Exception{c.beginText();c.setFont(f,11);c.newLineAtOffset(x,y);c.showText(s);c.endText();}
 static void attach(PDDocument d,String name,byte[] data)throws Exception{
  PDDocumentNameDictionary names=d.getDocumentCatalog().getNames();if(names==null)names=new PDDocumentNameDictionary(d.getDocumentCatalog());
  PDEmbeddedFilesNameTreeNode tree=names.getEmbeddedFiles();if(tree==null)tree=new PDEmbeddedFilesNameTreeNode();
  Map<String,PDComplexFileSpecification> entries=new TreeMap<>();if(tree.getNames()!=null)entries.putAll(tree.getNames());
  PDComplexFileSpecification spec=new PDComplexFileSpecification();spec.setFile(name);spec.setFileUnicode(name);PDEmbeddedFile ef=new PDEmbeddedFile(d,new ByteArrayInputStream(data));ef.setSubtype(name.endsWith(".xml")?"application/xml":"text/plain");ef.setSize(data.length);spec.setEmbeddedFile(ef);spec.setEmbeddedFileUnicode(ef);entries.put(name,spec);tree.setNames(entries);names.setEmbeddedFiles(tree);d.getDocumentCatalog().setNames(names);
 }
 static void make(String name,float version,String mode)throws Exception{
  try(PDDocument d=new PDDocument()){
   d.setVersion(version);d.getDocument().setVersion(version);PDRectangle size=mode.equals("landscape")?new PDRectangle(842,595):mode.equals("rotated")?PDRectangle.LETTER:PDRectangle.A4;PDPage p=new PDPage(size);if(mode.equals("rotated"))p.setRotation(90);d.addPage(p);
   PDFont f=mode.equals("unicode")?PDType0Font.load(d,new File("/usr/share/fonts/TTF/DejaVuSans.ttf")):new PDType1Font(Standard14Fonts.FontName.HELVETICA);
   try(PDPageContentStream c=new PDPageContentStream(d,p)){
    line(c,f,45,size.getHeight()-55,"Persona Ficticia REA");line(c,f,45,size.getHeight()-80,"rea@example.invalid");
    if(mode.equals("columns")){for(int i=0;i<8;i++)line(c,f,40,710-i*22,"CONTACTO "+i);for(int i=0;i<8;i++)line(c,f,230,710-i*22,"EXPERIENCIA "+i+" Empresa ficticia");}
    else{line(c,f,45,size.getHeight()-120,"EXPERIENCIA 2024-2025: Analista de prueba");line(c,f,45,size.getHeight()-145,mode.equals("unicode")?"Formación, experiență, Ελληνικά":"EDUCACION: Certificado ficticio 2023");line(c,f,45,size.getHeight()-170,"SKILLS: Python, SQL, trabajo en equipo");}
   }
   if(mode.equals("form")){PDAcroForm form=new PDAcroForm(d);PDResources res=new PDResources();res.put(COSName.getPDFName("Helv"),f);form.setDefaultResources(res);form.setDefaultAppearance("/Helv 10 Tf 0 g");d.getDocumentCatalog().setAcroForm(form);PDTextField field=new PDTextField(form);field.setPartialName("correo_rea");field.setDefaultAppearance("/Helv 10 Tf 0 g");form.getFields().add(field);field.getWidgets().get(0).setRectangle(new PDRectangle(45,520,250,25));field.getWidgets().get(0).setPage(p);p.getAnnotations().add(field.getWidgets().get(0));field.setValue("rea@example.invalid");}
   if(mode.equals("password")||mode.equals("restricted")||mode.equals("xml-password")||mode.equals("xml-restricted")){AccessPermission ap=new AccessPermission();ap.setCanExtractContent(!mode.endsWith("restricted"));StandardProtectionPolicy policy=new StandardProtectionPolicy("propietario-ficticio-rea",mode.endsWith("password")?"clave-rea":"",ap);policy.setEncryptionKeyLength(128);d.protect(policy);}
   byte[] xml=Files.readAllBytes(Path.of("/tmp/europass-pdf-research-b83cd0/all-sections.xml"));
   if(mode.equals("xml")||mode.equals("xml-password")||mode.equals("xml-restricted"))attach(d,"attachment.xml",xml);
   if(mode.equals("xml-utf16"))attach(d,"attachment.xml",new String(xml,java.nio.charset.StandardCharsets.UTF_8).replaceFirst("encoding=\"UTF-8\"","encoding=\"UTF-16\"").replaceFirst("encoding='utf-8'","encoding='UTF-16'").getBytes(java.nio.charset.StandardCharsets.UTF_16));
   if(mode.equals("renamed"))attach(d,"datos-cv.xml",xml);
   if(mode.equals("several")){attach(d,"aaa-nota.txt","Control ficticio de adjuntos".getBytes());attach(d,"attachment.xml",xml);attach(d,"zzz-nota.xml","<nota>Control</nota>".getBytes());}
   if(mode.equals("invalidxml"))attach(d,"attachment.xml","<cv><name>Persona ficticia</name></cv>".getBytes());
   d.getDocumentInformation().setTitle("Control de compatibilidad REA");d.save(out.resolve(name+".pdf").toString(),version<1.5f?CompressParameters.NO_COMPRESSION:CompressParameters.DEFAULT_COMPRESSION);
  }
 }
 public static void main(String[] args)throws Exception{
  Files.createDirectories(out);
  if(args.length>0&&args[0].equals("extended")){make("xml-20",2.0f,"xml");make("xml-con-clave",1.7f,"xml-password");make("xml-restricciones",1.7f,"xml-restricted");make("xml-utf16",1.7f,"xml-utf16");System.out.println("Controles adicionales generados: 4");return;}
  make("texto-14",1.4f,"plain");make("unicode-17",1.7f,"unicode");make("dos-columnas",1.7f,"columns");make("letter-rotado",1.7f,"rotated");make("a4-apaisado",1.7f,"landscape");make("formulario",1.7f,"form");make("con-clave",1.7f,"password");make("restricciones",1.7f,"restricted");make("xml-europass",1.4f,"xml");make("xml-renombrado",1.7f,"renamed");make("varios-adjuntos",1.7f,"several");make("xml-no-compatible",1.7f,"invalidxml");make("texto-20",2.0f,"plain");
  System.out.println("Controles sintéticos generados: 13");
 }
}
